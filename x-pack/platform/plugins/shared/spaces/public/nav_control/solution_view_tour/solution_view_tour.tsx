/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPortal,
  EuiText,
  EuiTourStep,
} from '@elastic/eui';
import React from 'react';
import type { FC, PropsWithChildren } from 'react';

import type { SolutionId } from '@kbn/core-chrome-browser';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { hasActiveModifierKey } from '@kbn/shared-ux-utility';

import type { AdditionalTourStep } from './lib';
import type { SolutionView } from '../../../common';
import { SOLUTION_VIEW_CLASSIC } from '../../../common/constants';

const solutionMap: Record<SolutionId, string> = {
  es: i18n.translate('xpack.spaces.navControl.tour.esSolution', {
    defaultMessage: 'Elasticsearch',
  }),
  security: i18n.translate('xpack.spaces.navControl.tour.securitySolution', {
    defaultMessage: 'Elastic Security',
  }),
  oblt: i18n.translate('xpack.spaces.navControl.tour.obltSolution', {
    defaultMessage: 'Elastic Observability',
  }),
  workplaceai: i18n.translate('xpack.spaces.navControl.tour.workplaceAiSolution', {
    defaultMessage: 'Elastic Workplace AI',
  }),
};

interface Props extends PropsWithChildren<{}> {
  solution?: SolutionView;
  isTourOpen: boolean;
  onFinishTour: () => void;
  manageSpacesDocsLink: string;
  manageSpacesLink: string;
  navigateToUrl: (url: string) => void;
  /** Current step number (1-indexed) */
  currentStep?: number;
  /** Total number of steps including additional steps */
  stepsTotal?: number;
  /** Callback to move to the next step */
  onNextStep?: () => void;
  /** Additional steps to show after the solution view step */
  additionalSteps?: AdditionalTourStep[];
}

export const SolutionViewTour: FC<Props> = ({
  children,
  solution,
  isTourOpen,
  onFinishTour,
  manageSpacesLink,
  manageSpacesDocsLink,
  navigateToUrl,
  currentStep = 1,
  stepsTotal = 1,
  onNextStep,
  additionalSteps = [],
}) => {
  const solutionLabel = solution && solution !== SOLUTION_VIEW_CLASSIC ? solutionMap[solution] : '';
  if (!solutionLabel) {
    return children;
  }

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === stepsTotal;
  const hasMultipleSteps = stepsTotal > 1;

  // Render additional steps (step 2+)
  const renderAdditionalStep = () => {
    if (currentStep <= 1 || !isTourOpen) return null;

    const stepIndex = currentStep - 2; // Convert to 0-indexed for additionalSteps array
    const step = additionalSteps[stepIndex];
    if (!step) return null;

    return (
      <EuiPortal>
        <EuiTourStep
          content={<EuiText size="s">{step.content}</EuiText>}
          isStepOpen={true}
          minWidth={300}
          maxWidth={360}
          onFinish={onFinishTour}
          step={currentStep}
          stepsTotal={stepsTotal}
          repositionOnScroll
          title={step.title}
          anchor={step.anchor}
          anchorPosition={step.anchorPosition || 'rightCenter'}
          footerAction={
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="s"
                  color="text"
                  onClick={onFinishTour}
                  data-test-subj="solutionTourSkipButton"
                >
                  {i18n.translate('xpack.spaces.navControl.tour.skipBtn', {
                    defaultMessage: 'Skip',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  color="success"
                  onClick={isLastStep ? onFinishTour : onNextStep}
                  data-test-subj="solutionTourNextButton"
                >
                  {isLastStep
                    ? i18n.translate('xpack.spaces.navControl.tour.finishBtn', {
                        defaultMessage: 'Got it',
                      })
                    : i18n.translate('xpack.spaces.navControl.tour.nextBtn', {
                        defaultMessage: 'Next',
                      })}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          }
          panelProps={{
            'data-test-subj': `solutionTourStep-${step.id}`,
          }}
        />
      </EuiPortal>
    );
  };

  return (
    <>
      <EuiTourStep
        content={
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="xpack.spaces.navControl.tour.content"
                defaultMessage="Only {solution} features are visible.{br}To access feature from other solutions, edit your {spacesLink} or create new spaces.{br}{learnMore}"
                values={{
                  solution: solutionLabel,
                  spacesLink: (
                    <EuiLink
                      href={manageSpacesLink}
                      onClick={(e) => {
                        if (!hasActiveModifierKey(e)) {
                          e.preventDefault();
                          onFinishTour();
                          navigateToUrl(manageSpacesLink);
                        }
                      }}
                    >
                      {i18n.translate('xpack.spaces.navControl.tour.spaceSettingsLink', {
                        defaultMessage: 'space settings',
                      })}
                    </EuiLink>
                  ),
                  learnMore: (
                    <EuiLink href={manageSpacesDocsLink} target="_blank" external>
                      {i18n.translate('xpack.spaces.navControl.tour.learnMore', {
                        defaultMessage: 'Learn more',
                      })}
                    </EuiLink>
                  ),
                  br: <br />,
                }}
              />
            </p>
          </EuiText>
        }
        isStepOpen={isTourOpen && isFirstStep}
        minWidth={300}
        maxWidth={360}
        onFinish={onFinishTour}
        step={1}
        stepsTotal={stepsTotal}
        repositionOnScroll
        title={i18n.translate('xpack.spaces.navControl.tour.title', {
          defaultMessage: 'This space uses the {solution} solution view',
          values: { solution: solutionLabel },
        })}
        anchorPosition="downCenter"
        footerAction={
          hasMultipleSteps ? (
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  size="s"
                  color="text"
                  onClick={onFinishTour}
                  data-test-subj="solutionTourSkipButton"
                >
                  {i18n.translate('xpack.spaces.navControl.tour.skipBtn', {
                    defaultMessage: 'Skip',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  color="success"
                  onClick={onNextStep}
                  data-test-subj="solutionTourNextButton"
                >
                  {i18n.translate('xpack.spaces.navControl.tour.nextBtn', {
                    defaultMessage: 'Next',
                  })}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiButtonEmpty
              size="s"
              color="text"
              onClick={onFinishTour}
              data-test-subj="closeTourBtn"
            >
              {i18n.translate('xpack.spaces.navControl.tour.closeBtn', {
                defaultMessage: 'Close',
              })}
            </EuiButtonEmpty>
          )
        }
        panelProps={{
          'data-test-subj': 'spaceSolutionTour',
        }}
      >
        <>{children}</>
      </EuiTourStep>
      {renderAdditionalStep()}
    </>
  );
};
