/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { JourneyConfig } from '../../common/types';

// Detailed journey config for running journeys
const INTRO_ESQL_JOURNEY: JourneyConfig = {
  metadata: {
    id: 'intro-esql',
    title: 'Introduction to ES|QL',
    description: 'Learn the basics of Elasticsearch Query Language (ES|QL) with hands-on examples.',
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
};

// Hardcoded journey configs for Day 1 - will be moved to proper storage later
export const SAMPLE_JOURNEYS: JourneyConfig[] = [
  INTRO_ESQL_JOURNEY,
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

// Record format for journey runner (lookup by ID)
export const SAMPLE_JOURNEYS_BY_ID: Record<string, JourneyConfig> = {
  'intro-esql': INTRO_ESQL_JOURNEY,
};

export const getDifficultyColor = (difficulty: string) => {
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
