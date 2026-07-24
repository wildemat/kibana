/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';
import type { Logger } from '@kbn/core/server';
import type { DataStreamsStart } from '@kbn/core-data-streams-server';
import { notificationReadSchema } from '../common/notification_schema';
import type { Notification, Severity } from '../common/types';
import { getNotificationDataStreamClient } from './data_stream/notification_data_stream';
import { SEVERITY_TTL_DAYS } from './severity_ttl';

/**
 * Ceiling on collapsed notifications fetched per query. Pagination happens in
 * memory (read-state annotation will join per-user data that ES cannot see);
 * severity TTLs and curated producers keep real volumes far under this.
 */
export const COLLAPSED_GROUP_LIMIT = 1000;

export interface NotificationQueryParams {
  namespace?: string;
  type?: string;
  severity?: Severity[];
  /** ISO lower bound on `@timestamp`, inclusive. */
  from?: string;
  /** ISO upper bound on `@timestamp`, inclusive. */
  to?: string;
}

/**
 * One collapsed `notification_id`: the latest doc as the representative content,
 * plus the timestamp of the earliest in-horizon doc in the group. Read-state
 * anchors on `earliestTimestamp` so a producer re-pushing a persisting condition
 * never un-reads a notification the user already dismissed; pagination and the
 * per-user `isRead` annotation are applied by the caller, above this function.
 */
export interface NotificationGroup {
  notification: Notification;
  earliestTimestamp: string;
}

export interface NotificationQueryDeps {
  dataStreams: DataStreamsStart;
  logger: Logger;
}

/** Severities grouped by TTL so the horizon filter emits one clause per window. */
const ttlGroups = Object.entries(SEVERITY_TTL_DAYS).reduce<Map<number, Severity[]>>(
  (groups, [severity, days]) => {
    groups.set(days, [...(groups.get(days) ?? []), severity as Severity]);
    return groups;
  },
  new Map()
);

/** Docs older than their severity's TTL are invisible even before cleanup deletes them. */
const horizonFilter = (): QueryDslQueryContainer => ({
  bool: {
    should: [...ttlGroups.entries()].map(([days, severities]) => ({
      bool: {
        filter: [
          { terms: { severity: severities } },
          { range: { '@timestamp': { gte: `now-${days}d` } } },
        ],
      },
    })),
    minimum_should_match: 1,
  },
});

const buildFilters = (params: NotificationQueryParams): QueryDslQueryContainer[] => {
  const { namespace, type, severity, from, to } = params;
  const filters: QueryDslQueryContainer[] = [horizonFilter()];
  if (namespace) {
    filters.push({ term: { namespace } });
  }
  if (type) {
    filters.push({ term: { type } });
  }
  if (severity?.length) {
    filters.push({ terms: { severity } });
  }
  if (from || to) {
    filters.push({
      range: { '@timestamp': { ...(from && { gte: from }), ...(to && { lte: to }) } },
    });
  }
  return filters;
};

/**
 * Fetch the collapsed notification list: latest doc per `notification_id` (field
 * collapse), severity-TTL horizon, attribute and time-range filters, newest first.
 * A single query also surfaces each group's earliest in-horizon doc via `inner_hits`
 * so the caller can anchor read-state on it.
 *
 * Per-user read-state annotation (`isRead`, unread counts, read/unread filtering)
 * and pagination are applied on top of this function by the route, because they
 * join user storage data Elasticsearch cannot see.
 */
export const queryNotifications = async (
  deps: NotificationQueryDeps,
  params: NotificationQueryParams = {}
): Promise<NotificationGroup[]> => {
  const { dataStreams, logger } = deps;

  const client = await getNotificationDataStreamClient(dataStreams);
  const response = await client.search({
    query: { bool: { filter: buildFilters(params) } },
    collapse: {
      field: 'notification_id',
      inner_hits: { name: 'earliest', size: 1, sort: [{ '@timestamp': 'asc' }] },
    },
    sort: [{ '@timestamp': 'desc' }, { notification_id: 'asc' }],
    size: COLLAPSED_GROUP_LIMIT,
    track_total_hits: false,
  });

  return response.hits.hits.flatMap((hit): NotificationGroup[] => {
    const parsed = notificationReadSchema.safeParse(hit._source);
    if (!parsed.success) {
      logger.debug(`Dropping malformed notification doc ${hit._id}: ${parsed.error.message}`);
      return [];
    }
    const earliestSource = hit.inner_hits?.earliest?.hits?.hits?.[0]?._source as
      | { '@timestamp'?: string }
      | undefined;
    return [
      {
        notification: parsed.data,
        earliestTimestamp: earliestSource?.['@timestamp'] ?? parsed.data['@timestamp'],
      },
    ];
  });
};
