/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Suspense } from 'react';
import { EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { ComponentConfig } from '../../common/types';

// Import components directly for now to test basic functionality
import { TitleComponent } from './core_components/title_component';
import { TextComponent } from './core_components/text_component';
import { SearchBarComponent } from './core_components/search_bar_component';
import { DataTableComponent } from './core_components/data_table_component';
import { CodeComponent } from './core_components/code_component';
import { ChartComponent } from './core_components/chart_component';

export type ComponentType = React.ComponentType<any>;
export type ComponentFactory = () => Promise<{ default: ComponentType }>;

export interface ComponentRegistry {
  [componentName: string]: ComponentType | ComponentFactory;
}

// Simple direct component registry for testing
const DIRECT_COMPONENT_REGISTRY: { [key: string]: ComponentType } = {
  'title': TitleComponent,
  'text': TextComponent,
  'search-bar': SearchBarComponent,
  'data-table': DataTableComponent,
  'code': CodeComponent,
  'chart': ChartComponent,
};

// Lazy-loaded component factories (fallback)
const componentFactories: { [key: string]: ComponentFactory } = {
  'title': () => import('./core_components/title_component').then(m => ({ default: m.TitleComponent })),
  'text': () => import('./core_components/text_component').then(m => ({ default: m.TextComponent })),
  'search-bar': () => import('./core_components/search_bar_component').then(m => ({ default: m.SearchBarComponent })),
  'data-table': () => import('./core_components/data_table_component').then(m => ({ default: m.DataTableComponent })),
  'code': () => import('./core_components/code_component').then(m => ({ default: m.CodeComponent })),
  'chart': () => import('./core_components/chart_component').then(m => ({ default: m.ChartComponent })),
};

// Loading fallback component
const ComponentLoadingFallback: React.FC<{ componentType: string }> = ({ componentType }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      minHeight: '60px',
    }}
  >
    <EuiLoadingSpinner size="m" />
    <EuiText size="s" style={{ marginLeft: '8px' }}>
      {i18n.translate('xpack.learningFlow.componentRegistry.loading', {
        defaultMessage: 'Loading {componentType} component...',
        values: { componentType },
      })}
    </EuiText>
  </div>
);

// Error fallback component
const ComponentErrorFallback: React.FC<{ componentType: string; error?: string }> = ({ 
  componentType, 
  error 
}) => (
  <div
    style={{
      padding: '16px',
      border: '1px dashed #d93026',
      background: '#fef5f5',
      borderRadius: '4px',
      color: '#d93026',
    }}
  >
    <EuiText size="s">
      <strong>
        {i18n.translate('xpack.learningFlow.componentRegistry.error', {
          defaultMessage: 'Error loading component: {componentType}',
          values: { componentType },
        })}
      </strong>
      {error && <div>{error}</div>}
    </EuiText>
  </div>
);

export class ComponentResolver {
  private registry: ComponentRegistry;
  private loadedComponents: Map<string, ComponentType> = new Map();
  private loadingPromises: Map<string, Promise<ComponentType>> = new Map();
  private useLazyLoading: boolean = false; // Toggle for testing

  constructor(registry?: ComponentRegistry) {
    // Use direct registry for immediate availability, fall back to lazy loading
    this.registry = registry || (this.useLazyLoading ? componentFactories : DIRECT_COMPONENT_REGISTRY);
    
    // If using direct components, preload them into the cache
    if (!this.useLazyLoading) {
      Object.entries(DIRECT_COMPONENT_REGISTRY).forEach(([name, component]) => {
        this.loadedComponents.set(name, component);
      });
    }
  }

  /**
   * Enable or disable lazy loading
   */
  setLazyLoading(enabled: boolean): void {
    this.useLazyLoading = enabled;
    if (enabled) {
      this.registry = componentFactories;
      this.loadedComponents.clear();
    } else {
      this.registry = DIRECT_COMPONENT_REGISTRY;
      Object.entries(DIRECT_COMPONENT_REGISTRY).forEach(([name, component]) => {
        this.loadedComponents.set(name, component);
      });
    }
  }

  /**
   * Register a new component or override an existing one
   */
  register(name: string, component: ComponentType | ComponentFactory): void {
    this.registry[name] = component;
    // Clear cached component if it exists
    if (this.loadedComponents.has(name)) {
      this.loadedComponents.delete(name);
    }
    if (this.loadingPromises.has(name)) {
      this.loadingPromises.delete(name);
    }
  }

  /**
   * Get a component by name - handles both sync and async components
   */
  async get(name: string): Promise<ComponentType | null> {
    // Check if component is already loaded
    if (this.loadedComponents.has(name)) {
      return this.loadedComponents.get(name)!;
    }

    // Check if component is currently loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    const registryEntry = this.registry[name];
    if (!registryEntry) {
      return null;
    }

    // If it's already a component (not a factory), return it
    if (typeof registryEntry !== 'function' || registryEntry.prototype?.render || registryEntry.prototype?.isReactComponent) {
      const component = registryEntry as ComponentType;
      this.loadedComponents.set(name, component);
      return component;
    }

    // It's a factory function, load it asynchronously
    const factory = registryEntry as ComponentFactory;
    const loadingPromise = factory()
      .then((module) => {
        const component = module.default;
        this.loadedComponents.set(name, component);
        this.loadingPromises.delete(name);
        return component;
      })
      .catch((error) => {
        console.error(`Failed to load component: ${name}`, error);
        this.loadingPromises.delete(name);
        throw error;
      });

    this.loadingPromises.set(name, loadingPromise);
    return loadingPromise;
  }

  /**
   * Get a component synchronously (returns null if not loaded)
   */
  getSync(name: string): ComponentType | null {
    return this.loadedComponents.get(name) || null;
  }

  /**
   * Resolve a component configuration to a React element
   */
  resolve(config: ComponentConfig, variables: Record<string, any> = {}): React.ReactElement {
    // For immediate mode, use synchronous resolution
    if (!this.useLazyLoading) {
      const Component = this.getSync(config.type);
      
      if (!Component) {
        return React.createElement(ComponentErrorFallback, {
          key: config.id,
          componentType: config.type,
          error: `Unknown component type: ${config.type}`
        });
      }

      // Resolve variables in props
      const resolvedProps = this.resolveVariables(config.props, variables);

      return React.createElement(Component, {
        key: config.id,
        id: config.id,
        ...resolvedProps,
      });
    }

    // For lazy mode, use async wrapper
    const LazyComponent: React.FC = () => {
      const [Component, setComponent] = React.useState<ComponentType | null>(
        this.getSync(config.type)
      );
      const [error, setError] = React.useState<string | null>(null);
      const [isLoading, setIsLoading] = React.useState(!Component);

      React.useEffect(() => {
        if (!Component) {
          this.get(config.type)
            .then((loadedComponent) => {
              if (loadedComponent) {
                setComponent(loadedComponent);
                setError(null);
              } else {
                setError(`Unknown component type: ${config.type}`);
              }
              setIsLoading(false);
            })
            .catch((err) => {
              setError(err.message || `Failed to load component: ${config.type}`);
              setIsLoading(false);
            });
        }
      }, [Component]);

      if (isLoading) {
        return <ComponentLoadingFallback componentType={config.type} />;
      }

      if (error || !Component) {
        return <ComponentErrorFallback componentType={config.type} error={error || undefined} />;
      }

      // Resolve variables in props
      const resolvedProps = this.resolveVariables(config.props, variables);

      return React.createElement(Component, {
        id: config.id,
        ...resolvedProps,
      });
    };

    return React.createElement(
      Suspense,
      {
        key: config.id,
        fallback: <ComponentLoadingFallback componentType={config.type} />,
      },
      React.createElement(LazyComponent)
    );
  }

  /**
   * Preload components to avoid loading delays
   */
  async preloadComponents(componentTypes: string[]): Promise<void> {
    const loadPromises = componentTypes.map((type) => this.get(type).catch((error) => {
      console.warn(`Failed to preload component: ${type}`, error);
    }));
    
    await Promise.allSettled(loadPromises);
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
  async validateComponents(components: ComponentConfig[]): Promise<{ 
    valid: boolean; 
    missing: string[]; 
    errors: Array<{ type: string; error: string }> 
  }> {
    const missing: string[] = [];
    const errors: Array<{ type: string; error: string }> = [];
    
    const validationPromises = components.map(async (config) => {
      try {
        const component = await this.get(config.type);
        if (!component) {
          missing.push(config.type);
        }
      } catch (error) {
        errors.push({
          type: config.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    await Promise.allSettled(validationPromises);

    return {
      valid: missing.length === 0 && errors.length === 0,
      missing,
      errors
    };
  }

  /**
   * Get all registered component types
   */
  getRegisteredTypes(): string[] {
    return Object.keys(this.registry);
  }
}

// Global instance - start with direct loading for reliability
export const componentResolver = new ComponentResolver();
