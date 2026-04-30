/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useState } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel, EuiText } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { isToolUiEvent } from '@kbn/agent-builder-common/chat/events';
import {
  SEARCH_INDEX_VERIFIED_EVENT,
  type SearchIndexVerifiedPayload,
} from '../../common/agent_builder_events';
import { useKibana } from '../hooks/use_kibana';

export const IndexVerificationStatus: React.FC = () => {
  const { services } = useKibana();
  const [verifiedIndex, setVerifiedIndex] = useState<SearchIndexVerifiedPayload | null>(null);

  useEffect(() => {
    const chat$ = services.agentBuilder?.events.chat$;
    if (!chat$) {
      return;
    }

    const subscription = chat$.subscribe((event) => {
      if (isToolUiEvent(event, SEARCH_INDEX_VERIFIED_EVENT)) {
        const payload = event.data.data as SearchIndexVerifiedPayload;
        if (payload.exists) {
          setVerifiedIndex(payload);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [services.agentBuilder]);

  if (!verifiedIndex) {
    return null;
  }

  return (
    <EuiPanel
      color="success"
      paddingSize="m"
      css={css`
        animation: fadeIn 0.3s ease-in;
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    >
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="checkInCircleFilled" color="success" size="l" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>
              {i18n.translate('xpack.search.gettingStarted.indexVerified.title', {
                defaultMessage: 'Index "{indexName}" created',
                values: { indexName: verifiedIndex.indexName },
              })}
            </strong>
          </EuiText>
          {verifiedIndex.docCount != null && verifiedIndex.docCount > 0 && (
            <EuiText size="xs" color="subdued">
              {i18n.translate('xpack.search.gettingStarted.indexVerified.docCount', {
                defaultMessage:
                  '{docCount, plural, one {# document} other {# documents}} indexed',
                values: { docCount: verifiedIndex.docCount },
              })}
            </EuiText>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
