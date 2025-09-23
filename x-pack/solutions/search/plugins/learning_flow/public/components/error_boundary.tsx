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
  fallbackComponent?: React.ComponentType<{ error: Error; componentType: string; componentId: string }>;
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
    
    console.error('Learning Flow Component Error:', {
      componentType,
      componentId,
      error,
      errorInfo,
    });

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
                      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                        {error.stack}
                      </pre>
                    </>
                  )}
                </details>
              </>
            )}
            
            <EuiSpacer size="m" />
            <EuiButton
              color="danger"
              fill
              size="s"
              onClick={this.handleRetry}
              iconType="refresh"
            >
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
      <ComponentErrorBoundary
        componentType={componentType}
        componentId={id || 'unknown'}
      >
        <WrappedComponent ref={ref} {...(restProps as P)} />
      </ComponentErrorBoundary>
    );
  });

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${componentType})`;
  
  return WithErrorBoundaryComponent;
};

/**
 * Journey-level error boundary for catching errors in the entire journey flow
 */
interface JourneyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  journeyId?: string;
  stepId?: string;
}

interface JourneyErrorBoundaryProps {
  journeyId: string;
  stepId?: string;
  children: React.ReactNode;
  onError?: (error: Error, context: { journeyId: string; stepId?: string }) => void;
  onReset?: () => void;
}

export class JourneyErrorBoundary extends React.Component<
  JourneyErrorBoundaryProps,
  JourneyErrorBoundaryState
> {
  constructor(props: JourneyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<JourneyErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { journeyId, stepId, onError } = this.props;
    
    console.error('Learning Flow Journey Error:', {
      journeyId,
      stepId,
      error,
      errorInfo,
    });

    this.setState({
      error,
      journeyId,
      stepId,
    });

    if (onError) {
      onError(error, { journeyId, stepId });
    }
  }

  componentDidUpdate(prevProps: JourneyErrorBoundaryProps) {
    // Reset error state when journey or step changes
    if (
      this.state.hasError &&
      (prevProps.journeyId !== this.props.journeyId || prevProps.stepId !== this.props.stepId)
    ) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, journeyId, stepId } = this.state;

      return (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <EuiCallOut
            title={i18n.translate('xpack.learningFlow.journeyError.title', {
              defaultMessage: 'Journey Error',
            })}
            color="danger"
            iconType="error"
            size="l"
          >
            <p>
              {i18n.translate('xpack.learningFlow.journeyError.description', {
                defaultMessage: 'There was an error in the learning journey. You can try to continue or restart the journey.',
              })}
            </p>
            
            {error && (
              <>
                <EuiSpacer size="m" />
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    {i18n.translate('xpack.learningFlow.journeyError.details', {
                      defaultMessage: 'Technical Details',
                    })}
                  </summary>
                  <EuiSpacer size="s" />
                  <div style={{ textAlign: 'left' }}>
                    <p><strong>Journey ID:</strong> {journeyId}</p>
                    {stepId && <p><strong>Step ID:</strong> {stepId}</p>}
                    <p><strong>Error:</strong> {error.message}</p>
                  </div>
                </details>
              </>
            )}
            
            <EuiSpacer size="l" />
            <div>
              <EuiButton
                color="danger"
                fill
                onClick={this.handleReset}
                iconType="refresh"
                style={{ marginRight: '8px' }}
              >
                {i18n.translate('xpack.learningFlow.journeyError.retry', {
                  defaultMessage: 'Try Again',
                })}
              </EuiButton>
              
              <EuiButton
                color="primary"
                onClick={() => window.location.reload()}
                iconType="sortLeft"
              >
                {i18n.translate('xpack.learningFlow.journeyError.restart', {
                  defaultMessage: 'Restart Journey',
                })}
              </EuiButton>
            </div>
          </EuiCallOut>
        </div>
      );
    }

    return this.props.children;
  }
}
