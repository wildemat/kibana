/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import {
  EuiHeaderSectionItemButton,
  EuiNotificationBadge,
  EuiIcon,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiSpacer,
  EuiText,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiButtonEmpty,
  EuiFilterGroup,
  EuiFilterButton,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiIconTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { ApplicationStart, IBasePath } from '@kbn/core/public';
import { NOTIFICATION_REGISTRY } from '../../common/notification_registry';
import { SEVERITIES } from '../../common/notification_schema';
import type { Severity } from '../../common/types';
import type { NotificationsApi, NotificationListItem } from '../notifications_api';
import { severityDisplay } from './severity_display';

const REFRESH_INTERVAL_MS = 30_000;

export interface NotificationsNavButtonProps {
  api: NotificationsApi;
  application: ApplicationStart;
  basePath: IBasePath;
}

/** Registry `display_name` for a `(namespace, type)`, falling back to the raw type. */
const typeDisplayName = (namespace: string, type: string): string => {
  const namespaceDef = (
    NOTIFICATION_REGISTRY as Record<string, { types: Record<string, { display_name: string }> }>
  )[namespace];
  return namespaceDef?.types?.[type]?.display_name ?? type;
};

const NotificationRow: React.FC<{
  item: NotificationListItem;
  application: ApplicationStart;
  basePath: IBasePath;
  onMarkRead: (id: string) => void;
}> = ({ item, application, basePath, onMarkRead }) => {
  const severity = severityDisplay(item.severity);
  return (
    <EuiPanel hasBorder paddingSize="s" color={item.isRead ? 'subdued' : 'plain'}>
      <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexStart">
        <EuiFlexItem grow={false}>
          <EuiIconTip
            type={severity.iconType}
            color={severity.color}
            content={severity.label}
            aria-label={severity.label}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="xs" color="subdued">
            {typeDisplayName(item.namespace, item.type)} · {moment(item['@timestamp']).fromNow()}
          </EuiText>
          <EuiText size="s">
            <strong>{item.title}</strong>
          </EuiText>
          <EuiText size="s">{item.description}</EuiText>
          {item.cta ? (
            <EuiLink onClick={() => application.navigateToUrl(basePath.prepend(item.cta!.link))}>
              {item.cta.linkText}
            </EuiLink>
          ) : null}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {item.isRead ? null : (
            <EuiButtonEmpty
              size="xs"
              iconType="check"
              onClick={() => onMarkRead(item.notification_id)}
            >
              {i18n.translate('notificationCenter.row.markReadLabel', {
                defaultMessage: 'Mark read',
              })}
            </EuiButtonEmpty>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export const NotificationsNavButton: React.FC<NotificationsNavButtonProps> = ({
  api,
  application,
  basePath,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<Severity[]>([]);

  const refreshCount = useCallback(async () => {
    try {
      setUnreadCount(await api.unreadCount());
    } catch {
      // Badge is best-effort; a failed poll should not surface an error toast.
    }
  }, [api]);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const { notifications } = await api.list({
        unread: unreadOnly,
        severity: severityFilter,
      });
      setItems(notifications);
    } finally {
      setIsLoading(false);
    }
  }, [api, unreadOnly, severityFilter]);

  useEffect(() => {
    refreshCount();
    const timer = window.setInterval(refreshCount, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, refreshList]);

  const afterMutation = useCallback(async () => {
    await Promise.all([refreshList(), refreshCount()]);
  }, [refreshList, refreshCount]);

  const onMarkRead = useCallback(
    async (id: string) => {
      await api.markRead([id]);
      await afterMutation();
    },
    [api, afterMutation]
  );

  const onMarkAllRead = useCallback(async () => {
    await api.markAllRead();
    await afterMutation();
  }, [api, afterMutation]);

  const toggleSeverity = useCallback((severity: Severity) => {
    setSeverityFilter((current) =>
      current.includes(severity)
        ? current.filter((tier) => tier !== severity)
        : [...current, severity]
    );
  }, []);

  const bellLabel = i18n.translate('notificationCenter.bell.ariaLabel', {
    defaultMessage: 'Notifications',
  });

  return (
    <>
      <EuiHeaderSectionItemButton
        aria-label={bellLabel}
        aria-expanded={isOpen}
        notification={unreadCount > 0 ? unreadCount : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <EuiIcon type="bell" size="m" />
        {unreadCount > 0 ? <EuiNotificationBadge>{unreadCount}</EuiNotificationBadge> : null}
      </EuiHeaderSectionItemButton>

      {isOpen ? (
        <EuiFlyout size="s" onClose={() => setIsOpen(false)} aria-labelledby="ncFlyoutTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h2 id="ncFlyoutTitle">
                    {i18n.translate('notificationCenter.flyout.title', {
                      defaultMessage: 'Notifications',
                    })}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="s" iconType="checkInCircleFilled" onClick={onMarkAllRead}>
                  {i18n.translate('notificationCenter.flyout.markAllReadLabel', {
                    defaultMessage: 'Mark all as read',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiFilterGroup>
              <EuiFilterButton
                hasActiveFilters={unreadOnly}
                onClick={() => setUnreadOnly((value) => !value)}
              >
                {i18n.translate('notificationCenter.filter.unreadOnly', {
                  defaultMessage: 'Unread only',
                })}
              </EuiFilterButton>
              {SEVERITIES.map((severity) => (
                <EuiFilterButton
                  key={severity}
                  hasActiveFilters={severityFilter.includes(severity)}
                  onClick={() => toggleSeverity(severity)}
                >
                  {severityDisplay(severity).label}
                </EuiFilterButton>
              ))}
            </EuiFilterGroup>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            {isLoading ? (
              <EuiEmptyPrompt icon={<EuiLoadingSpinner size="l" />} title={<span />} />
            ) : items.length === 0 ? (
              <EuiEmptyPrompt
                iconType="bell"
                title={
                  <h3>
                    {i18n.translate('notificationCenter.flyout.emptyTitle', {
                      defaultMessage: 'Nothing to see here',
                    })}
                  </h3>
                }
                body={
                  <p>
                    {i18n.translate('notificationCenter.flyout.emptyBody', {
                      defaultMessage: 'You have no notifications matching these filters.',
                    })}
                  </p>
                }
              />
            ) : (
              items.map((item) => (
                <React.Fragment key={item.notification_id}>
                  <NotificationRow
                    item={item}
                    application={application}
                    basePath={basePath}
                    onMarkRead={onMarkRead}
                  />
                  <EuiSpacer size="s" />
                </React.Fragment>
              ))
            )}
          </EuiFlyoutBody>
        </EuiFlyout>
      ) : null}
    </>
  );
};
