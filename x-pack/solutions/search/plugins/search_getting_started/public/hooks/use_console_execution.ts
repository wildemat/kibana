/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback } from 'react';
import { useKibana } from './use_kibana';

interface ParsedRequest {
  method: string;
  path: string;
  body?: string;
}

interface ConsoleResponse {
  statusCode: number;
  statusText: string;
  data: unknown;
}

/**
 * Parses console syntax into method, path, and body.
 * Example input: "GET /my-index/_search\n{ \"query\": { \"match_all\": {} } }"
 */
function parseConsoleRequest(code: string): ParsedRequest {
  const lines = code.trim().split('\n');
  const firstLine = lines[0].trim();
  const spaceIndex = firstLine.indexOf(' ');

  if (spaceIndex === -1) {
    throw new Error('Invalid console syntax: missing method or path');
  }

  const method = firstLine.slice(0, spaceIndex).toUpperCase();
  const path = firstLine.slice(spaceIndex + 1).trim();

  if (!method || !path) {
    throw new Error('Invalid console syntax: missing method or path');
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid HTTP method: ${method}`);
  }

  const body = lines.slice(1).join('\n').trim() || undefined;

  return { method, path, body };
}

export const useConsoleExecution = () => {
  const { services } = useKibana();
  const http = services.http;

  const send = useCallback(
    async (consoleText: string): Promise<ConsoleResponse> => {
      const { method, path, body } = parseConsoleRequest(consoleText);

      const response = await http.post<unknown>('/api/console/proxy', {
        query: { method, path },
        body,
        asResponse: true,
      });

      const statusCode = parseInt(
        response.response?.headers.get('x-console-proxy-status-code') || '200',
        10
      );
      const statusText = response.response?.headers.get('x-console-proxy-status-text') || 'OK';

      return {
        statusCode,
        statusText,
        data: response.body,
      };
    },
    [http]
  );

  return { send };
};
