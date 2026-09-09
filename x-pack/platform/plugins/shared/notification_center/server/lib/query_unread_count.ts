/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { z } from '@kbn/zod';
import { notificationIdSchema } from '../../common/notification_schema';
import type { NotificationUnreadCount } from '../../common/types';
import { getNotificationDataStreamClient } from '../storage/notification_data_stream';
import type { NotificationQueryDeps } from './query_notifications';
import { isReadAt, type NotificationReadState } from './read_state';

const unreadCountSourceSchema = z.object({
  notification_id: notificationIdSchema,
  '@timestamp': z.iso.datetime(),
});

/**
 * Ceiling on the reported count. The bell badge renders a capped result as `${cap}+`, so counting
 * past it buys nothing and the endpoint is polled often enough that the saved work matters.
 */
export const UNREAD_COUNT_CAP = 99;

/**
 * Count unread notification representatives for a user, capped at `UNREAD_COUNT_CAP`.
 *
 * Sized for polling: the read horizon is pushed into the query so `can_match` skips backing
 * indices that predate it, and the page is bounded by the cap instead of the list route's limit.
 */
export const queryUnreadCount = async (
  { dataStreams, logger }: NotificationQueryDeps,
  readState: NotificationReadState
): Promise<NotificationUnreadCount> => {
  const { overrides, readAllBefore } = readState;
  const overrideCount = Object.keys(overrides).length;
  const client = await getNotificationDataStreamClient(dataStreams);
  const response = await client.search({
    // Encodes the read-state invariant that nothing at or before the marker can be unread, which
    // `isReadAt` still enforces per hit. An override can only postdate the marker, never precede it.
    query: { bool: { filter: [{ range: { '@timestamp': { gt: readAllBefore } } }] } },
    _source: ['notification_id', '@timestamp'],
    collapse: { field: 'notification_id' },
    sort: [{ '@timestamp': 'desc' }, { notification_id: 'asc' }],
    // Every collapsed group is a distinct id, so at most `overrideCount` of them can turn out to be
    // read. Fetching that many beyond the cap (plus one, to tell "exactly the cap" from "more")
    // keeps the capped count exact.
    size: UNREAD_COUNT_CAP + overrideCount + 1,
    track_total_hits: false,
  });

  let unreadCount = 0;
  const malformedIds: string[] = [];
  for (const hit of response.hits.hits) {
    const parsed = unreadCountSourceSchema.safeParse(hit._source);
    if (!parsed.success) {
      malformedIds.push(hit._id ?? 'unknown');
      continue;
    }
    const notification = parsed.data;
    if (!isReadAt(readState, notification.notification_id, notification['@timestamp'])) {
      unreadCount += 1;
      if (unreadCount > UNREAD_COUNT_CAP) {
        break;
      }
    }
  }

  if (malformedIds.length) {
    logger.debug(
      `Dropped ${
        malformedIds.length
      } malformed notification docs from unread count. Sample: ${malformedIds
        .slice(0, 10)
        .join(', ')}`
    );
  }

  const capped = unreadCount > UNREAD_COUNT_CAP;
  return { unreadCount: capped ? UNREAD_COUNT_CAP : unreadCount, capped };
};
