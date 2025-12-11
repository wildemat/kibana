/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * LocalStorage key used to persist whether the getting started sidenav tour has been completed or dismissed.
 */
export const GETTING_STARTED_SIDENAV_TOUR_KEY = 'search.gettingStarted.sidenavTour.dismissed';

/**
 * The CSS selector used to target the getting started link in the side navigation.
 * This matches the data-test-subj attribute on the sidenav item.
 */
export const GETTING_STARTED_SIDENAV_TOUR_TARGET =
  '[data-test-subj*="nav-item-id-search_getting_started"]';
