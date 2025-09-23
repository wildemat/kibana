/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiText, EuiMarkdownFormat } from '@elastic/eui';

export interface TextComponentProps {
  id?: string;
  text: string;
  markdown?: boolean;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl';
  color?: 'default' | 'subdued' | 'success' | 'accent' | 'danger' | 'warning';
}

export const TextComponent = ({
  text,
  markdown = false,
  size = 'm',
  color = 'default',
  ...props
}: TextComponentProps) => {
  if (markdown) {
    return (
      <div {...props}>
        <EuiMarkdownFormat>{text}</EuiMarkdownFormat>
      </div>
    );
  }

  return (
    <EuiText size={size} color={color} {...props}>
      <p>{text}</p>
    </EuiText>
  );
};
