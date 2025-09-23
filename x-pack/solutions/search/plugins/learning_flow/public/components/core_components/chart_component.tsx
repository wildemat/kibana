/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiText } from '@elastic/eui';

export interface ChartComponentProps {
  id?: string;
  type?: 'bar' | 'line' | 'pie';
  data?: any[];
  title?: string;
}

export const ChartComponent = ({
  type = 'bar',
  data = [],
  title,
  ...props
}: ChartComponentProps) => {
  // Placeholder implementation - will be fully implemented on Day 2
  return (
    <div {...props} style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>
      <EuiText>
        <h4>{title || `${type.toUpperCase()} Chart`}</h4>
        <p>
          Chart placeholder - will display {type} chart with {data.length} data points
        </p>
      </EuiText>
    </div>
  );
};
