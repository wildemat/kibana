/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiBasicTable, EuiText } from '@elastic/eui';

export interface DataTableComponentProps {
  id?: string;
  data?: any[];
  columns?: any[];
  loading?: boolean;
}

export const DataTableComponent: React.FC<DataTableComponentProps> = ({ 
  data = [],
  columns = [],
  loading = false,
  ...props 
}) => {
  // Placeholder implementation - will be fully implemented on Day 2
  if (data.length === 0) {
    return (
      <div {...props}>
        <EuiText color="subdued">
          <p>No data to display. Execute a search to see results.</p>
        </EuiText>
      </div>
    );
  }

  return (
    <EuiBasicTable
      items={data}
      columns={columns}
      loading={loading}
      {...props}
    />
  );
};
