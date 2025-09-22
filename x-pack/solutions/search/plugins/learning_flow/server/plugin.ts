/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/server';

import type {
  LearningFlowPluginSetup,
  LearningFlowPluginStart,
  LearningFlowPluginSetupDependencies,
  LearningFlowPluginStartDependencies,
} from './types';

export class LearningFlowPlugin
  implements
    Plugin<
      LearningFlowPluginSetup,
      LearningFlowPluginStart,
      LearningFlowPluginSetupDependencies,
      LearningFlowPluginStartDependencies
    >
{
  public setup(
    core: CoreSetup<LearningFlowPluginStartDependencies, LearningFlowPluginStart>
  ): LearningFlowPluginSetup {
    // Register server-side routes here in later phases
    return {};
  }

  public start(core: CoreStart): LearningFlowPluginStart {
    return {};
  }
}

export const plugin = () => new LearningFlowPlugin();
