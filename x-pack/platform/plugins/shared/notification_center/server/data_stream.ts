/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DataStreamDefinition } from '@kbn/data-streams';
import { mappings, type MappingsDefinition } from '@kbn/es-mappings';

export const NOTIFICATIONS_DATA_STREAM_NAME = '.kibana-notifications' as const;

/**
 * Max retention ceiling across all severity tiers (info 30d / warn 60d / err+crit 180d).
 * The cleanup task enforces per-severity TTLs; this ceiling is the DSL backstop.
 */
export const NOTIFICATIONS_DATA_RETENTION = '180d' as const;

export const notificationsDataStreamMappings = {
  dynamic: 'strict',
  properties: {
    '@timestamp': mappings.date(),
    event_timestamp: mappings.date(),
    notification_id: mappings.keyword(),
    notification_type: mappings.keyword(),
    producer: mappings.keyword(),
    severity: mappings.keyword(),
    title: mappings.keyword(),
    body: mappings.matchOnlyText(),
    cta_href: mappings.keyword(),
  },
} satisfies MappingsDefinition;

export const notificationsDataStreamDefinition: DataStreamDefinition<
  typeof notificationsDataStreamMappings
> = {
  name: NOTIFICATIONS_DATA_STREAM_NAME,
  version: 1,
  hidden: true,
  template: {
    priority: 500,
    lifecycle: {
      data_retention: NOTIFICATIONS_DATA_RETENTION,
    },
    mappings: notificationsDataStreamMappings,
  },
};
