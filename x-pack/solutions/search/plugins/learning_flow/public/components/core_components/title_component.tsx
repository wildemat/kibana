/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiTitle } from '@elastic/eui';

export interface TitleComponentProps {
  id?: string;
  text: string;
  size?: 'xxxs' | 'xxs' | 'xs' | 's' | 'm' | 'l';
  color?: 'default' | 'subdued' | 'success' | 'accent' | 'danger' | 'warning';
}

export const TitleComponent = ({ text, size = 'm', ...props }: TitleComponentProps) => {
  return (
    <EuiTitle size={size} {...props}>
      <h2>{text}</h2>
    </EuiTitle>
  );
};
