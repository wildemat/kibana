/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export interface VariableSource {
  type: 'static' | 'user-input' | 'computed' | 'api';
  value?: any;
  key?: string;
  defaultValue?: any;
}

export interface ComponentConfig {
  id: string;
  type: string;
  slot?: string;
  props: Record<string, any>;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'exists';
    value: any;
  }>;
}

export interface LayoutTemplate {
  type: 'single-column' | 'two-column' | 'hero' | 'side-by-side';
  slots: string[];
  config?: Record<string, any>;
}

export interface JourneyStep {
  id: string;
  title: string;
  description?: string;
  layout: LayoutTemplate;
  components: ComponentConfig[];
  variables?: Record<string, VariableSource>;
  onEnter?: string; // Event handler name
  onExit?: string;  // Event handler name
}

export interface JourneyMetadata {
  id: string;
  title: string;
  description: string;
  tags: string[];
  estimatedTimeMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface JourneyConfig {
  metadata: JourneyMetadata;
  variables?: Record<string, VariableSource>;
  steps: JourneyStep[];
  onFinish?: {
    type: 'redirect' | 'modal' | 'callback';
    config: Record<string, any>;
  };
}

export interface JourneyProgress {
  journeyId: string;
  currentStepIndex: number;
  completedSteps: string[];
  variables: Record<string, any>;
  startedAt: string;
  lastActiveAt: string;
}
