/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import {
  EuiTourStep,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { useKibana } from '../../hooks/use_kibana';
import { GETTING_STARTED_SIDENAV_TOUR_KEY, GETTING_STARTED_SIDENAV_TOUR_TARGET } from './constants';

/**
 * Error boundary to prevent the tour from crashing the whole app if something goes wrong.
 */
class TourErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * A simple tour component that highlights the "Getting Started" link in the side navigation.
 * The tour is on by default and can be skipped or dismissed by the user.
 * The dismissed state is persisted in localStorage.
 *
 * When the spaces plugin's solution view tour is enabled (in hosted/stack with solution spaces),
 * this standalone tour is not shown because the getting started step is registered as part of
 * the solution view tour instead.
 */
export const GettingStartedSidenavTour: React.FC = () => {
  const { services } = useKibana();
  const [isDismissed, setIsDismissed] = useLocalStorage(GETTING_STARTED_SIDENAV_TOUR_KEY, false);
  const [isOpen, setIsOpen] = useState(false);
  const [isTargetVisible, setIsTargetVisible] = useState(false);

  // Check if the solution view tour is enabled (spaces plugin is available and solution view is enabled)
  // If so, the getting started step is shown as part of that tour instead
  const isSolutionViewTourEnabled = services.spaces?.isSolutionViewEnabled ?? false;

  // Check if the target element is visible in the DOM
  useEffect(() => {
    // Don't show standalone tour if solution view tour is enabled
    // (the step is registered there instead)
    if (isDismissed || isSolutionViewTourEnabled) {
      return;
    }

    const checkTargetVisibility = () => {
      const targetElement = document.querySelector(GETTING_STARTED_SIDENAV_TOUR_TARGET);
      if (targetElement) {
        setIsTargetVisible(true);
        setIsOpen(true);
      }
    };

    // Initial check with a small delay to allow DOM to settle
    const initialTimeout = setTimeout(checkTargetVisibility, 500);

    // Poll for the target element in case it appears later
    const pollInterval = setInterval(checkTargetVisibility, 1000);

    // Stop polling after 10 seconds
    const maxWaitTimeout = setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(pollInterval);
      clearTimeout(maxWaitTimeout);
    };
  }, [isDismissed, isSolutionViewTourEnabled]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setIsOpen(false);
  }, [setIsDismissed]);

  const handleFinish = useCallback(() => {
    setIsDismissed(true);
    setIsOpen(false);
  }, [setIsDismissed]);

  // Don't render anything if:
  // - The tour is already dismissed
  // - The target is not visible
  // - The solution view tour is enabled (step is shown there instead)
  if (isDismissed || !isTargetVisible || isSolutionViewTourEnabled) {
    return null;
  }

  return (
    <TourErrorBoundary>
      <EuiTourStep
        isStepOpen={isOpen}
        onFinish={handleFinish}
        step={1}
        stepsTotal={1}
        title={i18n.translate('xpack.search.gettingStarted.tour.title', {
          defaultMessage: 'Learning content now available!',
        })}
        content={
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="xpack.search.gettingStarted.tour.content"
                defaultMessage="The Getting Started page provides a single location for learning content to help you start building with Elasticsearch."
              />
            </p>
          </EuiText>
        }
        anchor={GETTING_STARTED_SIDENAV_TOUR_TARGET}
        anchorPosition="rightCenter"
        minWidth={300}
        maxWidth={360}
        repositionOnScroll
        footerAction={
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                color="text"
                onClick={handleDismiss}
                data-test-subj="gettingStartedTourSkipButton"
              >
                <FormattedMessage
                  id="xpack.search.gettingStarted.tour.skipButton"
                  defaultMessage="Skip"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                color="success"
                onClick={handleFinish}
                data-test-subj="gettingStartedTourFinishButton"
              >
                <FormattedMessage
                  id="xpack.search.gettingStarted.tour.gotItButton"
                  defaultMessage="Got it"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        panelProps={{
          'data-test-subj': 'gettingStartedSidenavTour',
        }}
      />
    </TourErrorBoundary>
  );
};
