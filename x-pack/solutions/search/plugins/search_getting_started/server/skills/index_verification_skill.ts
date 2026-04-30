/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ToolType } from '@kbn/agent-builder-common/tools';
import { ToolResultType } from '@kbn/agent-builder-common/tools/tool_result';
import { defineSkillType } from '@kbn/agent-builder-server/skills/type_definition';
import { z } from '@kbn/zod/v4';
import {
  SEARCH_INDEX_VERIFIED_EVENT,
  type SearchIndexVerifiedPayload,
} from '../../common/agent_builder_events';

export const indexVerificationSkill = defineSkillType({
  id: 'index-verification',
  name: 'index-verification',
  basePath: 'skills/search',
  description:
    'Verify that an Elasticsearch index has been created and contains documents. ' +
    'Use after guiding a user through index creation to confirm the index exists ' +
    'and signal completion to the Getting Started page UI.',
  content: `# Index Verification

## When to Use

Use the \`search.verify-index\` tool after the user has created an Elasticsearch index
during the getting-started onboarding flow. This confirms the index exists and notifies
the Getting Started page so it can display a completion checkmark.

## Instructions

1. After the user confirms they have created an index (or you have helped them create one),
   call the \`search.verify-index\` tool with the index name.
2. The tool will check whether the index exists and report back the document count.
3. If the index exists, a UI event is automatically emitted so the Getting Started page
   can show a success indicator.
4. If the index does not exist, let the user know and offer to help troubleshoot.
`,
  getInlineTools: () => [
    {
      id: 'search.verify-index',
      type: ToolType.builtin,
      description:
        'Check whether an Elasticsearch index exists and emit a UI event to the ' +
        'Getting Started page. Returns the index existence status and document count.',
      schema: z.object({
        indexName: z.string().describe('The name of the Elasticsearch index to verify'),
      }),
      handler: async ({ indexName }, context) => {
        const esClient = context.esClient.asCurrentUser;

        const exists = await esClient.indices.exists({ index: indexName });

        let docCount = 0;
        if (exists) {
          const countResponse = await esClient.count({ index: indexName });
          docCount = countResponse.count;
        }

        const payload: SearchIndexVerifiedPayload = {
          indexName,
          exists,
          docCount,
        };

        context.events.sendUiEvent(SEARCH_INDEX_VERIFIED_EVENT, payload);

        return {
          results: [
            {
              type: ToolResultType.text,
              value: exists
                ? `Index "${indexName}" exists with ${docCount} document(s).`
                : `Index "${indexName}" does not exist.`,
            },
          ],
        };
      },
    },
  ],
});
