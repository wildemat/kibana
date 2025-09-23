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

export interface TwoColumnLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: number;
}

export const TwoColumnLayout = ({
  header,
  sidebar,
  content,
  footer,
  sidebarWidth = 300,
}: TwoColumnLayoutProps) => {
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
          <EuiFlexGroup gutterSize="l">
            {sidebar && (
              <EuiFlexItem grow={false} style={{ minWidth: sidebarWidth }}>
                {sidebar}
              </EuiFlexItem>
            )}

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
