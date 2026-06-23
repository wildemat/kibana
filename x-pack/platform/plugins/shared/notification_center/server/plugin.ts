/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '@kbn/core/server';
import type { NotificationCenterConfig } from './config';
import type {
  NotificationCenterPluginSetup,
  NotificationCenterPluginStart,
  NotificationCenterSetupDependencies,
  NotificationCenterStartDependencies,
} from './types';
import { notificationDataStreamDefinition } from './data_stream/notification_data_stream';

export class NotificationCenterPlugin
  implements
    Plugin<
      NotificationCenterPluginSetup,
      NotificationCenterPluginStart,
      NotificationCenterSetupDependencies,
      NotificationCenterStartDependencies
    >
{
  private readonly logger: Logger;
  private readonly config: NotificationCenterConfig;

  constructor(context: PluginInitializerContext<NotificationCenterConfig>) {
    this.logger = context.logger.get();
    this.config = context.config.get();
  }

  public setup(
    core: CoreSetup<NotificationCenterStartDependencies, NotificationCenterPluginStart>
  ): NotificationCenterPluginSetup {
    if (!this.config.enabled) {
      this.logger.debug('Notification Center plugin is disabled');
      return {};
    }

    this.logger.debug('Setting up Notification Center plugin');
    core.dataStreams.registerDataStream(notificationDataStreamDefinition);

    return {};
  }

  public start(_core: CoreStart): NotificationCenterPluginStart {
    return {};
  }

  public stop() {}
}
