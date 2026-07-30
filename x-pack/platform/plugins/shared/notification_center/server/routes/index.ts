/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ReservedPrivilegesSet, type CoreSetup, type Logger } from '@kbn/core/server';
import { SEVERITIES } from '../../common/notification_schema';
import type { Severity } from '../../common/types';
import { queryNotifications, type NotificationGroup } from '../query_notifications';
import { annotateReadState, getReadState, DEFAULT_READ_STATE, type ReadState } from '../read_state';
import { READ_KEY, READ_ALL_BEFORE_KEY } from '../user_storage';
import type { NotificationCenterPluginStart, NotificationCenterStartDependencies } from '../types';

/** Ceiling mirrors the userStorage `read` schema so a `set` never fails validation. */
const MAX_READ_IDS = 500;

const INTERNAL_BASE = '/internal/notification_center';
const API_VERSION = '1';
const NO_PROFILE_MESSAGE = 'A user profile is required to change read state.';

type NotificationCenterCore = CoreSetup<
  NotificationCenterStartDependencies,
  NotificationCenterPluginStart
>;

/** Read-state annotation is user-scoped, so every route runs as the authenticated user. */
const notificationsAuthz = { authz: { requiredPrivileges: [ReservedPrivilegesSet.superuser] } };

/** Split a comma-separated `severity` query value into validated tiers. */
const parseSeverities = (raw?: string): Severity[] | undefined => {
  if (!raw) {
    return undefined;
  }
  const tiers = raw.split(',').map((value) => value.trim());
  const invalid = tiers.filter((tier) => !SEVERITIES.includes(tier as Severity));
  if (invalid.length) {
    throw new Error(`unknown severity tier(s): ${invalid.join(', ')}`);
  }
  return tiers as Severity[];
};

export const registerNotificationRoutes = (core: NotificationCenterCore, logger: Logger): void => {
  const router = core.http.createRouter();

  /** Load collapsed groups for the request's filters, without pagination. */
  const loadGroups = async (params: {
    namespace?: string;
    type?: string;
    severity?: Severity[];
  }): Promise<NotificationGroup[]> => {
    const [{ dataStreams }] = await core.getStartServices();
    return queryNotifications({ dataStreams, logger }, params);
  };

  const listRoute = router.versioned.get({
    path: `${INTERNAL_BASE}/notifications`,
    access: 'internal',
    security: notificationsAuthz,
  });
  listRoute.addVersion(
    {
      version: API_VERSION,
      validate: {
        request: {
          query: schema.object({
            namespace: schema.maybe(schema.string()),
            type: schema.maybe(schema.string()),
            severity: schema.maybe(schema.string()),
            unread: schema.boolean({ defaultValue: false }),
            page: schema.number({ min: 1, defaultValue: 1 }),
            perPage: schema.number({ min: 1, max: 100, defaultValue: 20 }),
          }),
        },
      },
    },
    async (_ctx, request, response) => {
      let severity: Severity[] | undefined;
      try {
        severity = parseSeverities(request.query.severity);
      } catch (err) {
        return response.badRequest({ body: { message: (err as Error).message } });
      }

      const { namespace, type, unread, page, perPage } = request.query;
      const groups = await loadGroups({ namespace, type, severity });

      const [{ userStorage }] = await core.getStartServices();
      const client = userStorage.asScoped(request);
      // Demo branch: the stage-3 first-call stamp (stampInitialReadAllBefore) is
      // not wired up, so the seeded backlog stays visibly unread for every fresh
      // browser profile instead of being auto-read on the first flyout open.
      const state: ReadState = client ? await getReadState(client) : DEFAULT_READ_STATE;

      const annotated = annotateReadState(groups, state);
      const filtered = unread ? annotated.filter(({ isRead }) => !isRead) : annotated;
      const start = (page - 1) * perPage;

      return response.ok({
        body: { notifications: filtered.slice(start, start + perPage), total: filtered.length },
      });
    }
  );

  const unreadCountRoute = router.versioned.get({
    path: `${INTERNAL_BASE}/notifications/_unread_count`,
    access: 'internal',
    security: notificationsAuthz,
  });
  unreadCountRoute.addVersion(
    { version: API_VERSION, validate: false },
    async (_ctx, request, response) => {
      const groups = await loadGroups({});

      const [{ userStorage }] = await core.getStartServices();
      const client = userStorage.asScoped(request);
      // Shares the exact annotation path with the list route, but never stamps.
      const state = client ? await getReadState(client) : DEFAULT_READ_STATE;

      const annotated = annotateReadState(groups, state);
      const unreadCount = annotated.filter(({ isRead }) => !isRead).length;
      return response.ok({ body: { unreadCount, total: annotated.length } });
    }
  );

  const markReadRoute = router.versioned.post({
    path: `${INTERNAL_BASE}/notifications/_mark_read`,
    access: 'internal',
    security: notificationsAuthz,
  });
  markReadRoute.addVersion(
    {
      version: API_VERSION,
      validate: {
        request: {
          body: schema.object({
            notificationIds: schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1 }),
          }),
        },
      },
    },
    async (_ctx, request, response) => {
      const [{ userStorage }] = await core.getStartServices();
      const client = userStorage.asScoped(request);
      if (!client) {
        return response.forbidden({ body: { message: NO_PROFILE_MESSAGE } });
      }

      const current = await client.get<string[]>(READ_KEY);
      // Newest ids appended last; trim from the front so the 500-id cap keeps the most recent.
      const merged = [...new Set([...current, ...request.body.notificationIds])].slice(
        -MAX_READ_IDS
      );
      await client.set<string[]>(READ_KEY, merged);

      return response.ok({ body: { read: merged.length } });
    }
  );

  const markAllReadRoute = router.versioned.post({
    path: `${INTERNAL_BASE}/notifications/_mark_all_read`,
    access: 'internal',
    security: notificationsAuthz,
  });
  markAllReadRoute.addVersion(
    { version: API_VERSION, validate: false },
    async (_ctx, request, response) => {
      const [{ userStorage }] = await core.getStartServices();
      const client = userStorage.asScoped(request);
      if (!client) {
        return response.forbidden({ body: { message: NO_PROFILE_MESSAGE } });
      }

      // Advancing the marker subsumes every current notification; the per-id list resets.
      await client.set<string>(READ_ALL_BEFORE_KEY, new Date().toISOString());
      await client.set<string[]>(READ_KEY, []);

      return response.ok({ body: { success: true } });
    }
  );
};
