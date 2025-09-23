/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SharePluginStart } from '@kbn/share-plugin/public';

export type LearningFlowPluginSetupDependencies = Record<string, never>;

export interface LearningFlowPluginStartDependencies {
  share: SharePluginStart;
}

// Only expose what external consumers actually need
export type LearningFlowPluginSetup = Record<string, never>;

export type LearningFlowPluginStart = Record<string, never>;

// Internal service context - validation is internal only
export interface LearningFlowServicesContextDeps extends LearningFlowPluginStartDependencies {
  history: any;
}
