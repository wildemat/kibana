/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DataStreamClient } from '@kbn/data-streams';
import type {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
} from '@kbn/core/server';
import type { NotificationCenterConfig } from './config';
import { notificationsDataStreamDefinition } from './data_stream';
import type {
  NotificationCenterPluginSetup,
  NotificationCenterPluginStart,
  NotificationCenterSetupDependencies,
  NotificationCenterStartDependencies,
} from './types';

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
    this.logger.debug('Setting up Notification Center plugin');

    if (!this.config.enabled) {
      return {};
    }

    // Install the index template asynchronously — don't block plugin setup.
    // The data stream itself auto-creates on first write.
    DataStreamClient.initializeTemplate({
      dataStream: notificationsDataStreamDefinition,
      elasticsearchClient: core.elasticsearch.client.asInternalUser,
      logger: this.logger,
    }).catch((err: Error) => {
      this.logger.error(
        `Failed to initialize notifications data stream template: ${err.message}`
      );
    });

    return {};
  }

  public start(_core: CoreStart): NotificationCenterPluginStart {
    return {};
  }

  public stop() {}
}
