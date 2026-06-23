/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  notificationDataStreamDefinition,
  NOTIFICATION_DATA_STREAM_NAME,
  NOTIFICATION_DATA_RETENTION,
} from './notification_data_stream';

describe('notificationDataStreamDefinition', () => {
  it('uses the canonical data stream name', () => {
    expect(notificationDataStreamDefinition.name).toBe(NOTIFICATION_DATA_STREAM_NAME);
    expect(NOTIFICATION_DATA_STREAM_NAME).toBe('.kibana-notification-center');
  });

  it('is hidden', () => {
    expect(notificationDataStreamDefinition.hidden).toBe(true);
  });

  it('has a positive version number', () => {
    expect(notificationDataStreamDefinition.version).toBeGreaterThan(0);
  });

  it('sets lifecycle data_retention to NOTIFICATION_DATA_RETENTION', () => {
    expect(notificationDataStreamDefinition.template.lifecycle?.data_retention).toBe(
      NOTIFICATION_DATA_RETENTION
    );
  });

  it('caps data retention at 180 days', () => {
    expect(NOTIFICATION_DATA_RETENTION).toBe('180d');
  });

  it('declares core notification fields in the mapping', () => {
    const props = (notificationDataStreamDefinition.template.mappings as any).properties;

    expect(props['@timestamp'].type).toBe('date');
    expect(props.notification_id.type).toBe('keyword');
    expect(props.type.type).toBe('keyword');
    expect(props.severity.type).toBe('keyword');
    expect(props.read.type).toBe('boolean');
    expect(props.user_id.type).toBe('keyword');
    expect(props.space_id.type).toBe('keyword');
  });

  it('disables dynamic mappings to prevent field count explosion', () => {
    expect((notificationDataStreamDefinition.template.mappings as any).dynamic).toBe(false);
  });
});
