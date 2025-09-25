/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiText, EuiPanel, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';

export interface ChartComponentProps {
  id?: string;
  type?: 'bar' | 'line' | 'pie';
  data?: Array<{ x: string | number; y: number; label?: string }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export const ChartComponent = ({
  type = 'bar',
  data = [],
  title,
  height = 200,
  showLegend = false,
  ...props
}: ChartComponentProps) => {
  // Default sample data if none provided
  const sampleData = data.length > 0 ? data : [
    { x: 'Jan', y: 10, label: 'January' },
    { x: 'Feb', y: 25, label: 'February' },
    { x: 'Mar', y: 15, label: 'March' },
    { x: 'Apr', y: 35, label: 'April' },
    { x: 'May', y: 20, label: 'May' },
  ];

  const maxValue = Math.max(...sampleData.map(d => d.y));

  const renderSimpleBarChart = () => (
    <EuiFlexGroup gutterSize="s" alignItems="flexEnd" justifyContent="spaceAround">
      {sampleData.map((item, index) => {
        const barHeight = (item.y / maxValue) * (height - 60);
        return (
          <EuiFlexItem key={index} grow={false}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '30px',
                  height: `${barHeight}px`,
                  backgroundColor: '#0071C2',
                  borderRadius: '2px',
                  margin: '0 auto',
                  minHeight: '5px',
                }}
                title={`${item.label || item.x}: ${item.y}`}
              />
              <EuiText size="xs" style={{ marginTop: '4px' }}>
                {item.x}
              </EuiText>
              <EuiText size="xs" color="subdued">
                {item.y}
              </EuiText>
            </div>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );

  const renderSimpleLineChart = () => (
    <div style={{ position: 'relative', height: `${height}px`, padding: '20px' }}>
      <svg width="100%" height="100%" viewBox={`0 0 400 ${height}`}>
        <polyline
          fill="none"
          stroke="#0071C2"
          strokeWidth="2"
          points={sampleData
            .map((item, index) => {
              const x = (index / (sampleData.length - 1)) * 360 + 20;
              const y = height - 40 - ((item.y / maxValue) * (height - 80));
              return `${x},${y}`;
            })
            .join(' ')}
        />
        {sampleData.map((item, index) => {
          const x = (index / (sampleData.length - 1)) * 360 + 20;
          const y = height - 40 - ((item.y / maxValue) * (height - 80));
          return (
            <circle key={index} cx={x} cy={y} r="3" fill="#0071C2" />
          );
        })}
      </svg>
      <EuiFlexGroup justifyContent="spaceAround" style={{ marginTop: '10px' }}>
        {sampleData.map((item, index) => (
          <EuiFlexItem key={index} grow={false}>
            <EuiText size="xs" textAlign="center">
              {item.x}
            </EuiText>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderSimpleLineChart();
      case 'pie':
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <EuiText color="subdued">
              Pie charts coming soon! Showing data as text:
            </EuiText>
            <EuiSpacer size="s" />
            {sampleData.map((item, index) => (
              <div key={index}>
                {item.label || item.x}: {item.y}
              </div>
            ))}
          </div>
        );
      case 'bar':
      default:
        return renderSimpleBarChart();
    }
  };

  return (
    <EuiPanel {...props} paddingSize="m" hasBorder>
      {title && (
        <>
          <EuiText>
            <h4 style={{ textAlign: 'center', margin: 0 }}>{title}</h4>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}
      <div style={{ minHeight: `${height}px` }}>
        {renderChart()}
      </div>
      {showLegend && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued" textAlign="center">
            Sample {type} chart with {sampleData.length} data points
          </EuiText>
        </>
      )}
    </EuiPanel>
  );
};
