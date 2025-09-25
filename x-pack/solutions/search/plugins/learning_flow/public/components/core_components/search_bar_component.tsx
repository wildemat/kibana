/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { 
  EuiFieldSearch, 
  EuiFormRow, 
  EuiTextArea, 
  EuiFlexGroup, 
  EuiFlexItem, 
  EuiButton, 
  EuiSpacer, 
  EuiText 
} from '@elastic/eui';

export interface SearchBarComponentProps {
  id?: string;
  placeholder?: string;
  query?: string;
  onSearch?: (query: string) => void;
  onExecute?: (query: string) => void;
  fullWidth?: boolean;
  multiline?: boolean;
  showExecuteButton?: boolean;
  label?: string;
  helpText?: string;
}

export const SearchBarComponent = ({
  placeholder = 'Enter your ES|QL query...',
  query: initialQuery = '',
  onSearch,
  onExecute,
  fullWidth = true,
  multiline = false,
  showExecuteButton = true,
  label = 'ES|QL Query',
  helpText,
  ...props
}: SearchBarComponentProps) => {
  const [query, setQuery] = useState(initialQuery);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    onSearch?.(newQuery);
  };

  const handleExecute = () => {
    if (query.trim()) {
      onExecute?.(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <EuiFormRow 
      label={label} 
      helpText={helpText || (multiline ? 'Press Cmd/Ctrl + Enter to execute' : undefined)}
      {...props}
    >
      <>
        {multiline ? (
          <EuiTextArea
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyPress}
            fullWidth={fullWidth}
            rows={4}
            resize="vertical"
          />
        ) : (
          <EuiFieldSearch
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyPress}
            fullWidth={fullWidth}
            onSearch={handleExecute}
          />
        )}
        
        {showExecuteButton && (
          <>
            <EuiSpacer size="s" />
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem>
                <EuiText size="s" color="subdued">
                  {query.length > 0 ? `${query.length} characters` : 'Start typing your ES|QL query'}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  fill
                  onClick={handleExecute}
                  disabled={!query.trim()}
                  iconType="play"
                >
                  Execute Query
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </>
    </EuiFormRow>
  );
};
