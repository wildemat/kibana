/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpStart } from '@kbn/core/public';
import type { Notification, Severity } from '../common/types';

const BASE = '/internal/notification_center';
const API_VERSION = '1';

/** A notification as returned to the browser: stored content plus the per-user read flag. */
export type NotificationListItem = Notification & { isRead: boolean };

export interface NotificationListResponse {
  notifications: NotificationListItem[];
  total: number;
}

export interface ListParams {
  unread?: boolean;
  severity?: Severity[];
}

export interface NotificationsApi {
  list(params?: ListParams): Promise<NotificationListResponse>;
  unreadCount(): Promise<number>;
  markRead(notificationIds: string[]): Promise<void>;
  markAllRead(): Promise<void>;
}

/** Thin client over the versioned internal Notification Center routes. */
export const createNotificationsApi = (http: HttpStart): NotificationsApi => ({
  list: ({ unread, severity }: ListParams = {}) =>
    http.get<NotificationListResponse>(`${BASE}/notifications`, {
      version: API_VERSION,
      query: {
        perPage: 50,
        ...(unread ? { unread: true } : {}),
        ...(severity?.length ? { severity: severity.join(',') } : {}),
      },
    }),

  unreadCount: async () => {
    const { unreadCount } = await http.get<{ unreadCount: number }>(
      `${BASE}/notifications/_unread_count`,
      { version: API_VERSION }
    );
    return unreadCount;
  },

  markRead: async (notificationIds: string[]) => {
    await http.post(`${BASE}/notifications/_mark_read`, {
      version: API_VERSION,
      body: JSON.stringify({ notificationIds }),
    });
  },

  markAllRead: async () => {
    await http.post(`${BASE}/notifications/_mark_all_read`, { version: API_VERSION });
  },
});
