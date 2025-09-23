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
  slot?: LayoutSlot;
  props: Record<string, any>;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'exists';
    value: any;
  }>;
}

// Slot definitions for each layout type
export type SingleColumnSlot = 'header' | 'content' | 'footer';
export type TwoColumnSlot = 'header' | 'sidebar' | 'content' | 'footer';
export type HeroSlot = 'hero' | 'content' | 'footer';
export type SideBySideSlot = 'left' | 'right' | 'header' | 'footer';

// Union type for all possible slots
export type LayoutSlot = SingleColumnSlot | TwoColumnSlot | HeroSlot | SideBySideSlot;

// Layout-specific interfaces
export interface SingleColumnLayout {
  type: 'single-column';
  slots: SingleColumnSlot[];
  config?: Record<string, any>;
}

export interface TwoColumnLayout {
  type: 'two-column';
  slots: TwoColumnSlot[];
  config?: Record<string, any>;
}

export interface HeroLayout {
  type: 'hero';
  slots: HeroSlot[];
  config?: Record<string, any>;
}

export interface SideBySideLayout {
  type: 'side-by-side';
  slots: SideBySideSlot[];
  config?: Record<string, any>;
}

// Union type for all layout templates
export type LayoutTemplate = SingleColumnLayout | TwoColumnLayout | HeroLayout | SideBySideLayout;

export interface JourneyStep {
  id: string;
  title: string;
  description?: string;
  layout: LayoutTemplate;
  components: ComponentConfig[];
  variables?: Record<string, VariableSource>;
  onEnter?: string; // Event handler name
  onExit?: string; // Event handler name
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
