/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { EuiBasicTable, EuiText, EuiEmptyPrompt } from '@elastic/eui';

export interface DataTableComponentProps {
  id?: string;
  data?: any[];
  columns?: Array<{
    field: string;
    name: string;
    sortable?: boolean;
    truncateText?: boolean;
    render?: (value: any, item: any) => React.ReactNode;
  }>;
  loading?: boolean;
  pagination?: boolean;
  sorting?: boolean;
  noItemsMessage?: string;
}

export const DataTableComponent = ({
  data = [],
  columns = [],
  loading = false,
  pagination = true,
  sorting = true,
  noItemsMessage = 'No data to display. Execute a search to see results.',
  ...props
}: DataTableComponentProps) => {
  // State for sorting
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State for pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Generate default columns if none provided but data exists
  const effectiveColumns = columns.length > 0 ? columns : 
    (data.length > 0 ? Object.keys(data[0]).map(key => ({
      field: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      sortable: true,
      truncateText: true,
    })) : []);

  if (data.length === 0 && !loading) {
    return (
      <EuiEmptyPrompt
        {...props}
        iconType="visTable"
        title={<h3>No data available</h3>}
        titleSize="s"
        body={<p>{noItemsMessage}</p>}
      />
    );
  }

  // Handle sorting
  const onTableChange = ({ sort, page }: any) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
    if (page) {
      setPageIndex(page.index);
      setPageSize(page.size);
    }
  };

  // Sort data if sorting is enabled
  let sortedData = [...data];
  if (sorting && sortField) {
    sortedData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Paginate data if pagination is enabled
  let paginatedData = sortedData;
  let paginationConfig;
  
  if (pagination && sortedData.length > 10) {
    const startIndex = pageIndex * pageSize;
    paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
    
    paginationConfig = {
      pageIndex,
      pageSize,
      totalItemCount: sortedData.length,
      pageSizeOptions: [5, 10, 25, 50],
      showPerPageOptions: true,
    };
  }

  const tableProps: any = {
    items: paginatedData,
    columns: effectiveColumns,
    loading,
    onChange: onTableChange,
    ...props,
  };

  if (paginationConfig) {
    tableProps.pagination = paginationConfig;
  }

  if (sorting && effectiveColumns.some(col => col.sortable)) {
    tableProps.sorting = {
      sort: sortField ? {
        field: sortField,
        direction: sortDirection,
      } : undefined,
    };
  }

  return <EuiBasicTable {...tableProps} />;
};
