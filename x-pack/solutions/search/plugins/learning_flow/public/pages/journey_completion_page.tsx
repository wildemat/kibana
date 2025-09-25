/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageSection,
  EuiEmptyPrompt,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiIcon,
  EuiPanel,
  EuiCallOut,
  EuiProgress,
} from '@elastic/eui';
import { useHistory, useParams } from 'react-router-dom';
import { SAMPLE_JOURNEYS_BY_ID } from '../data/journey_configs';

export const JourneyCompletionPage: React.FC = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const history = useHistory();
  
  const journey = SAMPLE_JOURNEYS_BY_ID[journeyId];

  useEffect(() => {
    // Simulate any completion tracking or analytics
    if (journey) {
      console.log(`Journey completed: ${journey.metadata.title}`);
    }
  }, [journey]);

  if (!journey) {
    return (
      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiEmptyPrompt
            iconType="warning"
            color="danger"
            title={<h2>Journey not found</h2>}
            actions={
              <EuiButton onClick={() => history.push('/')}>
                Back to Journey Selection
              </EuiButton>
            }
          />
        </EuiPageBody>
      </EuiPage>
    );
  }

  const handleReturnHome = () => {
    history.push('/');
  };

  const handleRestartJourney = () => {
    history.push(`/journey/${journeyId}/start`);
  };

  const handleNextSteps = () => {
    // Based on the onFinish config, handle different completion actions
    const { onFinish } = journey;
    
    if (onFinish?.type === 'redirect' && onFinish.config?.url) {
      window.location.href = onFinish.config.url;
    } else if (onFinish?.type === 'callback') {
      // Handle callback actions
      alert(`Achievement unlocked: Completed ${journey.metadata.title}!`);
      handleReturnHome();
    } else {
      // Default modal behavior
      handleReturnHome();
    }
  };

  const getCompletionMessage = () => {
    const { onFinish } = journey;
    if (onFinish?.config?.message) {
      return onFinish.config.message;
    }
    return `You've successfully completed the ${journey.metadata.title} journey! You now understand the key concepts and can apply what you've learned.`;
  };

  const getNextStepsText = () => {
    const { onFinish } = journey;
    if (onFinish?.type === 'redirect') {
      return 'Explore Dashboards';
    } else if (onFinish?.type === 'callback') {
      return 'View Achievement';
    }
    return 'Continue Learning';
  };

  // Calculate some completion stats
  const totalComponents = journey.steps.reduce((sum, step) => sum + step.components.length, 0);
  const componentTypes = Array.from(new Set(
    journey.steps.flatMap(step => step.components.map(comp => comp.type))
  ));

  return (
    <EuiPage paddingSize="l">
      <EuiPageBody>
        <EuiPageSection alignment="center" grow={false}>
          <EuiEmptyPrompt
            icon={<EuiIcon type="checkInCircleFilled" size="xxl" color="success" />}
            title={<h1>Journey Complete!</h1>}
            titleSize="m"
            body={
              <>
                <EuiText size="m" textAlign="center" style={{ maxWidth: '600px' }}>
                  <p>{getCompletionMessage()}</p>
                </EuiText>
                
                <EuiSpacer size="l" />
                
                <EuiCallOut
                  title="What you accomplished"
                  color="success"
                  iconType="trophy"
                  size="s"
                >
                  <EuiFlexGroup gutterSize="l" justifyContent="center">
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" textAlign="center">
                        <strong>{journey.steps.length}</strong><br />
                        Steps completed
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" textAlign="center">
                        <strong>{totalComponents}</strong><br />
                        Components explored
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" textAlign="center">
                        <strong>{journey.metadata.estimatedTimeMinutes} min</strong><br />
                        Time invested
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiCallOut>
                
                <EuiSpacer size="l" />
                
                <EuiPanel paddingSize="m" style={{ maxWidth: '500px' }}>
                  <EuiText size="s">
                    <h4>Skills gained:</h4>
                    <ul>
                      {journey.steps.map((step, index) => (
                        <li key={index}>
                          <EuiIcon type="check" color="success" size="s" style={{ marginRight: '8px' }} />
                          {step.title}
                        </li>
                      ))}
                    </ul>
                  </EuiText>
                </EuiPanel>
                
                <EuiSpacer size="l" />
                
                <EuiProgress value={100} max={100} color="success" size="m" />
                <EuiSpacer size="s" />
                <EuiText size="s" color="success" textAlign="center">
                  100% Complete
                </EuiText>
              </>
            }
            actions={
              <EuiFlexGroup gutterSize="s" justifyContent="center" wrap>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={handleReturnHome} iconType="home">
                    Return Home
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={handleRestartJourney} iconType="refresh">
                    Restart Journey
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton fill onClick={handleNextSteps} iconType="arrowRight">
                    {getNextStepsText()}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
          />
        </EuiPageSection>
      </EuiPageBody>
    </EuiPage>
  );
};
