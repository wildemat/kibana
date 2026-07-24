/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { dataStreamServiceMock } from '@kbn/core-data-streams-server-mocks';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { queryNotifications, COLLAPSED_GROUP_LIMIT } from './query_notifications';

const doc = (id: string, ts: string, overrides: Record<string, unknown> = {}) => ({
  '@timestamp': ts,
  notification_id: id,
  namespace: 'inference',
  type: 'modelStatus',
  title: 'Model deprecated',
  description: 'Your endpoint model is deprecated.',
  severity: 'info',
  ...overrides,
});

/** A collapse hit: `latest` is the representative doc, `earliest` the inner-hit anchor. */
const hit = (latest: Record<string, unknown>, earliestTs?: string) => ({
  _id: `doc-${latest.notification_id}`,
  _source: latest,
  inner_hits: {
    earliest: {
      hits: { hits: [{ _source: { '@timestamp': earliestTs ?? latest['@timestamp'] } }] },
    },
  },
});

const setup = (hits: unknown[] = []) => {
  const search = jest.fn().mockResolvedValue({ hits: { hits } });
  const dataStreams = dataStreamServiceMock.createStartContract();
  dataStreams.initializeClient.mockResolvedValue({ search } as never);

  const deps = { dataStreams, logger: loggingSystemMock.createLogger() };
  return { deps, search };
};

describe('queryNotifications', () => {
  it('collapses on notification_id, anchoring the earliest doc via inner_hits, capped at the group limit', async () => {
    const { deps, search } = setup();

    await queryNotifications(deps);

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        collapse: {
          field: 'notification_id',
          inner_hits: { name: 'earliest', size: 1, sort: [{ '@timestamp': 'asc' }] },
        },
        sort: [{ '@timestamp': 'desc' }, { notification_id: 'asc' }],
        size: COLLAPSED_GROUP_LIMIT,
      })
    );
  });

  it('applies one severity-TTL horizon window per tier', async () => {
    const { deps, search } = setup();

    await queryNotifications(deps);

    const [{ query }] = search.mock.calls[0];
    expect(query.bool.filter[0]).toEqual({
      bool: {
        should: [
          {
            bool: {
              filter: [
                { terms: { severity: ['info'] } },
                { range: { '@timestamp': { gte: 'now-30d' } } },
              ],
            },
          },
          {
            bool: {
              filter: [
                { terms: { severity: ['warning'] } },
                { range: { '@timestamp': { gte: 'now-60d' } } },
              ],
            },
          },
          {
            bool: {
              filter: [
                { terms: { severity: ['error', 'critical'] } },
                { range: { '@timestamp': { gte: 'now-180d' } } },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  });

  it('composes namespace, type, severity, and time-range filters', async () => {
    const { deps, search } = setup();

    await queryNotifications(deps, {
      namespace: 'inference',
      type: 'modelStatus',
      severity: ['warning', 'error'],
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-20T00:00:00.000Z',
    });

    const [{ query }] = search.mock.calls[0];
    expect(query.bool.filter).toEqual(
      expect.arrayContaining([
        { term: { namespace: 'inference' } },
        { term: { type: 'modelStatus' } },
        { terms: { severity: ['warning', 'error'] } },
        {
          range: {
            '@timestamp': { gte: '2026-07-01T00:00:00.000Z', lte: '2026-07-20T00:00:00.000Z' },
          },
        },
      ])
    );
  });

  it('omits attribute filters that are not provided', async () => {
    const { deps, search } = setup();

    await queryNotifications(deps);

    const [{ query }] = search.mock.calls[0];
    expect(query.bool.filter).toHaveLength(1);
  });

  it('returns every collapsed group as latest-doc content plus its earliest-doc anchor', async () => {
    const { deps } = setup([
      hit(doc('dup', '2026-07-12T00:00:00.000Z', { title: 'dup v2' }), '2026-07-09T00:00:00.000Z'),
      hit(doc('solo', '2026-07-11T00:00:00.000Z')),
    ]);

    const groups = await queryNotifications(deps);

    expect(groups).toEqual([
      expect.objectContaining({
        notification: expect.objectContaining({ notification_id: 'dup', title: 'dup v2' }),
        earliestTimestamp: '2026-07-09T00:00:00.000Z',
      }),
      expect.objectContaining({
        notification: expect.objectContaining({ notification_id: 'solo' }),
        earliestTimestamp: '2026-07-11T00:00:00.000Z',
      }),
    ]);
  });

  it('falls back to the representative timestamp when no inner hit is present', async () => {
    const { deps } = setup([
      {
        _id: 'doc-nohits',
        _source: doc('nohits', '2026-07-15T00:00:00.000Z'),
      },
    ]);

    const groups = await queryNotifications(deps);

    expect(groups[0].earliestTimestamp).toBe('2026-07-15T00:00:00.000Z');
  });

  it('drops malformed docs instead of failing the response', async () => {
    const { deps } = setup([
      hit(doc('good', '2026-07-15T00:00:00.000Z')),
      { _id: 'doc-bad', _source: { notification_id: 'bad' } },
    ]);

    const groups = await queryNotifications(deps);

    expect(groups.map(({ notification }) => notification.notification_id)).toEqual(['good']);
    expect(deps.logger.debug).toHaveBeenCalledTimes(1);
  });

  it('normalizes an unknown severity tier to info on read', async () => {
    const { deps } = setup([
      hit(doc('future', '2026-07-15T00:00:00.000Z', { severity: 'catastrophic' })),
    ]);

    const groups = await queryNotifications(deps);

    expect(groups[0].notification.severity).toBe('info');
  });
});
