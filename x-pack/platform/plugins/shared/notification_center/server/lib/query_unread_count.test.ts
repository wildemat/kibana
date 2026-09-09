/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { dataStreamServiceMock } from '@kbn/core-data-streams-server-mocks';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { queryUnreadCount, UNREAD_COUNT_CAP } from './query_unread_count';

const setup = (documents: Array<{ notification_id: string; '@timestamp': string }>) => {
  const search = jest.fn().mockResolvedValue({
    hits: { hits: documents.map((source, index) => ({ _id: `doc-${index}`, _source: source })) },
  });
  const dataStreams = dataStreamServiceMock.createStartContract();
  dataStreams.initializeClient.mockResolvedValue({ search } as never);

  return {
    deps: { dataStreams, logger: loggingSystemMock.createLogger() },
    search,
  };
};

const unreadDocs = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    notification_id: `notification-${index}`,
    '@timestamp': '2026-07-20T00:00:00.000Z',
  }));

describe('queryUnreadCount', () => {
  it('counts collapsed representatives newer than the read horizon as unread', async () => {
    const { deps } = setup([
      { notification_id: 'new', '@timestamp': '2026-07-20T00:00:00.000Z' },
      { notification_id: 'old', '@timestamp': '2026-07-10T00:00:00.000Z' },
    ]);

    const result = await queryUnreadCount(deps, {
      overrides: {},
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: 1, capped: false });
  });

  it('reports an exact count at the cap', async () => {
    const { deps } = setup(unreadDocs(UNREAD_COUNT_CAP));

    const result = await queryUnreadCount(deps, {
      overrides: {},
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: UNREAD_COUNT_CAP, capped: false });
  });

  it('caps the count once one more unread representative is found', async () => {
    const { deps } = setup(unreadDocs(UNREAD_COUNT_CAP + 1));

    const result = await queryUnreadCount(deps, {
      overrides: {},
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: UNREAD_COUNT_CAP, capped: true });
  });

  it('prunes to the read horizon and sizes the page for the cap plus the overrides', async () => {
    const { deps, search } = setup([]);

    await queryUnreadCount(deps, {
      overrides: {
        a: { read: true, markedAt: '2026-07-16T00:00:00.000Z' },
        b: { read: true, markedAt: '2026-07-16T00:00:00.000Z' },
      },
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(search).toHaveBeenCalledWith({
      query: {
        bool: { filter: [{ range: { '@timestamp': { gt: '2026-07-15T00:00:00.000Z' } } }] },
      },
      _source: ['notification_id', '@timestamp'],
      collapse: { field: 'notification_id' },
      sort: [{ '@timestamp': 'desc' }, { notification_id: 'asc' }],
      size: UNREAD_COUNT_CAP + 3,
      track_total_hits: false,
    });
  });

  it('still reaches the cap when overrides suppress the newest representatives', async () => {
    const suppressed = Array.from({ length: 2 }, (_, index) => ({
      notification_id: `acknowledged-${index}`,
      '@timestamp': '2026-07-16T00:00:00.000Z',
    }));
    const { deps } = setup([...suppressed, ...unreadDocs(UNREAD_COUNT_CAP + 1)]);

    const result = await queryUnreadCount(deps, {
      overrides: Object.fromEntries(
        suppressed.map(({ notification_id: id }) => [
          id,
          { read: true, markedAt: '2026-07-17T00:00:00.000Z' },
        ])
      ),
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: UNREAD_COUNT_CAP, capped: true });
  });

  it('counts overrides and re-pushes with the shared read-state semantics', async () => {
    const { deps } = setup([
      { notification_id: 'acknowledged', '@timestamp': '2026-07-16T00:00:00.000Z' },
      { notification_id: 're-pushed', '@timestamp': '2026-07-20T00:00:00.000Z' },
    ]);

    const result = await queryUnreadCount(deps, {
      overrides: {
        acknowledged: { read: true, markedAt: '2026-07-17T00:00:00.000Z' },
        're-pushed': { read: true, markedAt: '2026-07-17T00:00:00.000Z' },
      },
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: 1, capped: false });
  });

  it('drops malformed documents rather than counting them', async () => {
    const { deps } = setup([
      { notification_id: 'valid', '@timestamp': '2026-07-20T00:00:00.000Z' },
      { '@timestamp': '2026-07-20T00:00:00.000Z' } as never,
    ]);

    const result = await queryUnreadCount(deps, {
      overrides: {},
      readAllBefore: '2026-07-15T00:00:00.000Z',
    });

    expect(result).toEqual({ unreadCount: 1, capped: false });
  });
});
