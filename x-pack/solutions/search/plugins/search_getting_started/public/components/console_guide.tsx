/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiPanel } from '@elastic/eui';
import React, { useState, useCallback } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { CodeEditor } from '@kbn/code-editor';
import {
  CONSOLE_LANG_ID,
  CONSOLE_OUTPUT_LANG_ID,
  CONSOLE_THEME_ID,
  CONSOLE_OUTPUT_THEME_ID,
  initializeSupportedLanguages,
} from '@kbn/monaco';
import { useConsoleExecution } from '../hooks/use_console_execution';

// Initialize all Monaco languages including Console
initializeSupportedLanguages();

interface ConsoleGuideProps {
  code: string;
}

export const ConsoleGuide: React.FC<ConsoleGuideProps> = ({ code }) => {
  const { send } = useConsoleExecution();
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runCode = useCallback(async () => {
    setIsLoading(true);
    setResult('');

    try {
      const response = await send(code);
      const formattedResult = JSON.stringify(response.data, null, 2);
      setResult(formattedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setResult(`// Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [code, send]);

  return (
    <EuiFlexGroup gutterSize="m" direction="column">
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <EuiPanel paddingSize="s" hasBorder>
              <CodeEditor
                languageId={CONSOLE_LANG_ID}
                value={code}
                height="200px"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  theme: CONSOLE_THEME_ID,
                }}
              />
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiPanel paddingSize="s" hasBorder>
              {isLoading ? (
                <EuiFlexGroup
                  justifyContent="center"
                  alignItems="center"
                  style={{ height: '200px' }}
                >
                  <EuiFlexItem grow={false}>
                    <EuiLoadingSpinner size="xl" />
                  </EuiFlexItem>
                </EuiFlexGroup>
              ) : (
                <CodeEditor
                  languageId={CONSOLE_OUTPUT_LANG_ID}
                  value={result}
                  height="200px"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    theme: CONSOLE_OUTPUT_THEME_ID,
                  }}
                />
              )}
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton
          data-test-subj="searchGettingStartedConsoleGuideRunButton"
          fill
          iconType="playFilled"
          isLoading={isLoading}
          onClick={runCode}
        >
          <FormattedMessage
            id="xpack.searchGettingStarted.consoleGuide.runButtonLabel"
            defaultMessage="Run"
          />
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
