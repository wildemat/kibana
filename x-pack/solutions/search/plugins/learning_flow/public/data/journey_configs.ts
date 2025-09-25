/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { JourneyConfig } from '../../common/types';

// Data Visualization Basics Journey
const DATA_VISUALIZATION_JOURNEY: JourneyConfig = {
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
  steps: [
    {
      id: 'step-1',
      title: 'Introduction to Data Visualization',
      description: 'Understanding the importance of data visualization',
      layout: {
        type: 'single-column',
        slots: ['header', 'content', 'footer'],
      },
      components: [
        {
          id: 'viz-title',
          type: 'title',
          slot: 'header',
          props: {
            text: 'Data Visualization Fundamentals',
            size: 'l',
          },
        },
        {
          id: 'viz-intro',
          type: 'text',
          slot: 'content',
          props: {
            text: 'Data visualization transforms raw data into meaningful insights through charts, graphs, and interactive displays. In Kibana, you can create powerful visualizations to understand your Elasticsearch data.',
            size: 'm',
          },
        },
        {
          id: 'sample-chart',
          type: 'chart',
          slot: 'content',
          props: {
            type: 'bar',
            title: 'Sample Data Distribution',
            data: [
              { x: 'Logs', y: 150, label: 'Log Events' },
              { x: 'Metrics', y: 85, label: 'Metric Points' },
              { x: 'Traces', y: 45, label: 'Trace Spans' },
              { x: 'APM', y: 120, label: 'APM Events' },
            ],
          },
        },
      ],
    },
    {
      id: 'step-2',
      title: 'Chart Types and When to Use Them',
      description: 'Learn about different chart types',
      layout: {
        type: 'two-column',
        slots: ['sidebar', 'content', 'footer'],
      },
      components: [
        {
          id: 'chart-types-info',
          type: 'text',
          slot: 'sidebar',
          props: {
            text: '**Chart Types:**\n\n- **Bar Charts**: Compare categories\n- **Line Charts**: Show trends over time\n- **Pie Charts**: Show proportions\n- **Tables**: Display detailed data',
            markdown: true,
          },
        },
        {
          id: 'sample-line-chart',
          type: 'chart',
          slot: 'content',
          props: {
            type: 'line',
            title: 'Website Traffic Over Time',
            height: 250,
          },
        },
      ],
    },
  ],
  onFinish: {
    type: 'redirect',
    config: { url: '/app/dashboards' },
  },
};

// Search Fundamentals Journey
const SEARCH_FUNDAMENTALS_JOURNEY: JourneyConfig = {
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
  steps: [
    {
      id: 'step-1',
      title: 'What is Full-Text Search?',
      description: 'Understanding search fundamentals',
      layout: {
        type: 'single-column',
        slots: ['header', 'content', 'footer'],
      },
      components: [
        {
          id: 'search-title',
          type: 'title',
          slot: 'header',
          props: {
            text: 'Search Fundamentals',
            size: 'l',
          },
        },
        {
          id: 'search-intro',
          type: 'text',
          slot: 'content',
          props: {
            text: 'Elasticsearch is a distributed search and analytics engine built on Apache Lucene. It provides full-text search capabilities, real-time analytics, and can handle structured and unstructured data.',
            size: 'm',
          },
        },
      ],
    },
    {
      id: 'step-2',
      title: 'Try Your First Search',
      description: 'Interactive search experience',
      layout: {
        type: 'two-column',
        slots: ['sidebar', 'content', 'footer'],
      },
      components: [
        {
          id: 'search-tips',
          type: 'text',
          slot: 'sidebar',
          props: {
            text: '**Search Tips:**\n\n- Use quotes for exact phrases\n- Use wildcards (*)\n- Try boolean operators (AND, OR)\n- Use field-specific searches',
            markdown: true,
          },
        },
        {
          id: 'interactive-search',
          type: 'search-bar',
          slot: 'content',
          props: {
            placeholder: 'Try searching for "error logs" or status:404',
            multiline: false,
            showExecuteButton: true,
            helpText: 'Enter a search query and click Execute to see results',
          },
        },
        {
          id: 'sample-results',
          type: 'data-table',
          slot: 'content',
          props: {
            data: [
              {
                timestamp: '2024-01-15T10:30:00Z',
                level: 'ERROR',
                message: 'Connection timeout',
                source: 'app.js:142',
              },
              {
                timestamp: '2024-01-15T10:29:45Z',
                level: 'WARN',
                message: 'Slow query detected',
                source: 'db.js:89',
              },
              {
                timestamp: '2024-01-15T10:29:30Z',
                level: 'INFO',
                message: 'User logged in',
                source: 'auth.js:56',
              },
            ],
            columns: [
              { field: 'timestamp', name: 'Timestamp', sortable: true },
              { field: 'level', name: 'Level', sortable: true },
              { field: 'message', name: 'Message', truncateText: true },
              { field: 'source', name: 'Source', truncateText: true },
            ],
          },
        },
      ],
    },
    {
      id: 'step-3',
      title: 'Understanding Search Results',
      description: 'Learn to interpret search results',
      layout: {
        type: 'single-column',
        slots: ['header', 'content', 'footer'],
      },
      components: [
        {
          id: 'results-title',
          type: 'title',
          slot: 'content',
          props: {
            text: 'Search Results Analysis',
            size: 'm',
          },
        },
        {
          id: 'results-chart',
          type: 'chart',
          slot: 'content',
          props: {
            type: 'bar',
            title: 'Log Levels Distribution',
            data: [
              { x: 'INFO', y: 450, label: 'Information' },
              { x: 'WARN', y: 125, label: 'Warning' },
              { x: 'ERROR', y: 75, label: 'Error' },
              { x: 'DEBUG', y: 200, label: 'Debug' },
            ],
          },
        },
        {
          id: 'results-explanation',
          type: 'text',
          slot: 'content',
          props: {
            text: 'Search results show the distribution of log levels in your data. INFO logs are most common, followed by DEBUG logs for troubleshooting.',
            size: 'm',
          },
        },
      ],
    },
  ],
  onFinish: {
    type: 'callback',
    config: { action: 'showAchievement' },
  },
};

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

// Hardcoded journey configs for Day 2 - complete with all components
export const SAMPLE_JOURNEYS: JourneyConfig[] = [
  INTRO_ESQL_JOURNEY,
  DATA_VISUALIZATION_JOURNEY,
  SEARCH_FUNDAMENTALS_JOURNEY,
];

// Record format for journey runner (lookup by ID)
export const SAMPLE_JOURNEYS_BY_ID: Record<string, JourneyConfig> = {
  'intro-esql': INTRO_ESQL_JOURNEY,
  'data-visualization': DATA_VISUALIZATION_JOURNEY,
  'search-fundamentals': SEARCH_FUNDAMENTALS_JOURNEY,
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
