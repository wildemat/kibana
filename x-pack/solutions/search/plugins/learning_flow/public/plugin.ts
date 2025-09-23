/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AppMountParameters, CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import { DEFAULT_APP_CATEGORIES } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { PLUGIN_ID } from '../common';

import type {
  LearningFlowPluginSetup,
  LearningFlowPluginStart,
  LearningFlowPluginSetupDependencies,
  LearningFlowPluginStartDependencies,
  LearningFlowServicesContextDeps,
} from './types';
import { ValidationService } from './services';

export class LearningFlowPlugin
  implements
    Plugin<
      LearningFlowPluginSetup,
      LearningFlowPluginStart,
      LearningFlowPluginSetupDependencies,
      LearningFlowPluginStartDependencies
    >
{
  private readonly validationService = new ValidationService();
  public setup(
    core: CoreSetup<LearningFlowPluginStartDependencies, LearningFlowPluginStart>
  ): LearningFlowPluginSetup {
    const validation = this.validationService.setup();
    core.application.register({
      id: PLUGIN_ID,
      appRoute: '/app/elasticsearch/learning-flow',
      title: i18n.translate('xpack.learningFlow.appTitle', {
        defaultMessage: 'Learning Flow Framework',
      }),
      category: DEFAULT_APP_CATEGORIES.enterpriseSearch,
      euiIconType: 'training',
      async mount({ element, history }: AppMountParameters) {
        const { renderApp } = await import('./application');
        const [coreStart, depsStart] = await core.getStartServices();

        const startDeps: LearningFlowServicesContextDeps = {
          ...depsStart,
          history,
          validation,
        };

        return renderApp(coreStart, startDeps, element);
      },
      order: 200,
      visibleIn: ['globalSearch', 'sideNav'],
    });

    return {
      validation,
    };
  }

  public start(core: CoreStart): LearningFlowPluginStart {
    const validation = this.validationService.setup();

    return {
      validation,
    };
  }
}

export const plugin = () => new LearningFlowPlugin();
