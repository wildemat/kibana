/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import type { SharePluginStart } from '@kbn/share-plugin/public';

export interface LearningFlowPluginSetupDependencies {}

export interface LearningFlowPluginStartDependencies {
  share: SharePluginStart;
}

export interface LearningFlowPluginSetup {}

export interface LearningFlowPluginStart {}

export interface LearningFlowServicesContextDeps extends LearningFlowPluginStartDependencies {
  history: any;
}
