/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IUserStorageClient } from '@kbn/core-user-storage-common';
import type { Notification } from '../common/types';
import type { NotificationGroup } from './query_notifications';
import {
  annotateReadState,
  getReadState,
  isRead,
  stampInitialReadAllBefore,
  type ReadState,
} from './read_state';
import { READ_ALL_BEFORE_KEY, READ_KEY, READ_ALL_BEFORE_DEFAULT } from './user_storage';

const group = (id: string, earliestTimestamp: string, latest = earliestTimestamp): NotificationGroup => ({
  earliestTimestamp,
  notification: {
    '@timestamp': latest,
    notification_id: id,
    namespace: 'inference',
    type: 'modelStatus',
    title: `Title ${id}`,
    description: `Description ${id}`,
    severity: 'info',
  } as Notification,
});

const makeClient = (values: Record<string, unknown>): jest.Mocked<IUserStorageClient> => ({
  get: jest.fn((key: string) => Promise.resolve(values[key])),
  set: jest.fn((key: string, value: unknown) => Promise.resolve(value)),
  remove: jest.fn(() => Promise.resolve()),
  getForInjection: jest.fn(() => Promise.resolve({})),
});

describe('read state', () => {
  describe('getReadState', () => {
    it('reads both keys from the scoped client', async () => {
      const client = makeClient({
        [READ_ALL_BEFORE_KEY]: '2026-07-10T00:00:00.000Z',
        [READ_KEY]: ['inference:modelStatus:a:eol'],
      });

      await expect(getReadState(client)).resolves.toEqual({
        readAllBefore: '2026-07-10T00:00:00.000Z',
        read: ['inference:modelStatus:a:eol'],
      });
    });
  });

  describe('isRead', () => {
    const state: ReadState = {
      readAllBefore: '2026-07-10T00:00:00.000Z',
      read: ['inference:modelStatus:marked:eol'],
    };

    it('is read when the earliest doc is at or before the marker', () => {
      expect(isRead(group('older', '2026-07-01T00:00:00.000Z'), state)).toBe(true);
      expect(isRead(group('exact', '2026-07-10T00:00:00.000Z'), state)).toBe(true);
    });

    it('is read when the id is in the individually-read list', () => {
      expect(isRead(group('inference:modelStatus:marked:eol', '2026-07-20T00:00:00.000Z'), state)).toBe(
        true
      );
    });

    it('is unread when the earliest doc is newer than the marker and the id is not listed', () => {
      expect(isRead(group('fresh', '2026-07-20T00:00:00.000Z'), state)).toBe(false);
    });

    it('keeps a re-pushed persisting condition read: a newer latest doc does not un-read it', () => {
      // Same id re-pushed after mark-all: earliest anchor stays before the marker,
      // latest doc is after it. Latest-doc comparison would flip this back to unread.
      const rePushed = group('persisting', '2026-07-05T00:00:00.000Z', '2026-07-21T00:00:00.000Z');
      expect(isRead(rePushed, state)).toBe(true);
    });

    it('treats an unset (epoch) marker as nothing read', () => {
      const fresh: ReadState = { readAllBefore: READ_ALL_BEFORE_DEFAULT, read: [] };
      expect(isRead(group('any', '2026-07-01T00:00:00.000Z'), fresh)).toBe(false);
    });
  });

  describe('annotateReadState', () => {
    it('folds isRead onto each representative document', () => {
      const state: ReadState = { readAllBefore: '2026-07-10T00:00:00.000Z', read: [] };
      const annotated = annotateReadState(
        [group('read-one', '2026-07-01T00:00:00.000Z'), group('unread-one', '2026-07-20T00:00:00.000Z')],
        state
      );

      expect(annotated.map(({ notification_id: id, isRead: read }) => ({ id, read }))).toEqual([
        { id: 'read-one', read: true },
        { id: 'unread-one', read: false },
      ]);
    });
  });

  describe('stampInitialReadAllBefore', () => {
    it('stamps the marker to now on the first load and returns the effective state', async () => {
      const client = makeClient({});
      const before = Date.now();

      const state = await stampInitialReadAllBefore(client, {
        readAllBefore: READ_ALL_BEFORE_DEFAULT,
        read: [],
      });

      expect(client.set).toHaveBeenCalledWith(READ_ALL_BEFORE_KEY, expect.any(String));
      expect(new Date(state.readAllBefore).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('leaves an already-stamped marker untouched', async () => {
      const client = makeClient({});
      const state: ReadState = { readAllBefore: '2026-07-10T00:00:00.000Z', read: [] };

      await expect(stampInitialReadAllBefore(client, state)).resolves.toEqual(state);
      expect(client.set).not.toHaveBeenCalled();
    });
  });
});
