import React from 'react';

export default function Sidebar({
  templates,
  activeTemplateId,
  onSelectTemplate,
  selectedNode,
  onUpdateNode,
  selectedMode,
  onSelectMode,
  taskPrompt,
  onChangeTaskPrompt,
  onRunWorkflow,
  onResetWorkflow,
  executionState,
  onOpenSettings
}) {
  const modes = [
    { id: 'sequential', name: 'Sequential Chain' },
    { id: 'debate', name: 'Refinement Loop (Debate)' },
    { id: 'orchestrator', name: 'Orchestrator-Worker' },
    { id: 'broadcast', name: 'Parallel Broadcast' }
  ];

  return (
    <div className="sidebar">
      {/* Platform title section */}
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>WORKFLOW MANAGER</span>
          <button className="theme-toggle-btn" onClick={onOpenSettings} style={{ padding: '4px 8px' }}>
            ⚙ API Keys
          </button>
        </div>
      </div>

      {/* Preset templates */}
      <div className="sidebar-section">
        <div className="sidebar-title">Workflow Presets</div>
        {templates.map((temp) => (
          <div
            key={temp.id}
            className={`template-card ${activeTemplateId === temp.id ? 'active' : ''}`}
            onClick={() => executionState !== 'running' && onSelectTemplate(temp.id)}
            style={{ opacity: executionState === 'running' ? 0.6 : 1 }}
          >
            <div className="template-name">{temp.name}</div>
            <div className="template-desc">{temp.description}</div>
          </div>
        ))}
      </div>

      {/* Orchestration Mode */}
      <div className="sidebar-section">
        <div className="sidebar-title">Orchestration Mode</div>
        <div className="mode-selector">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-tab ${selectedMode === mode.id ? 'active' : ''}`}
              onClick={() => executionState !== 'running' && onSelectMode(mode.id)}
              style={{
                fontSize: '0.65rem',
                padding: '8px 4px',
                textAlign: 'center',
                opacity: executionState === 'running' ? 0.6 : 1
              }}
              title={mode.name}
            >
              {mode.name.split(' ')[0]} {/* Abbreviate first word */}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
          {selectedMode === 'sequential' && 'Agents run one-by-one in order of connection.'}
          {selectedMode === 'debate' && 'Two agents discuss/debate a problem back and forth (capped at 3 turns).'}
          {selectedMode === 'orchestrator' && 'A manager agent directs/delegates subtasks to worker agents.'}
          {selectedMode === 'broadcast' && 'A single input is run on all agents simultaneously.'}
        </div>
      </div>

      {/* Task Prompt Input */}
      <div className="sidebar-section">
        <div className="sidebar-title">Core Execution Task</div>
        <div className="form-group">
          <label className="form-label">Task Instructions</label>
          <textarea
            className="form-textarea"
            placeholder="Describe the task for the agent team..."
            value={taskPrompt}
            onChange={(e) => onChangeTaskPrompt(e.target.value)}
            disabled={executionState === 'running'}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {executionState === 'running' ? (
            <button
              className="action-btn warning"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onResetWorkflow}
            >
              ■ Stop Running
            </button>
          ) : (
            <>
              <button
                className="action-btn primary"
                style={{ flex: 2, justifyContent: 'center' }}
                onClick={onRunWorkflow}
              >
                ▶ Run Workflow
              </button>
              <button
                className="action-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onResetWorkflow}
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Node Configurator / Drawer */}
      <div className="sidebar-section" style={{ flex: 1, borderBottom: 'none' }}>
        <div className="sidebar-title">Node Inspector</div>
        {selectedNode ? (
          <div style={{ display: 'flex', flex: '1', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
              {selectedNode.name}
            </div>

            <div className="form-group">
              <label className="form-label">Role Category</label>
              <select
                className="form-select"
                value={selectedNode.role}
                onChange={(e) => onUpdateNode({ ...selectedNode, role: e.target.value })}
                disabled={executionState === 'running'}
              >
                <option value="research">Research Agent</option>
                <option value="coding">Coding Agent</option>
                <option value="testing">Testing Agent</option>
                <option value="orchestrator">Orchestrator Manager</option>
                <option value="input">Workflow Input</option>
                <option value="output">Workflow Output</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Model Configuration</label>
              <input
                type="text"
                className="form-input"
                value={selectedNode.model || 'versatile'}
                onChange={(e) => onUpdateNode({ ...selectedNode, model: e.target.value })}
                disabled={executionState === 'running'}
                placeholder="versatile"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temperature (Low = Faster)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="form-input"
                  style={{ padding: 0 }}
                  value={selectedNode.temperature ?? 0.0}
                  onChange={(e) => onUpdateNode({ ...selectedNode, temperature: parseFloat(e.target.value) })}
                  disabled={executionState === 'running'}
                />
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.temperature ?? 0.0}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Instruction</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}
                value={selectedNode.prompt || ''}
                onChange={(e) => onUpdateNode({ ...selectedNode, prompt: e.target.value })}
                disabled={executionState === 'running'}
                placeholder="System instructions detailing the agent's behavior..."
              />
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
            Click on a node on the canvas to inspect and configure its parameters.
          </div>
        )}
      </div>
    </div>
  );
}
