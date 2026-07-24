/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DataStreamsStart } from '@kbn/core-data-streams-server';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { DataStreamClient } from '@kbn/data-streams';
import type { EsTestCluster } from '@kbn/test';
import { createTestEsCluster } from '@kbn/test';
import { ToolingLog } from '@kbn/tooling-log';
import type { NotificationDocument } from '../../common/types';
import {
  NOTIFICATION_DATA_STREAM_NAME,
  notificationDataStreamDefinition,
} from '../data_stream/notification_data_stream';
import { queryNotifications } from '../query_notifications';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const doc = (
  id: string,
  timestamp: string,
  overrides: Partial<NotificationDocument> = {}
): NotificationDocument => ({
  '@timestamp': timestamp,
  notification_id: id,
  namespace: 'inference',
  type: 'modelStatus',
  title: `Title for ${id}`,
  description: `Description for ${id}`,
  severity: 'info',
  ...overrides,
});

describe('queryNotifications [integration]', () => {
  let esServer: EsTestCluster;
  let dataStreams: DataStreamsStart;
  const logger = loggingSystemMock.createLogger();

  const query = (params: Parameters<typeof queryNotifications>[1] = {}) =>
    queryNotifications({ dataStreams, logger }, params);

  beforeAll(async () => {
    jest.setTimeout(120_000);
    esServer = createTestEsCluster({
      log: new ToolingLog({ writeTo: process.stdout, level: 'error' }),
    });
    await esServer.start();
    const esClient = esServer.getClient();

    const client = await DataStreamClient.initialize({
      logger: loggingSystemMock.createLogger(),
      elasticsearchClient: esClient,
      dataStream: notificationDataStreamDefinition,
    });
    if (!client) {
      throw new Error('Failed to initialize the notification data stream client');
    }
    dataStreams = { initializeClient: async () => client } as unknown as DataStreamsStart;

    await client.create({
      documents: [
        // re-pushed id: collapse must surface only the latest doc
        doc('dup', daysAgo(5), { title: 'dup v1' }),
        doc('dup', daysAgo(2), { title: 'dup v2' }),
        // past the 30d info TTL: horizon-excluded
        doc('old-info', daysAgo(40)),
        // same age but error tier (180d TTL): visible
        doc('old-error', daysAgo(40), { severity: 'error' }),
        doc('recent-warning', daysAgo(1), { severity: 'warning' }),
        doc('other-type', daysAgo(3), { type: 'other' }),
      ],
    });
    await esClient.indices.refresh({ index: NOTIFICATION_DATA_STREAM_NAME });
  });

  afterAll(async () => {
    await esServer?.stop();
  });

  const ids = (groups: Awaited<ReturnType<typeof query>>) =>
    groups.map(({ notification }) => notification.notification_id);

  it('returns each notification_id once, represented by its latest doc, newest first', async () => {
    const groups = await query();

    expect(ids(groups)).toEqual(['recent-warning', 'dup', 'other-type', 'old-error']);
    expect(groups.find(({ notification }) => notification.notification_id === 'dup')?.notification.title).toBe(
      'dup v2'
    );
  });

  it('anchors each group on its earliest in-horizon doc', async () => {
    const groups = await query();

    const dup = groups.find(({ notification }) => notification.notification_id === 'dup');
    // The re-pushed id keeps its latest content but anchors on the first push (5d ago).
    expect(dup?.notification.title).toBe('dup v2');
    expect(new Date(dup!.earliestTimestamp).getTime()).toBeLessThan(
      new Date(dup!.notification['@timestamp']).getTime()
    );
  });

  it('excludes docs past their severity TTL while keeping longer-lived tiers of the same age', async () => {
    const groups = await query();

    expect(ids(groups)).not.toContain('old-info');
    expect(ids(groups)).toContain('old-error');
  });

  it('composes attribute filters', async () => {
    expect(ids(await query({ severity: ['error'] }))).toEqual(['old-error']);
    expect(ids(await query({ type: 'other' }))).toEqual(['other-type']);
    expect(await query({ namespace: 'nonexistent' })).toEqual([]);
  });
});
