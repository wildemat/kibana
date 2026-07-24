/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/core/server';
import type { NotificationCenterPluginSetup } from '../types';

type ForType = NotificationCenterPluginSetup['forType'];

const STATE_REPUSH_MS = 30_000;
const TIMESERIES_MS = 120_000;

/**
 * Demo-only background producer, modelling a real poller (e.g. the inference
 * plugin) submitting notifications on an interval:
 *
 * - Every 30s it re-pushes the SAME `state` id for a persisting disk-watermark
 *   condition. Collapse keeps it to one row and, because read-state anchors on the
 *   earliest doc, marking it read keeps it read across re-pushes.
 * - Every 2 minutes it submits a NEW `timeseries` occurrence, so the unread badge
 *   visibly increments on its own.
 *
 * Returns a stop function that clears both intervals.
 */
export const startDemoPoller = (forType: ForType, logger: Logger): (() => void) => {
  const submitPersistingState = () =>
    forType({ namespace: 'elasticsearch', type: 'diskWatermark', kind: 'state' })
      .submit({
        entity: 'data-node-7',
        state: 'high',
        title: 'Disk usage high on data-node-7',
        description:
          'data-node-7 remains above the high disk watermark (85%). Shards will not allocate here.',
        severity: 'error',
        cta: { link: '/app/management/data/index_management', linkText: 'Manage indices' },
      })
      .catch((err) => logger.debug(`Demo poller state re-push failed: ${(err as Error).message}`));

  const submitOccurrence = () => {
    const epochMs = Date.now();
    return forType({ namespace: 'reporting', type: 'exportReady', kind: 'timeseries' })
      .submit({
        event: `scheduled-report-${epochMs}`,
        epochMs,
        title: 'A scheduled report is ready',
        description: 'A scheduled dashboard export finished and is ready to download.',
        severity: 'info',
        cta: { link: '/app/management/insightsAndAlerting/reporting', linkText: 'Open Reporting' },
      })
      .catch((err) => logger.debug(`Demo poller occurrence failed: ${(err as Error).message}`));
  };

  logger.info('Notification Center demo producer started (state re-push 30s, occurrence 2m).');
  const stateTimer = setInterval(submitPersistingState, STATE_REPUSH_MS);
  const occurrenceTimer = setInterval(submitOccurrence, TIMESERIES_MS);

  return () => {
    clearInterval(stateTimer);
    clearInterval(occurrenceTimer);
  };
};
