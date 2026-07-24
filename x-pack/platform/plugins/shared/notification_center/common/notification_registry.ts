/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { NotificationNamespaceDefinition } from './notification_registry_types';

/**
 * This registry is a static store where plugins declare which notifications they produce.
 * Each notification is identified by a unique `(namespace, type)` pair.
 * This registry ensures plugins only submit notifications that have been declared here.
 *
 * Notification Center uses this to build query filters, display metadata in the UI,
 * and properly gate notifications based on feature flags. A type's `feature_flag`
 * is optional — omit it to send that type immediately with no gate.
 */
export const NOTIFICATION_REGISTRY = {
  inference: {
    display_name: 'Elastic Inference Service',
    description: 'Lifecycle changes to inference models.',
    types: {
      modelStatus: {
        display_name: 'Model status',
        description: 'A change to the lifecycle status of an inference model, such as deprecation.',
        feature_flag: 'notificationCenter.types.inference.modelStatus',
        kind: 'state',
      },
    },
  },
  reporting: {
    display_name: 'Reporting',
    description: 'Progress of report generation and export.',
    types: {
      exportReady: {
        display_name: 'Export ready',
        description: 'A report finished generating and is ready to download.',
        kind: 'timeseries',
      },
    },
  },
  elasticsearch: {
    display_name: 'Elasticsearch',
    description: 'Cluster health and capacity conditions.',
    types: {
      diskWatermark: {
        display_name: 'Disk watermark',
        description: 'A data node crossed a disk usage watermark threshold.',
        kind: 'state',
      },
    },
  },
} as const satisfies Record<string, NotificationNamespaceDefinition>;
