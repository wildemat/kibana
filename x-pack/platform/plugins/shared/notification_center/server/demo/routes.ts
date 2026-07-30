/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ReservedPrivilegesSet, type CoreSetup, type Logger } from '@kbn/core/server';
import type { NotificationCenterPluginSetup } from '../types';
import { NOTIFICATION_DATA_STREAM_NAME } from '../data_stream/notification_data_stream';
import { NotificationValidationError } from '../submit';
import { seedDemoNotifications, type LooseForType } from './seed';

const INTERNAL_BASE = '/internal/notification_center';
const API_VERSION = '1';

/**
 * Demo-only one-shot seed route. Registered alongside the demo poller, behind
 * `xpack.notificationCenter.demoProducer`, so it never exists in a normal build.
 */
export const registerDemoRoutes = (
  core: CoreSetup,
  forType: NotificationCenterPluginSetup['forType'],
  logger: Logger
): void => {
  const router = core.http.createRouter();

  const seedRoute = router.versioned.post({
    path: `${INTERNAL_BASE}/_demo/seed`,
    access: 'internal',
    security: { authz: { requiredPrivileges: [ReservedPrivilegesSet.superuser] } },
  });
  seedRoute.addVersion(
    {
      version: API_VERSION,
      validate: {
        request: {
          query: schema.object({ invalid: schema.boolean({ defaultValue: false }) }),
        },
      },
    },
    async (_ctx, request, response) => {
      const summary = await seedDemoNotifications(forType, logger, request.query.invalid);
      // Force the append-only stream visible immediately so a live seed is
      // reflected in the very next list/count call, rather than after the ~1s
      // ES refresh interval. Demo-only; the production submit path stays async.
      const [{ elasticsearch }] = await core.getStartServices();
      await elasticsearch.client.asInternalUser.indices.refresh({
        index: NOTIFICATION_DATA_STREAM_NAME,
      });
      return response.ok({ body: summary });
    }
  );

  const submitRoute = router.versioned.post({
    path: `${INTERNAL_BASE}/_demo/submit`,
    access: 'internal',
    security: { authz: { requiredPrivileges: [ReservedPrivilegesSet.superuser] } },
  });
  submitRoute.addVersion(
    {
      version: API_VERSION,
      validate: {
        request: {
          // Only the routing triple is validated here; `input` passes through
          // untouched so the real producer contract (Zod + registry) is what
          // accepts or rejects it — surfacing genuine validation errors live.
          body: schema.object({
            namespace: schema.string({ minLength: 1 }),
            type: schema.string({ minLength: 1 }),
            kind: schema.oneOf([schema.literal('state'), schema.literal('timeseries')], {
              defaultValue: 'state',
            }),
            input: schema.recordOf(schema.string(), schema.any()),
          }),
        },
      },
    },
    async (_ctx, request, response) => {
      const { namespace, type, kind, input } = request.body;
      try {
        const result = await (forType as unknown as LooseForType)({
          namespace,
          type,
          kind,
        }).submit(input);
        const [{ elasticsearch }] = await core.getStartServices();
        await elasticsearch.client.asInternalUser.indices.refresh({
          index: NOTIFICATION_DATA_STREAM_NAME,
        });
        return response.ok({ body: result });
      } catch (err) {
        if (err instanceof NotificationValidationError) {
          return response.badRequest({ body: { message: err.message } });
        }
        throw err;
      }
    }
  );
};
