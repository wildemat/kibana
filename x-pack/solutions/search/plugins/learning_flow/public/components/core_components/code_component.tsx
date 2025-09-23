/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiCodeBlock } from '@elastic/eui';

export interface CodeComponentProps {
  id?: string;
  code: string;
  language?: string;
  copyable?: boolean;
  transparentBackground?: boolean;
}

export const CodeComponent = ({
  code,
  language = 'sql',
  copyable = true,
  transparentBackground = false,
  ...props
}: CodeComponentProps) => {
  return (
    <EuiCodeBlock
      language={language}
      isCopyable={copyable}
      transparentBackground={transparentBackground}
      {...props}
    >
      {code}
    </EuiCodeBlock>
  );
};
