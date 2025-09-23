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
} from '@elastic/eui';
import { useHistory } from 'react-router-dom';
import type { JourneyConfig } from '../../common/types';

// Hardcoded journey configs for Day 1 - will be moved to proper storage later
const SAMPLE_JOURNEYS: JourneyConfig[] = [
  {
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
              text: "ES|QL is Elasticsearch's new query language that provides a powerful way to filter, transform, and analyze your data.",
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
  {
    metadata: {
      id: 'data-visualization',
      title: 'Data Visualization Basics',
      description: 'Learn how to create effective visualizations of your search data.',
      tags: ['visualization', 'charts', 'intermediate'],
      estimatedTimeMinutes: 20,
      difficulty: 'intermediate',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      author: 'Elastic Team',
    },
    steps: [],
    onFinish: {
      type: 'redirect',
      config: { url: '/app/dashboards' },
    },
  },
  {
    metadata: {
      id: 'search-fundamentals',
      title: 'Search Fundamentals',
      description: 'Master the core concepts of search with Elasticsearch.',
      tags: ['search', 'elasticsearch', 'beginner'],
      estimatedTimeMinutes: 25,
      difficulty: 'beginner',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      author: 'Elastic Team',
    },
    steps: [],
    onFinish: {
      type: 'callback',
      config: { action: 'showAchievement' },
    },
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'success';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'danger';
    default:
      return 'primary';
  }
};

export const JourneySelectionPage = () => {
  const history = useHistory();

  const handleStartJourney = (journeyId: string) => {
    history.push(`/journey/${journeyId}`);
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
              <EuiFlexItem
                key={journey.metadata.id}
                style={{ minWidth: '300px', maxWidth: '400px' }}
              >
                <EuiCard
                  icon={<EuiIcon type="training" size="xxl" />}
                  title={journey.metadata.title}
                  description={journey.metadata.description}
                  footer={
                    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                      <EuiFlexItem grow={false}>
                        <EuiText size="s" color="subdued">
                          <span
                            style={{
                              color: `var(--eui-color${
                                getDifficultyColor(journey.metadata.difficulty)
                                  .charAt(0)
                                  .toUpperCase() +
                                getDifficultyColor(journey.metadata.difficulty).slice(1)
                              })`,
                            }}
                          >
                            {journey.metadata.difficulty.charAt(0).toUpperCase() +
                              journey.metadata.difficulty.slice(1)}
                          </span>
                          {' • '}
                          {journey.metadata.estimatedTimeMinutes} min
                        </EuiText>
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
