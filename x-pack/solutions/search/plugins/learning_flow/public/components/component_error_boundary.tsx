/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiCallOut, EuiButton, EuiCode, EuiSpacer } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  componentType?: string;
  componentId?: string;
}

interface ComponentErrorBoundaryProps {
  componentType: string;
  componentId: string;
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallbackComponent?: React.ComponentType<{
    error: Error;
    componentType: string;
    componentId: string;
  }>;
}

/**
 * Error boundary for individual learning flow components
 * Provides graceful error handling and recovery options
 */
export class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentType, componentId, onError } = this.props;

    // Error information is passed to onError callback

    this.setState({
      error,
      errorInfo,
      componentType,
      componentId,
    });

    // Call external error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallbackComponent: FallbackComponent } = this.props;
      const { error, componentType, componentId } = this.state;

      // Use custom fallback component if provided
      if (FallbackComponent && error) {
        return (
          <FallbackComponent
            error={error}
            componentType={componentType || 'unknown'}
            componentId={componentId || 'unknown'}
          />
        );
      }

      // Default error display
      return (
        <div style={{ margin: '16px 0' }}>
          <EuiCallOut
            title={i18n.translate('xpack.learningFlow.componentError.title', {
              defaultMessage: 'Component Error',
            })}
            color="danger"
            iconType="error"
          >
            <p>
              {i18n.translate('xpack.learningFlow.componentError.description', {
                defaultMessage: 'There was an error rendering the {componentType} component.',
                values: { componentType: componentType || 'unknown' },
              })}
            </p>

            {error && (
              <>
                <EuiSpacer size="s" />
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    {i18n.translate('xpack.learningFlow.componentError.details', {
                      defaultMessage: 'Error Details',
                    })}
                  </summary>
                  <EuiSpacer size="xs" />
                  <EuiCode>{error.message}</EuiCode>
                  {error.stack && (
                    <>
                      <EuiSpacer size="xs" />
                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
                    </>
                  )}
                </details>
              </>
            )}

            <EuiSpacer size="m" />
            <EuiButton color="danger" fill size="s" onClick={this.handleRetry} iconType="refresh">
              {i18n.translate('xpack.learningFlow.componentError.retry', {
                defaultMessage: 'Retry Component',
              })}
            </EuiButton>
          </EuiCallOut>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentType: string
) => {
  const WithErrorBoundaryComponent = React.forwardRef<any, P & { id?: string }>((props, ref) => {
    const { id, ...restProps } = props;

    return (
      <ComponentErrorBoundary componentType={componentType} componentId={id || 'unknown'}>
        <WrappedComponent ref={ref} {...(restProps as P)} />
      </ComponentErrorBoundary>
    );
  });

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${componentType})`;

  return WithErrorBoundaryComponent;
};
