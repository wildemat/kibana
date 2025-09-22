/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFieldSearch, EuiFormRow } from '@elastic/eui';

export interface SearchBarComponentProps {
  id?: string;
  placeholder?: string;
  query?: string;
  onSearch?: (query: string) => void;
  fullWidth?: boolean;
}

export const SearchBarComponent: React.FC<SearchBarComponentProps> = ({ 
  placeholder = "Enter your ES|QL query...",
  query = "",
  onSearch,
  fullWidth = true,
  ...props 
}) => {
  return (
    <EuiFormRow label="Search Query" {...props}>
      <EuiFieldSearch
        placeholder={placeholder}
        value={query}
        onChange={(e) => onSearch?.(e.target.value)}
        fullWidth={fullWidth}
      />
    </EuiFormRow>
  );
};
