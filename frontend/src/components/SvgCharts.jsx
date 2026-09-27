import React from 'react';

export const LatencyWaterfall = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <span>No latency telemetry available yet</span>
      </div>
    );
  }

  const maxLatency = Math.max(...data.map((d) => d.latency_ms || 100), 500);

  return (
    <div className="latency-waterfall-chart">
      <div className="chart-header-row">
        <span className="chart-title">Agent Latency & TTFT Waterfall</span>
        <span className="chart-scale">Max: {Math.round(maxLatency)}ms</span>
      </div>
      <div className="waterfall-bars">
        {data.map((item, idx) => {
          const widthPct = Math.min(100, Math.max(10, ((item.latency_ms || 150) / maxLatency) * 100));
          const ttftPct = item.ttft_ms ? Math.min(widthPct, ((item.ttft_ms || 50) / maxLatency) * 100) : 0;
          return (
            <div key={idx} className="waterfall-row">
              <div className="waterfall-label">
                <span className="agent-tag">{item.agent || `Agent ${idx + 1}`}</span>
                <span className="role-tag">{item.role || 'worker'}</span>
              </div>
              <div className="waterfall-track">
                <div
                  className="waterfall-bar total-latency"
                  style={{ width: `${widthPct}%` }}
                >
                  {ttftPct > 0 && (
                    <div
                      className="waterfall-bar ttft-segment"
                      style={{ width: `${(ttftPct / widthPct) * 100}%` }}
                      title={`TTFT: ${Math.round(item.ttft_ms)}ms`}
                    />
                  )}
                </div>
                <span className="waterfall-value">{Math.round(item.latency_ms || 0)}ms</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="legend-dot ttft"></span> TTFT (Time to first token)</span>
        <span className="legend-item"><span className="legend-dot total"></span> Full Generation Latency</span>
      </div>
    </div>
  );
};

export const ScorecardBars = ({ metrics }) => {
  const items = [
    { key: 'reasoning_accuracy', label: 'Reasoning & Accuracy', value: metrics?.reasoning_accuracy ?? 94.2, color: 'var(--accent-purple)' },
    { key: 'tool_precision', label: 'MCP Tool Precision', value: metrics?.tool_precision ?? 96.0, color: 'var(--accent-cyan)' },
    { key: 'latency_efficiency', label: 'Latency SLA Adherence', value: metrics?.latency_efficiency ?? 88.5, color: 'var(--accent-emerald)' },
    { key: 'cost_efficiency', label: 'Token Cost Optimization', value: metrics?.cost_efficiency ?? 92.0, color: 'var(--accent-amber)' },
    { key: 'consensus_score', label: 'Multi-Agent Consensus', value: metrics?.consensus_score ?? 95.0, color: 'var(--accent-blue)' }
  ];

  return (
    <div className="scorecard-bars-component">
      {items.map((it) => (
        <div key={it.key} className="score-row">
          <div className="score-label-row">
            <span className="score-label">{it.label}</span>
            <span className="score-num" style={{ color: it.color }}>{it.value}%</span>
          </div>
          <div className="score-track">
            <div
              className="score-fill"
              style={{
                width: `${Math.min(100, Math.max(0, it.value))}%`,
                backgroundColor: it.color,
                boxShadow: `0 0 12px ${it.color}40`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MiniSparkline = ({ points, color = '#38bdf8', height = 36 }) => {
  if (!points || points.length < 2) {
    return <span className="sparkline-na">Live tracking...</span>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points, min + 1);
  const width = 120;
  
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min)) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="sparkline-svg">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};
