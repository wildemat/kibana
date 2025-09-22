/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { LayoutTemplate, ComponentConfig } from '../../common/types';
import { SingleColumnLayout } from './single_column_layout';
import { TwoColumnLayout } from './two_column_layout';
import { componentResolver } from '../component_registry';

export interface LayoutRendererProps {
  layout: LayoutTemplate;
  components: ComponentConfig[];
  variables?: Record<string, any>;
  navigationContent?: React.ReactNode;
}

export const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  layout,
  components,
  variables = {},
  navigationContent,
}) => {
  const renderComponentsInSlot = (slotName: string) => {
    return components
      .filter(component => component.slot === slotName)
      .map(component => componentResolver.resolve(component, variables))
      .filter(Boolean);
  };

  const renderLayout = () => {
    switch (layout.type) {
      case 'single-column':
        return (
          <SingleColumnLayout
            header={renderComponentsInSlot('header')}
            content={
              <>
                {renderComponentsInSlot('content')}
                {renderComponentsInSlot('main')}
              </>
            }
            footer={
              <>
                {renderComponentsInSlot('footer')}
                {navigationContent}
              </>
            }
          />
        );

      case 'two-column':
        return (
          <TwoColumnLayout
            header={renderComponentsInSlot('header')}
            sidebar={renderComponentsInSlot('sidebar')}
            content={
              <>
                {renderComponentsInSlot('content')}
                {renderComponentsInSlot('main')}
              </>
            }
            footer={
              <>
                {renderComponentsInSlot('footer')}
                {navigationContent}
              </>
            }
          />
        );

      default:
        console.warn(`Unknown layout type: ${layout.type}`);
        return (
          <div style={{ padding: '20px', border: '1px dashed red' }}>
            <p>Unknown layout type: {layout.type}</p>
          </div>
        );
    }
  };

  return renderLayout();
};
