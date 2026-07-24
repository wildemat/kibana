/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ReservedPrivilegesSet, type CoreSetup, type Logger } from '@kbn/core/server';
import type { NotificationCenterPluginSetup } from '../types';
import { seedDemoNotifications } from './seed';

const INTERNAL_BASE = '/internal/notification_center';
const API_VERSION = '1';

/**
 * Demo-only one-shot seed route. Registered alongside the demo poller, behind
 * `xpack.notificationCenter.demoProducer`, so it never exists in a normal build.
 */
export const registerDemoRoutes = (
  core: CoreSetup,
  forType: NotificationCenterPluginSetup['forType'],
  logger: Logger
): void => {
  const router = core.http.createRouter();

  const seedRoute = router.versioned.post({
    path: `${INTERNAL_BASE}/_demo/seed`,
    access: 'internal',
    security: { authz: { requiredPrivileges: [ReservedPrivilegesSet.superuser] } },
  });
  seedRoute.addVersion(
    {
      version: API_VERSION,
      validate: {
        request: {
          query: schema.object({ invalid: schema.boolean({ defaultValue: false }) }),
        },
      },
    },
    async (_ctx, request, response) => {
      const summary = await seedDemoNotifications(forType, logger, request.query.invalid);
      return response.ok({ body: summary });
    }
  );
};
