/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DataStreamClient } from '@kbn/data-streams';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { ToolingLog } from '@kbn/tooling-log';
import { createTestEsCluster } from '@kbn/test';
import type { EsTestCluster } from '@kbn/test';
import type { Logger } from '@kbn/logging';
import {
  NOTIFICATIONS_DATA_STREAM_NAME,
  NOTIFICATIONS_DATA_RETENTION,
  notificationsDataStreamDefinition,
} from '../data_stream';

describe('Notification Center data stream', () => {
  let esServer: EsTestCluster;
  let logger: Logger;

  const cleanup = async () => {
    const client = esServer.getClient();
    await client.indices
      .deleteDataStream({ name: NOTIFICATIONS_DATA_STREAM_NAME })
      .catch(() => {});
    await client.indices
      .deleteIndexTemplate({ name: NOTIFICATIONS_DATA_STREAM_NAME })
      .catch(() => {});
  };

  beforeAll(async () => {
    jest.setTimeout(60_000);
    esServer = createTestEsCluster({
      log: new ToolingLog({ writeTo: process.stdout, level: 'info' }),
    });
    await esServer.start();
  });

  afterAll(async () => {
    await esServer.stop();
  });

  beforeEach(() => {
    logger = loggingSystemMock.createLogger();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('installs the index template on first call', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    const { index_templates: templates } = await esClient.indices.getIndexTemplate({
      name: NOTIFICATIONS_DATA_STREAM_NAME,
    });

    expect(templates).toHaveLength(1);
    const [{ name, index_template: template }] = templates;

    expect(name).toBe(NOTIFICATIONS_DATA_STREAM_NAME);
    expect(template.data_stream?.hidden).toBe(true);
    expect(template._meta?.version).toBe(1);
  });

  it('does not create the data stream during template installation', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    await expect(
      esClient.indices.getDataStream({ name: NOTIFICATIONS_DATA_STREAM_NAME })
    ).rejects.toThrow();
  });

  it('sets the 180d DSL retention ceiling', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    const { index_templates: templates } = await esClient.indices.getIndexTemplate({
      name: NOTIFICATIONS_DATA_STREAM_NAME,
    });

    const lifecycle = templates[0].index_template.template?.lifecycle;
    expect(lifecycle?.data_retention).toBe(NOTIFICATIONS_DATA_RETENTION);
  });

  it('maps the required notification fields with correct types', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    const { index_templates: templates } = await esClient.indices.getIndexTemplate({
      name: NOTIFICATIONS_DATA_STREAM_NAME,
    });

    const props = templates[0].index_template.template?.mappings?.properties ?? {};

    expect(props['@timestamp']).toMatchObject({ type: 'date' });
    expect(props.event_timestamp).toMatchObject({ type: 'date' });
    expect(props.notification_id).toMatchObject({ type: 'keyword' });
    expect(props.severity).toMatchObject({ type: 'keyword' });
  });

  it('sets dynamic: strict at the top level', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    const { index_templates: templates } = await esClient.indices.getIndexTemplate({
      name: NOTIFICATIONS_DATA_STREAM_NAME,
    });

    expect(templates[0].index_template.template?.mappings?.dynamic).toBe('strict');
  });

  it('is idempotent — re-running install does not error', async () => {
    const esClient = esServer.getClient();

    await DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: esClient,
      logger,
    });

    await expect(
      DataStreamClient.initializeTemplate({
        dataStream: notificationsDataStreamDefinition,
        elasticsearchClient: esClient,
        logger,
      })
    ).resolves.not.toThrow();

    const { index_templates: templates } = await esClient.indices.getIndexTemplate({
      name: NOTIFICATIONS_DATA_STREAM_NAME,
    });
    expect(templates[0].index_template._meta?.version).toBe(1);
  });
});
