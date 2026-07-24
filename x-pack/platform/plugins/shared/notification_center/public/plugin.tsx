/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import {
  NOTIFICATION_CENTER_UI_ENABLED_FLAG,
  NOTIFICATION_CENTER_UI_ENABLED_DEFAULT,
} from '../common/feature_flags';
import { createNotificationsApi } from './notifications_api';
import { NotificationsNavButton } from './components/notifications_nav_button';
import type { NotificationCenterPublicSetup, NotificationCenterPublicStart } from './types';

export class NotificationCenterPlugin
  implements Plugin<NotificationCenterPublicSetup, NotificationCenterPublicStart>
{
  public setup(_core: CoreSetup): NotificationCenterPublicSetup {
    return {};
  }

  public start(core: CoreStart): NotificationCenterPublicStart {
    const uiEnabled = core.featureFlags.getBooleanValue(
      NOTIFICATION_CENTER_UI_ENABLED_FLAG,
      NOTIFICATION_CENTER_UI_ENABLED_DEFAULT
    );

    if (uiEnabled) {
      const api = createNotificationsApi(core.http);
      core.chrome.navControls.registerRight({
        order: 1000,
        content: (
          <NotificationsNavButton
            api={api}
            application={core.application}
            basePath={core.http.basePath}
          />
        ),
      });
    }

    return {};
  }

  public stop() {}
}
