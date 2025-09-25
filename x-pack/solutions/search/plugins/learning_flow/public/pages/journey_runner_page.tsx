/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiPanel,
  EuiEmptyPrompt,
} from '@elastic/eui';

import type { JourneyConfig, JourneyProgress } from '../../common/types';
import type { ValidationError } from '../services/validation_service';
import { LayoutRenderer } from '../components/layouts/layout_renderer';
import { JourneyErrorBoundary } from '../components/error_boundary';
import { useKibana } from '../hooks';
import { SAMPLE_JOURNEYS_BY_ID } from '../data/journey_configs';

export const JourneyRunnerPage = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const history = useHistory();
  const { services } = useKibana();

  const [journey, setJourney] = useState<JourneyConfig | null>(null);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [_validationErrors, setValidationErrors] = useState<string[]>([]);

  // Safety check for services - make it non-blocking for now
  const validationService = services?.validation;

  useEffect(() => {
    // Simulate loading the journey config
    const loadJourney = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const journeyConfig = SAMPLE_JOURNEYS_BY_ID[journeyId];
      if (journeyConfig) {
        // Validate journey configuration if validation service is available
        if (validationService) {
          try {
            const validationResult = await validationService.validateJourney(journeyConfig);

            if (!validationResult.valid) {
              setValidationErrors(validationResult.errors.map((e: ValidationError) => e.message));
            }
          } catch (error) {
            // Validation failed - continue without validation errors
          }
        }

        setJourney(journeyConfig);
        setProgress({
          journeyId,
          currentStepIndex: 0,
          completedSteps: [],
          variables: {},
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        });
      }

      setLoading(false);
    };

    if (journeyId) {
      loadJourney();
    }
  }, [journeyId, validationService]);

  const handleNext = () => {
    if (!journey || !progress) return;

    const nextStepIndex = progress.currentStepIndex + 1;
    if (nextStepIndex < journey.steps.length) {
      setProgress({
        ...progress,
        currentStepIndex: nextStepIndex,
        completedSteps: [...progress.completedSteps, journey.steps[progress.currentStepIndex].id],
        lastActiveAt: new Date().toISOString(),
      });
    } else {
      // Journey complete
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (!progress) return;

    const prevStepIndex = Math.max(0, progress.currentStepIndex - 1);
    setProgress({
      ...progress,
      currentStepIndex: prevStepIndex,
      lastActiveAt: new Date().toISOString(),
    });
  };

  const handleFinish = () => {
    // Navigate to completion page instead of showing alert
    history.push(`/journey/${journeyId}/complete`);
  };

  const handleCancel = () => {
    history.push('/');
  };

  if (loading) {
    return (
      <EuiEmptyPrompt
        icon={<EuiProgress size="m" color="primary" />}
        title={<h3>Loading journey...</h3>}
        titleSize="s"
      />
    );
  }

  if (!journey || !progress) {
    return (
      <EuiEmptyPrompt
        iconType="warning"
        color="danger"
        title={<h3>Journey not found</h3>}
        titleSize="s"
        actions={
          <EuiButton onClick={() => history.push('/')}>Back to Journey Selection</EuiButton>
        }
      />
    );
  }

  const currentStep = journey.steps[progress.currentStepIndex];
  const progressPercentage = ((progress.currentStepIndex + 1) / journey.steps.length) * 100;

  const navigationContent = (
    <EuiPanel paddingSize="m" color="subdued">
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            Step {progress.currentStepIndex + 1} of {journey.steps.length}
          </EuiText>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiProgress value={progressPercentage} max={100} color="primary" size="m" />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" onClick={handleCancel} iconType="cross">
                Cancel
              </EuiButtonEmpty>
            </EuiFlexItem>

            {progress.currentStepIndex > 0 && (
              <EuiFlexItem grow={false}>
                <EuiButton size="s" onClick={handlePrevious} iconType="arrowLeft" iconSide="left">
                  Previous
                </EuiButton>
              </EuiFlexItem>
            )}

            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                fill
                onClick={handleNext}
                iconType={
                  progress.currentStepIndex === journey.steps.length - 1 ? 'check' : 'arrowRight'
                }
                iconSide="right"
              >
                {progress.currentStepIndex === journey.steps.length - 1 ? 'Finish' : 'Next'}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  return (
    <JourneyErrorBoundary
      journeyId={journey.metadata.id}
      stepId={currentStep.id}
      onError={(error, context) => {
        // Error handled by error boundary
      }}
      onReset={() => {
        // Reset journey to beginning
        setProgress({
          ...progress,
          currentStepIndex: 0,
          lastActiveAt: new Date().toISOString(),
        });
      }}
    >
      <LayoutRenderer
        layout={currentStep.layout}
        components={currentStep.components}
        variables={progress.variables}
        navigationContent={navigationContent}
      />
    </JourneyErrorBoundary>
  );
};
