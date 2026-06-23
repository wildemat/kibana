/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DataStreamDefinition } from '@kbn/core-data-streams-server';
import type { MappingsDefinition } from '@kbn/es-mappings';

export const NOTIFICATION_DATA_STREAM_NAME = '.kibana-notification-center' as const;

/**
 * Maximum data retention for notifications. Even the most severe notifications
 * (e.g., critical model status) are retained for no more than 180 days.
 */
export const NOTIFICATION_DATA_RETENTION = '180d' as const;

const notificationMappings = {
  dynamic: false,
  properties: {
    '@timestamp': { type: 'date' },
    notification_id: { type: 'keyword' },
    type: { type: 'keyword' },
    severity: { type: 'keyword' },
    title: { type: 'keyword' },
    message: { type: 'text', index: false },
    read: { type: 'boolean' },
    user_id: { type: 'keyword' },
    space_id: { type: 'keyword' },
    source_plugin: { type: 'keyword' },
    metadata: { type: 'object', enabled: false },
  },
} as unknown as MappingsDefinition;

export const notificationDataStreamDefinition: DataStreamDefinition<MappingsDefinition> = {
  name: NOTIFICATION_DATA_STREAM_NAME,
  version: 1,
  hidden: true,
  template: {
    priority: 500,
    lifecycle: {
      data_retention: NOTIFICATION_DATA_RETENTION,
    },
    mappings: notificationMappings,
  },
};
