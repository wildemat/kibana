/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import { EuiCallOut, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { componentResolver } from './component_registry';
import type { JourneyConfig } from '../../common/types';

interface JourneyPreloaderProps {
  journey: JourneyConfig;
  onPreloadComplete?: () => void;
  onPreloadError?: (errors: string[]) => void;
}

/**
 * Component that preloads all components used in a journey
 * Demonstrates the enhanced component registry features
 */
export const JourneyPreloader: React.FC<JourneyPreloaderProps> = ({
  journey,
  onPreloadComplete,
  onPreloadError,
}) => {
  const [isPreloading, setIsPreloading] = React.useState(false);
  const [preloadErrors, setPreloadErrors] = React.useState<string[]>([]);

  useEffect(() => {
    const preloadComponents = async () => {
      setIsPreloading(true);
      setPreloadErrors([]);

      // Extract all unique component types from journey steps
      const componentTypes = new Set<string>();
      journey.steps.forEach(step => {
        step.components.forEach(component => {
          componentTypes.add(component.type);
        });
      });

      try {
        // Preload all components
        await componentResolver.preloadComponents(Array.from(componentTypes));
        
        // Validate that all components loaded successfully
        const validation = await componentResolver.validateComponents(
          journey.steps.flatMap(step => step.components)
        );

        if (!validation.valid) {
          const errorMessages = [
            ...validation.missing.map(type => 
              i18n.translate('xpack.learningFlow.preloader.missingComponent', {
                defaultMessage: 'Missing component: {type}',
                values: { type }
              })
            ),
            ...validation.errors.map(error => 
              i18n.translate('xpack.learningFlow.preloader.componentError', {
                defaultMessage: 'Error with {type}: {error}',
                values: { type: error.type, error: error.error }
              })
            )
          ];
          
          setPreloadErrors(errorMessages);
          onPreloadError?.(errorMessages);
        } else {
          onPreloadComplete?.();
        }
      } catch (error) {
        const errorMessage = i18n.translate('xpack.learningFlow.preloader.generalError', {
          defaultMessage: 'Failed to preload components: {error}',
          values: { error: error instanceof Error ? error.message : String(error) }
        });
        setPreloadErrors([errorMessage]);
        onPreloadError?.([errorMessage]);
      } finally {
        setIsPreloading(false);
      }
    };

    preloadComponents();
  }, [journey, onPreloadComplete, onPreloadError]);

  if (preloadErrors.length > 0) {
    return (
      <>
        <EuiCallOut
          title={i18n.translate('xpack.learningFlow.preloader.errorTitle', {
            defaultMessage: 'Component Loading Errors'
          })}
          color="warning"
          iconType="warning"
        >
          <ul>
            {preloadErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </EuiCallOut>
        <EuiSpacer size="m" />
      </>
    );
  }

  if (isPreloading) {
    return (
      <>
        <EuiCallOut
          title={i18n.translate('xpack.learningFlow.preloader.loadingTitle', {
            defaultMessage: 'Loading Journey Components...'
          })}
          color="primary"
          iconType="loading"
        >
          {i18n.translate('xpack.learningFlow.preloader.loadingDescription', {
            defaultMessage: 'Preparing components for optimal performance.'
          })}
        </EuiCallOut>
        <EuiSpacer size="m" />
      </>
    );
  }

  // Preloading complete, render nothing
  return null;
};

// Usage example hook for journey pages
export const useComponentPreloading = (journey: JourneyConfig | null) => {
  const [isReady, setIsReady] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const handlePreloadComplete = React.useCallback(() => {
    setIsReady(true);
    setErrors([]);
  }, []);

  const handlePreloadError = React.useCallback((preloadErrors: string[]) => {
    setErrors(preloadErrors);
    setIsReady(false);
  }, []);

  return {
    isReady: !journey || isReady,
    errors,
    PreloaderComponent: journey ? (
      <JourneyPreloader
        journey={journey}
        onPreloadComplete={handlePreloadComplete}
        onPreloadError={handlePreloadError}
      />
    ) : null,
  };
};
