/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { of } from 'rxjs';

import type { TourManagerContract } from './lib';

export const createSolutionViewTourManagerMock = (): jest.Mocked<TourManagerContract> => ({
  showTour$: of(false),
  currentStep: of(1),
  additionalSteps: of([]),
  stepsTotal$: of(1),
  startTour: jest.fn().mockResolvedValue({ result: 'not_available' }),
  finishTour: jest.fn().mockResolvedValue(void 0),
  waitForTourEnd: jest.fn().mockResolvedValue(void 0),
  registerStep: jest.fn(),
  getCurrentStep: jest.fn().mockReturnValue(1),
  getStepsForSolution: jest.fn().mockReturnValue([]),
  nextStep: jest.fn(),
  resetSteps: jest.fn(),
});
