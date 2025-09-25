/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { Routes, Route } from '@kbn/shared-ux-router';

import { JourneySelectionPage } from './pages/journey_selection_page';
import { JourneyStartPage } from './pages/journey_start_page';
import { JourneyRunnerPage } from './pages/journey_runner_page';
import { JourneyCompletionPage } from './pages/journey_completion_page';

export const LearningFlowRouter = () => {
  return (
    <Routes>
      <Route exact path="/" component={JourneySelectionPage} />
      <Route exact path="/journey/:journeyId/start" component={JourneyStartPage} />
      <Route exact path="/journey/:journeyId/run" component={JourneyRunnerPage} />
      <Route exact path="/journey/:journeyId/complete" component={JourneyCompletionPage} />
      {/* Legacy route for backward compatibility */}
      <Route path="/journey/:journeyId" component={JourneyRunnerPage} />
      <Route path="*" component={JourneySelectionPage} />
    </Routes>
  );
};
