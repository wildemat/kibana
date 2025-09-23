/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageSection,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

export interface SingleColumnLayoutProps {
  header?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  showProgress?: boolean;
}

export const SingleColumnLayout = ({
  header,
  content,
  footer,
  showProgress = true,
}: SingleColumnLayoutProps) => {
  return (
    <EuiPage paddingSize="l">
      <EuiPageBody>
        {header && (
          <>
            <EuiPageHeader>{header}</EuiPageHeader>
            <EuiSpacer size="l" />
          </>
        )}

        <EuiPageSection>
          <EuiFlexGroup direction="column">
            <EuiFlexItem>{content}</EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageSection>

        {footer && (
          <>
            <EuiSpacer size="l" />
            <EuiPageSection>{footer}</EuiPageSection>
          </>
        )}
      </EuiPageBody>
    </EuiPage>
  );
};
