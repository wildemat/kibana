/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { Severity } from '../../common/types';

export interface SeverityDisplay {
  /** EUI color token for the severity icon. */
  color: string;
  /** EUI icon type conveying the severity. */
  iconType: string;
  /** Localized, human-readable severity label. */
  label: string;
}

/** Map a severity tier to its icon, color, and localized label for the flyout. */
export const severityDisplay = (severity: Severity): SeverityDisplay => {
  switch (severity) {
    case 'critical':
      return {
        color: 'danger',
        iconType: 'error',
        label: i18n.translate('notificationCenter.severity.critical', {
          defaultMessage: 'Critical',
        }),
      };
    case 'error':
      return {
        color: 'danger',
        iconType: 'error',
        label: i18n.translate('notificationCenter.severity.error', { defaultMessage: 'Error' }),
      };
    case 'warning':
      return {
        color: 'warning',
        iconType: 'warning',
        label: i18n.translate('notificationCenter.severity.warning', { defaultMessage: 'Warning' }),
      };
    case 'info':
    default:
      return {
        color: 'primary',
        iconType: 'iInCircle',
        label: i18n.translate('notificationCenter.severity.info', { defaultMessage: 'Info' }),
      };
  }
};
