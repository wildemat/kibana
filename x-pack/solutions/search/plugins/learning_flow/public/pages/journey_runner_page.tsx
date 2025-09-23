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
} from '@elastic/eui';

import type { JourneyConfig, JourneyProgress } from '../../common/types';
import { LayoutRenderer } from '../components/layouts/layout_renderer';
import { JourneyErrorBoundary } from '../components/error_boundary';
import { useKibana } from '../hooks';

// This will be replaced with proper data fetching later
const SAMPLE_JOURNEYS: Record<string, JourneyConfig> = {
  'intro-esql': {
    metadata: {
      id: 'intro-esql',
      title: 'Introduction to ES|QL',
      description:
        'Learn the basics of Elasticsearch Query Language (ES|QL) with hands-on examples.',
      tags: ['elasticsearch', 'query', 'beginner'],
      estimatedTimeMinutes: 15,
      difficulty: 'beginner',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      author: 'Elastic Team',
    },
    steps: [
      {
        id: 'step-1',
        title: 'Welcome to ES|QL',
        description: 'Introduction to Elasticsearch Query Language',
        layout: {
          type: 'single-column',
          slots: ['header', 'content', 'footer'],
        },
        components: [
          {
            id: 'welcome-title',
            type: 'title',
            slot: 'header',
            props: {
              text: 'Welcome to ES|QL Learning Journey',
              size: 'l',
            },
          },
          {
            id: 'intro-text',
            type: 'text',
            slot: 'content',
            props: {
              text: "ES|QL is Elasticsearch's new query language that provides a powerful way to filter, transform, and analyze your data. In this journey, you'll learn the fundamentals and practice with real examples.",
              size: 'm',
            },
          },
        ],
      },
      {
        id: 'step-2',
        title: 'Basic Query Structure',
        description: 'Learn the basic structure of ES|QL queries',
        layout: {
          type: 'two-column',
          slots: ['sidebar', 'content', 'footer'],
        },
        components: [
          {
            id: 'progress-info',
            type: 'text',
            slot: 'sidebar',
            props: {
              text: "Step 2 of 3\n\nIn this step, you'll learn about:\n- Basic syntax\n- Field selection\n- Simple filtering",
              markdown: true,
            },
          },
          {
            id: 'query-example',
            type: 'code',
            slot: 'content',
            props: {
              code: 'FROM logs-*\n| WHERE @timestamp > NOW() - 1h\n| STATS count() BY host.name',
              language: 'sql',
            },
          },
          {
            id: 'query-explanation',
            type: 'text',
            slot: 'content',
            props: {
              text: 'This query demonstrates the basic ES|QL structure: FROM (data source), WHERE (filtering), and STATS (aggregation).',
              size: 'm',
            },
          },
        ],
      },
    ],
    onFinish: {
      type: 'modal',
      config: {
        title: 'Journey Complete!',
        message: 'Congratulations on completing the ES|QL introduction.',
      },
    },
  },
};

export const JourneyRunnerPage = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const history = useHistory();
  const { services } = useKibana();

  const [journey, setJourney] = useState<JourneyConfig | null>(null);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Safety check for services - make it non-blocking for now
  const validationService = services?.validation;

  useEffect(() => {
    // Simulate loading the journey config
    const loadJourney = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const journeyConfig = SAMPLE_JOURNEYS[journeyId];
      if (journeyConfig) {
        // Validate journey configuration if validation service is available
        if (validationService) {
          try {
            const validationResult = await validationService.validateJourney(journeyConfig);

            if (!validationResult.valid) {
              setValidationErrors(validationResult.errors.map((e) => e.message));
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
    // Handle journey completion based on onFinish config
    alert('Journey completed! This would show the completion modal or redirect.');
    history.push('/');
  };

  const handleCancel = () => {
    history.push('/');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <EuiProgress size="m" color="primary" />
        <EuiSpacer size="m" />
        <EuiText>Loading journey...</EuiText>
      </div>
    );
  }

  if (!journey || !progress) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <EuiText color="danger">Journey not found</EuiText>
        <EuiSpacer size="m" />
        <EuiButton onClick={() => history.push('/')}>Back to Journey Selection</EuiButton>
      </div>
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
