/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Routes, Route } from '@kbn/shared-ux-router';

import { JourneySelectionPage } from './pages/journey_selection_page';
import { JourneyRunnerPage } from './pages/journey_runner_page';

export const LearningFlowRouter = () => {
  return (
    <Routes>
      <Route exact path="/" component={JourneySelectionPage} />
      <Route path="/journey/:journeyId" component={JourneyRunnerPage} />
      <Route path="*" component={JourneySelectionPage} />
    </Routes>
  );
};
