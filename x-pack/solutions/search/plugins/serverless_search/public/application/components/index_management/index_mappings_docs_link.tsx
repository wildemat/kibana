/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import type { CoreStart } from '@kbn/core/public';

export const createIndexMappingsContentExtra = (core: CoreStart) => {
  return {
    renderText: () => (
      <FormattedMessage
        id="xpack.serverlessSearch.indexMappings.ingestPipelinesDocs.description"
        defaultMessage="Want to add custom fields, or use trained ML models to analyze and enrich your
          indexed documents? Use index-specific ingest pipelines to customize documents to your needs."
      />
    ),
    renderLink: () => (
      <EuiLink
        data-test-subj="serverlessSearchIndexMappingsDocsLinkLearnMoreAboutIngestPipelinesLink"
        href={core.docLinks.links.enterpriseSearch.ingestPipelines}
        target="_blank"
        external
      >
        <FormattedMessage
          id="xpack.serverlessSearch.indexMappings.ingestPipelinesDocs.linkLabel"
          defaultMessage="Learn more about ingest pipelines"
        />
      </EuiLink>
    ),
  };
};
