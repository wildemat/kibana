/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import {
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiFlyoutResizable,
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
  EuiButtonIcon,
  EuiCheckbox,
  EuiSelect,
  EuiSwitch,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
  EuiIconTip,
  EuiToolTip,
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

/** Registry display metadata for a `(namespace, type)`, falling back to the raw type. */
const typeDisplay = (namespace: string, type: string): { name: string; description?: string } => {
  const namespaceDef = (
    NOTIFICATION_REGISTRY as Record<
      string,
      { types: Record<string, { display_name: string; description: string }> }
    >
  )[namespace];
  const typeDef = namespaceDef?.types?.[type];
  return typeDef
    ? { name: typeDef.display_name, description: typeDef.description }
    : { name: type };
};

const NotificationRow: React.FC<{
  item: NotificationListItem;
  application: ApplicationStart;
  basePath: IBasePath;
  onMarkRead: (id: string) => void;
}> = ({ item, application, basePath, onMarkRead }) => {
  const severity = severityDisplay(item.severity);
  const type = typeDisplay(item.namespace, item.type);
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
            {type.description ? (
              <EuiToolTip content={type.description}>
                <span>{type.name}</span>
              </EuiToolTip>
            ) : (
              type.name
            )}{' '}
            · {moment(item['@timestamp']).fromNow()}
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
          {item.isRead ? (
            <EuiText size="xs" color="subdued">
              <EuiIcon type="check" size="s" />{' '}
              {i18n.translate('xpack.notificationCenter.row.readLabel', {
                defaultMessage: 'Read',
              })}
            </EuiText>
          ) : (
            <EuiButtonEmpty
              size="xs"
              iconType="check"
              onClick={() => onMarkRead(item.notification_id)}
            >
              {i18n.translate('xpack.notificationCenter.row.markReadLabel', {
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
  const [totalCount, setTotalCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<Severity[]>([]);
  const [sortField, setSortField] = useState<'time' | 'severity'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const refreshCounts = useCallback(async () => {
    try {
      const { unreadCount: unread, total } = await api.counts();
      setUnreadCount(unread);
      setTotalCount(total);
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
    refreshCounts();
    const timer = window.setInterval(() => {
      refreshCounts();
      if (isOpen) {
        refreshList();
      }
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshCounts, refreshList, isOpen]);

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, refreshList]);

  const afterMutation = useCallback(async () => {
    await Promise.all([refreshList(), refreshCounts()]);
  }, [refreshList, refreshCounts]);

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

  // The list route returns newest-first; re-sorting happens client-side because
  // the whole filtered page is already in memory.
  const sortedItems = useMemo(() => {
    const sign = sortDirection === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sortField === 'severity') {
        return (SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)) * sign;
      }
      return a['@timestamp'].localeCompare(b['@timestamp']) * sign;
    });
  }, [items, sortField, sortDirection]);

  const bellLabel = i18n.translate('xpack.notificationCenter.bell.ariaLabel', {
    defaultMessage: 'Notifications',
  });

  return (
    <>
      <EuiHeaderSectionItemButton
        aria-label={bellLabel}
        aria-expanded={isOpen}
        notification={unreadCount > 0 ? true : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <EuiIcon type="bell" size="m" />
      </EuiHeaderSectionItemButton>

      {isOpen ? (
        <EuiFlyoutResizable
          size={520}
          minWidth={420}
          maxWidth={900}
          onClose={() => setIsOpen(false)}
          aria-labelledby="ncFlyoutTitle"
        >
          <EuiFlyoutHeader hasBorder>
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h2 id="ncFlyoutTitle">
                    {i18n.translate('xpack.notificationCenter.flyout.title', {
                      defaultMessage: 'Notifications',
                    })}
                  </h2>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="s" iconType="checkInCircleFilled" onClick={onMarkAllRead}>
                  {i18n.translate('xpack.notificationCenter.flyout.markAllReadLabel', {
                    defaultMessage: 'Mark all as read',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiText size="s" color="subdued">
              {i18n.translate('xpack.notificationCenter.flyout.countsSummary', {
                defaultMessage: '{unread} unread · {total} total',
                values: { unread: unreadCount, total: totalCount },
              })}
            </EuiText>
            <EuiSpacer size="s" />
            <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false} wrap>
              <EuiFlexItem grow={false}>
                <EuiSwitch
                  compressed
                  label={i18n.translate('xpack.notificationCenter.filter.unreadOnly', {
                    defaultMessage: 'Unread only',
                  })}
                  checked={unreadOnly}
                  onChange={() => setUnreadOnly((value) => !value)}
                />
              </EuiFlexItem>
              {SEVERITIES.map((severity) => (
                <EuiFlexItem grow={false} key={severity}>
                  <EuiCheckbox
                    id={`ncSeverityFilter-${severity}`}
                    label={severityDisplay(severity).label}
                    checked={severityFilter.includes(severity)}
                    onChange={() => toggleSeverity(severity)}
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
            <EuiSpacer size="s" />
            <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  compressed
                  prepend={i18n.translate('xpack.notificationCenter.sort.label', {
                    defaultMessage: 'Sort by',
                  })}
                  options={[
                    {
                      value: 'time',
                      text: i18n.translate('xpack.notificationCenter.sort.time', {
                        defaultMessage: 'Time',
                      }),
                    },
                    {
                      value: 'severity',
                      text: i18n.translate('xpack.notificationCenter.sort.severity', {
                        defaultMessage: 'Severity',
                      }),
                    },
                  ]}
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as 'time' | 'severity')}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType={sortDirection === 'asc' ? 'sortUp' : 'sortDown'}
                  aria-label={i18n.translate('xpack.notificationCenter.sort.directionAriaLabel', {
                    defaultMessage: 'Toggle sort direction',
                  })}
                  onClick={() =>
                    setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
                  }
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            {isLoading ? (
              <EuiEmptyPrompt icon={<EuiLoadingSpinner size="l" />} title={<span />} />
            ) : items.length === 0 ? (
              <EuiEmptyPrompt
                iconType="bell"
                title={
                  <h3>
                    {i18n.translate('xpack.notificationCenter.flyout.emptyTitle', {
                      defaultMessage: 'Nothing to see here',
                    })}
                  </h3>
                }
                body={
                  <p>
                    {i18n.translate('xpack.notificationCenter.flyout.emptyBody', {
                      defaultMessage: 'You have no notifications matching these filters.',
                    })}
                  </p>
                }
              />
            ) : (
              sortedItems.map((item) => (
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
        </EuiFlyoutResizable>
      ) : null}
    </>
  );
};
