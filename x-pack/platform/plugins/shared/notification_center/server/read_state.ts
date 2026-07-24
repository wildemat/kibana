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
  READ_ALL_BEFORE_KEY,
  READ_KEY,
  READ_ALL_BEFORE_DEFAULT,
} from './user_storage';

/** Per-user read-state resolved from user storage. */
export interface ReadState {
  /** Notifications whose earliest doc is at or before this marker are read. */
  readAllBefore: string;
  /** Individually-read `notification_id`s newer than the marker. */
  read: string[];
}

/** A representative notification with its resolved read flag. */
export type AnnotatedNotification = Notification & { isRead: boolean };

/** Read-state for a user who has never interacted: nothing read. */
export const DEFAULT_READ_STATE: ReadState = {
  readAllBefore: READ_ALL_BEFORE_DEFAULT,
  read: [],
};

/** Load both read-state keys for the user behind the scoped client. */
export const getReadState = async (client: IUserStorageClient): Promise<ReadState> => {
  const [readAllBefore, read] = await Promise.all([
    client.get<string>(READ_ALL_BEFORE_KEY),
    client.get<string[]>(READ_KEY),
  ]);
  return { readAllBefore, read };
};

/**
 * A group is read when the user marked everything up to its earliest doc, or when
 * they marked this specific id. Anchoring on the earliest doc means a producer
 * re-pushing a persisting condition (a new doc, same id) never un-reads it, while a
 * genuine state change mints a new id whose earliest doc is newer than the marker
 * and so arrives unread.
 */
export const isRead = (group: NotificationGroup, state: ReadState): boolean =>
  group.earliestTimestamp <= state.readAllBefore ||
  state.read.includes(group.notification.notification_id);

/** Fold read-state onto each group's representative document. */
export const annotateReadState = (
  groups: NotificationGroup[],
  state: ReadState
): AnnotatedNotification[] =>
  groups.map((group) => ({ ...group.notification, isRead: isRead(group, state) }));

/**
 * On a user's first list load the marker is still the epoch default, which would
 * make every historical notification unread. Stamp it to now so a new user starts
 * with a clean slate; only the list route does this (a plain count must not mutate
 * state). Returns the effective state to annotate with.
 */
export const stampInitialReadAllBefore = async (
  client: IUserStorageClient,
  state: ReadState
): Promise<ReadState> => {
  if (state.readAllBefore !== READ_ALL_BEFORE_DEFAULT) {
    return state;
  }
  const now = new Date().toISOString();
  await client.set<string>(READ_ALL_BEFORE_KEY, now);
  return { ...state, readAllBefore: now };
};
