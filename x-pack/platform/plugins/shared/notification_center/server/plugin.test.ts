/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { coreMock } from '@kbn/core/server/mocks';
import { NotificationCenterPlugin } from './plugin';
import { notificationDataStreamDefinition } from './data_stream/notification_data_stream';

describe('NotificationCenterPlugin', () => {
  describe('setup', () => {
    it('registers the notification data stream when enabled', () => {
      const context = coreMock.createPluginInitializerContext({ enabled: true });
      const plugin = new NotificationCenterPlugin(context);
      const coreSetup = coreMock.createSetup();

      plugin.setup(coreSetup);

      expect(coreSetup.dataStreams.registerDataStream).toHaveBeenCalledTimes(1);
      expect(coreSetup.dataStreams.registerDataStream).toHaveBeenCalledWith(
        notificationDataStreamDefinition
      );
    });

    it('does not register the data stream when disabled', () => {
      const context = coreMock.createPluginInitializerContext({ enabled: false });
      const plugin = new NotificationCenterPlugin(context);
      const coreSetup = coreMock.createSetup();

      plugin.setup(coreSetup);

      expect(coreSetup.dataStreams.registerDataStream).not.toHaveBeenCalled();
    });
  });
});
