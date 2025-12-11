/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SEARCH_GETTING_STARTED_SIDENAV_TOUR_FEATURE_FLAG } from '@kbn/search-shared-ui';
import { useKibana } from './use_kibana';

/**
 * React hook to check if the Getting Started sidenav tour feature is enabled.
 * Default to true if the feature flag is not set or the feature flags service is not available.
 *
 * @returns boolean indicating if the tour feature is enabled
 */
export const useSidenavTourFeatureFlag = (): boolean => {
  const { featureFlags } = useKibana().services;

  if (!featureFlags) {
    return true;
  }

  return featureFlags.getBooleanValue(SEARCH_GETTING_STARTED_SIDENAV_TOUR_FEATURE_FLAG, true);
};
