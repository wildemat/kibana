/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
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
  EuiBadge,
  EuiSpacer,
  EuiIcon,
  EuiPanel,
} from '@elastic/eui';
import { useHistory, useParams } from 'react-router-dom';
import { SAMPLE_JOURNEYS_BY_ID, getDifficultyColor } from '../data/journey_configs';

export const JourneyStartPage: React.FC = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const history = useHistory();
  
  const journey = SAMPLE_JOURNEYS_BY_ID[journeyId];

  if (!journey) {
    return (
      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiEmptyPrompt
            iconType="warning"
            color="danger"
            title={<h2>Journey not found</h2>}
            body={<p>The requested journey could not be found.</p>}
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

  const handleStart = () => {
    history.push(`/journey/${journeyId}/run`);
  };

  const handleBack = () => {
    history.push('/');
  };

  const topicsCovered = journey.steps.map(step => step.title);
  const componentTypes = Array.from(new Set(
    journey.steps.flatMap(step => step.components.map(comp => comp.type))
  ));

  return (
    <EuiPage paddingSize="l">
      <EuiPageBody>
        <EuiPageSection alignment="center" grow={false}>
          <EuiEmptyPrompt
            icon={<EuiIcon type="training" size="xxl" />}
            title={<h1>{journey.metadata.title}</h1>}
            titleSize="m"
            body={
              <>
                <EuiText size="m" textAlign="center" style={{ maxWidth: '600px' }}>
                  <p>{journey.metadata.description}</p>
                </EuiText>
                
                <EuiSpacer size="l" />
                
                <EuiFlexGroup justifyContent="center" gutterSize="l" wrap>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup alignItems="center" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="clock" size="m" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s">
                          {journey.metadata.estimatedTimeMinutes} minutes
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  
                  <EuiFlexItem grow={false}>
                    <EuiBadge color={getDifficultyColor(journey.metadata.difficulty)}>
                      {journey.metadata.difficulty.charAt(0).toUpperCase() + 
                       journey.metadata.difficulty.slice(1)}
                    </EuiBadge>
                  </EuiFlexItem>
                  
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup alignItems="center" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="documents" size="m" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size="s">
                          {journey.steps.length} steps
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
                
                <EuiSpacer size="xl" />
                
                <EuiFlexGroup justifyContent="center" gutterSize="l" wrap>
                  <EuiFlexItem grow={false} style={{ minWidth: '300px', maxWidth: '400px' }}>
                    <EuiPanel paddingSize="m">
                      <EuiText size="s">
                        <h4>What you'll learn:</h4>
                        <ul>
                          {topicsCovered.map((topic, index) => (
                            <li key={index}>{topic}</li>
                          ))}
                        </ul>
                      </EuiText>
                    </EuiPanel>
                  </EuiFlexItem>
                  
                  <EuiFlexItem grow={false} style={{ minWidth: '300px', maxWidth: '400px' }}>
                    <EuiPanel paddingSize="m">
                      <EuiText size="s">
                        <h4>Interactive components:</h4>
                        <EuiFlexGroup gutterSize="s" wrap>
                          {componentTypes.map((type, index) => (
                            <EuiFlexItem grow={false} key={index}>
                              <EuiBadge color="hollow">
                                {type.replace('-', ' ')}
                              </EuiBadge>
                            </EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </EuiText>
                    </EuiPanel>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </>
            }
            actions={
              <EuiFlexGroup gutterSize="s" justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty onClick={handleBack} iconType="arrowLeft">
                    Back to Selection
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton fill onClick={handleStart} iconType="play">
                    Start Journey
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
