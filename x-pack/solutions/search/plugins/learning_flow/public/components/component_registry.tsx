/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { ComponentConfig } from '../../common/types';

// Core components
import { TitleComponent } from './core_components/title_component';
import { TextComponent } from './core_components/text_component';
import { SearchBarComponent } from './core_components/search_bar_component';
import { DataTableComponent } from './core_components/data_table_component';
import { CodeComponent } from './core_components/code_component';
import { ChartComponent } from './core_components/chart_component';

export type ComponentType = React.ComponentType<any>;

export interface ComponentRegistry {
  [componentName: string]: ComponentType;
}

// Component registry mapping component names to React components
export const DEFAULT_COMPONENT_REGISTRY: ComponentRegistry = {
  'title': TitleComponent,
  'text': TextComponent,
  'search-bar': SearchBarComponent,
  'data-table': DataTableComponent,
  'code': CodeComponent,
  'chart': ChartComponent,
};

export class ComponentResolver {
  private registry: ComponentRegistry;

  constructor(registry: ComponentRegistry = DEFAULT_COMPONENT_REGISTRY) {
    this.registry = { ...registry };
  }

  /**
   * Register a new component or override an existing one
   */
  register(name: string, component: ComponentType): void {
    this.registry[name] = component;
  }

  /**
   * Get a component by name
   */
  get(name: string): ComponentType | null {
    return this.registry[name] || null;
  }

  /**
   * Resolve a component configuration to a React element
   */
  resolve(config: ComponentConfig, variables: Record<string, any> = {}): React.ReactElement | null {
    const Component = this.get(config.type);
    
    if (!Component) {
      console.warn(`Unknown component type: ${config.type}`);
      return React.createElement('div', { 
        key: config.id,
        style: { 
          padding: '16px', 
          border: '1px dashed #ccc', 
          background: '#f9f9f9',
          borderRadius: '4px'
        }
      }, `Unknown component: ${config.type}`);
    }

    // Resolve variables in props
    const resolvedProps = this.resolveVariables(config.props, variables);

    return React.createElement(Component, {
      key: config.id,
      id: config.id,
      ...resolvedProps,
    });
  }

  /**
   * Simple variable resolution - replace {{variableName}} with actual values
   */
  private resolveVariables(props: any, variables: Record<string, any>): any {
    if (typeof props === 'string') {
      return props.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    }

    if (Array.isArray(props)) {
      return props.map(item => this.resolveVariables(item, variables));
    }

    if (props && typeof props === 'object') {
      const resolved: any = {};
      for (const [key, value] of Object.entries(props)) {
        resolved[key] = this.resolveVariables(value, variables);
      }
      return resolved;
    }

    return props;
  }

  /**
   * Check if all required components exist for a given config
   */
  validateComponents(components: ComponentConfig[]): string[] {
    const missing: string[] = [];
    
    for (const config of components) {
      if (!this.get(config.type)) {
        missing.push(config.type);
      }
    }

    return missing;
  }
}

// Global instance
export const componentResolver = new ComponentResolver();
