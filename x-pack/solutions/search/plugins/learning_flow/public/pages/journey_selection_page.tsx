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
  EuiPageHeader,
  EuiPageSection,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiButton,
  EuiBadge,
} from '@elastic/eui';
import { useHistory } from 'react-router-dom';
import { SAMPLE_JOURNEYS, getDifficultyColor } from '../data/journey_configs';

export const JourneySelectionPage = () => {
  const history = useHistory();

  const handleStartJourney = (journeyId: string) => {
    history.push(`/journey/${journeyId}/start`);
  };

  return (
    <EuiPage paddingSize="l">
      <EuiPageBody>
        <EuiPageHeader>
          <EuiTitle size="l">
            <h1>Learning Flow Framework</h1>
          </EuiTitle>
        </EuiPageHeader>

        <EuiPageSection>
          <EuiText>
            <p>
              Welcome to the Learning Flow Framework! Choose a journey below to start your
              interactive learning experience with Elasticsearch and Kibana.
            </p>
          </EuiText>

          <EuiSpacer size="l" />

          <EuiFlexGroup gutterSize="l" wrap>
            {SAMPLE_JOURNEYS.map((journey) => (
              <EuiFlexItem key={journey.metadata.id} grow={false}>
                <EuiCard
                  icon={<EuiIcon type="training" size="xxl" />}
                  title={journey.metadata.title}
                  description={journey.metadata.description}
                  footer={
                    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                      <EuiFlexItem grow={false}>
                        <EuiFlexGroup gutterSize="s" alignItems="center">
                          <EuiFlexItem grow={false}>
                            <EuiBadge color={getDifficultyColor(journey.metadata.difficulty)}>
                              {journey.metadata.difficulty.charAt(0).toUpperCase() +
                                journey.metadata.difficulty.slice(1)}
                            </EuiBadge>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiText size="s" color="subdued">
                              {journey.metadata.estimatedTimeMinutes} min
                            </EuiText>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          size="s"
                          fill
                          onClick={() => handleStartJourney(journey.metadata.id)}
                        >
                          Start Journey
                        </EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                />
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiPageSection>
      </EuiPageBody>
    </EuiPage>
  );
};
