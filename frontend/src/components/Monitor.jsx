import React, { useState, useEffect, useRef } from 'react';

export default function Monitor({
  logs,
  sharedMemory,
  stats,
  nodes,
  activeNodeId,
  isCollapsed,
  onToggleCollapse
}) {
  const [activeTab, setActiveTab] = useState('logs'); // logs, memory, thoughts, stats
  const consoleEndRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulate historical charts data
  const [tokensHistory, setTokensHistory] = useState([120, 240, 180, 310, 420, 250, 480]);
  const [costHistory, setCostHistory] = useState([0.02, 0.05, 0.08, 0.11, 0.16, 0.19, 0.24]);

  // Update mock charts during runs
  useEffect(() => {
    if (stats.tokens > 0) {
      setTokensHistory(prev => [...prev.slice(1), stats.tokens % 500 + 100]);
      setCostHistory(prev => [...prev.slice(1), stats.cost]);
    }
  }, [stats.tokens, stats.cost]);

  // Extract thoughts from log data
  const thoughtLogs = logs.filter(
    (log) => log.source.toLowerCase() !== 'system' && log.message.includes('"thoughts"')
  );

  const getThoughtJSON = (message) => {
    try {
      // Find JSON block
      const startIdx = message.indexOf('{');
      const endIdx = message.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = message.substring(startIdx, endIdx + 1);
        return JSON.parse(jsonStr);
      }
      return { text: message };
    } catch (e) {
      return { text: message };
    }
  };

  return (
    <div className={`bottom-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header and Toggle Controls */}
      <div className="bottom-panel-header" onClick={onToggleCollapse}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontWeight: '600', letterSpacing: '-0.01em', color: 'var(--text)' }}>
            PROCESS MONITOR & TRACING
          </span>
          <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className={`mode-tab ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
              style={{ border: 'none', padding: '2px 8px', borderRadius: '2px', cursor: 'pointer' }}
            >
              Console Stream
            </button>
            <button
              className={`mode-tab ${activeTab === 'memory' ? 'active' : ''}`}
              onClick={() => setActiveTab('memory')}
              style={{ border: 'none', padding: '2px 8px', borderRadius: '2px', cursor: 'pointer' }}
            >
              Shared Memory ({Object.keys(sharedMemory).length} keys)
            </button>
            <button
              className={`mode-tab ${activeTab === 'thoughts' ? 'active' : ''}`}
              onClick={() => setActiveTab('thoughts')}
              style={{ border: 'none', padding: '2px 8px', borderRadius: '2px', cursor: 'pointer' }}
            >
              Thought Stream
            </button>
            <button
              className={`mode-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              style={{ border: 'none', padding: '2px 8px', borderRadius: '2px', cursor: 'pointer' }}
            >
              Resource Telemetry
            </button>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {isCollapsed ? '▲ Expand Logs' : '▼ Collapse Logs'}
        </span>
      </div>

      {/* Main Monitoring Body */}
      {!isCollapsed && (
        <div className="bottom-panel-content">
          {/* TAB 1: CONSOLE LOGS */}
          {activeTab === 'logs' && (
            <div className="console-logs">
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>
                  No active processes. Click 'Run Workflow' to begin agent tracing...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="console-log-line">
                    <span className="console-log-timestamp">[{log.time}]</span>
                    <span className={`console-log-source ${log.source.toLowerCase()}`}>
                      {log.source.toUpperCase()}:
                    </span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          )}

          {/* TAB 2: SHARED MEMORY STATE */}
          {activeTab === 'memory' && (
            <div className="console-logs" style={{ backgroundColor: '#070809', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  Centralized Key-Value Shared Memory Storage (JSON State)
                </div>
                <div className="memory-viewer" style={{ flex: 1 }}>
                  <pre className="memory-inspector">
                    {JSON.stringify(sharedMemory, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AGENT THOUGHT STREAMS */}
          {activeTab === 'thoughts' && (
            <div className="console-logs" style={{ padding: '16px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>
                Deep Step-by-Step Agent Reasoning Traces (Groq Versatile Output)
              </div>
              {thoughtLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No parsed agent thoughts available yet. Ensure active agents are executing.
                </div>
              ) : (
                thoughtLogs.map((log, idx) => {
                  const data = getThoughtJSON(log.message);
                  return (
                    <div
                      key={log.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '12px',
                        marginBottom: '10px',
                        backgroundColor: 'var(--surface)'
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600',
                          color: 'var(--accent-primary)',
                          marginBottom: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span>Step {idx + 1}: {log.source.toUpperCase()}</span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.65rem' }}>
                          {log.time}
                        </span>
                      </div>
                      
                      {data.thoughts && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: 'var(--accent-warning)', fontWeight: 'bold' }}>THOUGHTS:</span>{' '}
                          <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>{data.thoughts}</span>
                        </div>
                      )}

                      {data.action && (
                        <div style={{ marginBottom: '8px', padding: '6px', backgroundColor: '#0a0a0a', borderLeft: '2px solid var(--accent-running)' }}>
                          <span style={{ color: 'var(--accent-running)', fontWeight: 'bold' }}>ACTION TAKEN:</span>{' '}
                          <code style={{ color: '#60a5fa' }}>{data.action}</code>
                        </div>
                      )}

                      {data.response && (
                        <div>
                          <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>RESPONSE:</span>{' '}
                          <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#070809', borderRadius: '3px', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                            {data.response}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: PERFORMANCE & COST GRAPHS */}
          {activeTab === 'stats' && (
            <div className="console-logs" style={{ display: 'flex', gap: '20px', padding: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  SIMULATED CUMULATIVE TOKENS RUN
                </div>
                <div className="perf-chart-container">
                  {tokensHistory.map((val, idx) => (
                    <div
                      key={idx}
                      className="perf-bar"
                      style={{
                        height: `${Math.min(100, (val / 600) * 100)}%`,
                        backgroundColor: 'var(--accent-running)'
                      }}
                      title={`${val} Tokens`}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>T-60s</span>
                  <span>Now ({stats.tokens} tokens)</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  CUMULATIVE RUN COST (SIMULATED USD)
                </div>
                <div className="perf-chart-container">
                  {costHistory.map((val, idx) => (
                    <div
                      key={idx}
                      className="perf-bar"
                      style={{
                        height: `${Math.min(100, (val / 0.5) * 100)}%`,
                        backgroundColor: 'var(--accent-success)'
                      }}
                      title={`$${val.toFixed(4)}`}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>T-60s</span>
                  <span>Now (${stats.cost.toFixed(4)})</span>
                </div>
              </div>
            </div>
          )}

          {/* Details Sidebar Pane */}
          <div className="details-panel" style={{ borderLeft: '1px solid var(--border)' }}>
            <div className="detail-section-title">Telemetry Status</div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-value" style={{ color: stats.status === 'Running' ? 'var(--accent-running)' : stats.status === 'Completed' ? 'var(--accent-success)' : 'var(--text)' }}>
                  {stats.status}
                </div>
                <div className="stat-label">System State</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.latency.toFixed(2)}s</div>
                <div className="stat-label">Elapsed Latency</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.steps}</div>
                <div className="stat-label">Agent Steps Run</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${stats.cost.toFixed(4)}</div>
                <div className="stat-label">Est. API Cost</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
