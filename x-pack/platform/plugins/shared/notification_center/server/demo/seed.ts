/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type { NotificationKind } from '../../common/notification_registry_types';
import type { SubmitNotificationResult } from '../types';
import type { NotificationCenterPluginSetup } from '../types';

type ForType = NotificationCenterPluginSetup['forType'];

/**
 * Loose view of `forType` for demo code that deliberately submits an unregistered
 * type: the real contract is compile-time-bound to registered refs, so the
 * rejection path can only be exercised behind a cast.
 */
type LooseForType = (ref: { namespace: string; type: string; kind: NotificationKind }) => {
  submit: (input: Record<string, unknown>) => Promise<SubmitNotificationResult>;
};

/**
 * A curated spread across every severity tier, both notification kinds, and all
 * three demo namespaces. CTAs point at real internal Kibana paths so the flyout
 * links resolve during the demo.
 */
const seedDemo = async (forType: ForType): Promise<SubmitNotificationResult[]> => {
  const nowMs = Date.now();
  return Promise.all([
    forType({ namespace: 'inference', type: 'modelStatus', kind: 'state' }).submit({
      entity: '.elser-2-elasticsearch',
      state: 'deprecated',
      title: 'ELSER v2 is deprecated',
      description: 'The .elser-2-elasticsearch model is deprecated. Migrate to a supported model.',
      severity: 'warning',
      cta: {
        link: '/app/management/data/inference_endpoints',
        linkText: 'Review inference endpoints',
      },
    }),
    forType({ namespace: 'elasticsearch', type: 'diskWatermark', kind: 'state' }).submit({
      entity: 'data-node-7',
      state: 'high',
      title: 'Disk usage high on data-node-7',
      description:
        'data-node-7 crossed the high disk watermark (85%). Shards will not allocate here.',
      severity: 'error',
      cta: { link: '/app/management/data/index_management', linkText: 'Manage indices' },
    }),
    forType({ namespace: 'elasticsearch', type: 'diskWatermark', kind: 'state' }).submit({
      entity: 'data-node-2',
      state: 'flood_stage',
      title: 'Disk flood stage on data-node-2',
      description: 'data-node-2 crossed the flood-stage watermark (95%). Indices are read-only.',
      severity: 'critical',
      cta: { link: '/app/management/data/index_management', linkText: 'Manage indices' },
    }),
    forType({ namespace: 'reporting', type: 'exportReady', kind: 'timeseries' }).submit({
      event: 'sales-dashboard-pdf',
      epochMs: nowMs,
      title: 'Your PDF report is ready',
      description: 'The "Sales overview" dashboard export finished and is ready to download.',
      severity: 'info',
      cta: { link: '/app/management/insightsAndAlerting/reporting', linkText: 'Open Reporting' },
    }),
    forType({ namespace: 'reporting', type: 'exportReady', kind: 'timeseries' }).submit({
      event: 'ops-csv',
      epochMs: nowMs - 60_000,
      title: 'Your CSV export is ready',
      description: 'The "Operations" saved search export finished and is ready to download.',
      severity: 'info',
      cta: { link: '/app/management/insightsAndAlerting/reporting', linkText: 'Open Reporting' },
    }),
  ]);
};

export interface SeedSummary {
  submitted: number;
  skippedDisabled: number;
  /** Present only when the caller asked to exercise the rejection path. */
  rejectionMessage?: string;
}

/**
 * Submit the demo spread. When `includeUnregistered` is set, also attempt one
 * submission against an unregistered `(namespace, type)` to surface the write-time
 * validation rejection, and report the message rather than throwing.
 */
export const seedDemoNotifications = async (
  forType: ForType,
  logger: Logger,
  includeUnregistered = false
): Promise<SeedSummary> => {
  const results = await seedDemo(forType);
  const summary: SeedSummary = {
    submitted: results.filter(({ status }) => status === 'submitted').length,
    skippedDisabled: results.filter(({ status }) => status === 'skipped_disabled').length,
  };

  if (includeUnregistered) {
    try {
      await (forType as unknown as LooseForType)({
        namespace: 'ghost',
        type: 'notReal',
        kind: 'state',
      }).submit({ entity: 'x', state: 'y', title: 'nope', description: 'unregistered type' });
      summary.rejectionMessage = 'unexpectedly accepted an unregistered type';
    } catch (err) {
      summary.rejectionMessage = (err as Error).message;
      logger.debug(
        `Demo seed rejected an unregistered type as expected: ${summary.rejectionMessage}`
      );
    }
  }

  return summary;
};
