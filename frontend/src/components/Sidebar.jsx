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
  onOpenSettings,
  onAddCustomNode
}) {
  const modes = [
    { id: 'sequential', name: 'Sequential DAG', desc: 'Topological execution passing context downstream.' },
    { id: 'debate', name: 'Consensus Loop', desc: 'Multi-turn debate with adversarial refinement.' },
    { id: 'orchestrator', name: 'Orchestrator Hub', desc: 'Central coordinator directing specialized workers.' },
    { id: 'broadcast', name: 'Parallel Swarm', desc: 'Simultaneous multi-agent execution with fan-in merge.' }
  ];

  return (
    <div className="sidebar">
      {/* Platform Title & Settings */}
      <div className="sidebar-section header-section">
        <div className="sidebar-header-row">
          <div className="sidebar-brand">
            <span className="brand-logo">🌌</span>
            <div>
              <span className="brand-title">AgentVerse</span>
              <span className="brand-badge">PRO V2.4</span>
            </div>
          </div>
          <button className="settings-btn" onClick={onOpenSettings} title="Configure API Keys">
            ⚙ Keys
          </button>
        </div>
      </div>

      {/* Workflow Presets */}
      <div className="sidebar-section">
        <div className="sidebar-title-row">
          <span className="sidebar-title">BENCHMARK PRESETS</span>
          <span className="sidebar-badge">{templates.length}</span>
        </div>
        <div className="templates-list">
          {templates.map((temp) => (
            <div
              key={temp.id}
              className={`template-card ${activeTemplateId === temp.id ? 'active' : ''}`}
              onClick={() => executionState !== 'running' && onSelectTemplate(temp.id)}
              style={{ opacity: executionState === 'running' ? 0.6 : 1 }}
            >
              <div className="template-card-top">
                <span className="template-icon">{temp.icon || '⚡'}</span>
                <span className="template-name">{temp.name}</span>
              </div>
              <div className="template-desc">{temp.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Orchestration Mode */}
      <div className="sidebar-section">
        <div className="sidebar-title">ORCHESTRATION TOPOLOGY</div>
        <div className="mode-selector">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-tab ${selectedMode === mode.id ? 'active' : ''}`}
              onClick={() => executionState !== 'running' && onSelectMode(mode.id)}
              style={{ opacity: executionState === 'running' ? 0.6 : 1 }}
              title={mode.desc}
            >
              {mode.name}
            </div>
          ))}
        </div>
      </div>

      {/* Task Prompt Input & Action Controls */}
      <div className="sidebar-section">
        <div className="sidebar-title">TASK OBJECTIVE & PROMPT</div>
        <div className="form-group">
          <textarea
            className="form-textarea task-textarea"
            placeholder="Specify multi-agent objective (e.g. Build financial algo, benchmark sentiment, test security vulnerabilities)..."
            value={taskPrompt}
            onChange={(e) => onChangeTaskPrompt(e.target.value)}
            disabled={executionState === 'running'}
            rows={3}
          />
        </div>

        <div className="sidebar-action-buttons">
          {executionState === 'running' ? (
            <button
              className="action-btn warning-btn"
              onClick={onResetWorkflow}
            >
              ■ Halt Execution
            </button>
          ) : (
            <>
              <button
                className="action-btn primary-btn"
                onClick={onRunWorkflow}
              >
                ▶ Run Benchmark
              </button>
              <button
                className="action-btn secondary-btn"
                onClick={onResetWorkflow}
                title="Reset execution state"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Add Node Bar */}
      <div className="sidebar-section quick-add-section">
        <div className="sidebar-title">ADD AGENT NODE</div>
        <div className="quick-add-grid">
          <button
            className="quick-add-btn"
            onClick={() => onAddCustomNode && onAddCustomNode('coding')}
            disabled={executionState === 'running'}
          >
            + Developer
          </button>
          <button
            className="quick-add-btn"
            onClick={() => onAddCustomNode && onAddCustomNode('testing')}
            disabled={executionState === 'running'}
          >
            + QA Tester
          </button>
          <button
            className="quick-add-btn hitl-btn-add"
            onClick={() => onAddCustomNode && onAddCustomNode('approval')}
            disabled={executionState === 'running'}
          >
            🛡️ HITL Gate
          </button>
          <button
            className="quick-add-btn"
            onClick={() => onAddCustomNode && onAddCustomNode('evaluator')}
            disabled={executionState === 'running'}
          >
            🔍 Evaluator
          </button>
        </div>
      </div>

      {/* Active Node Inspector */}
      <div className="sidebar-section inspector-section">
        <div className="sidebar-title">NODE INSPECTOR</div>
        {selectedNode ? (
          <div className="inspector-content">
            <div className="inspector-node-title">
              <span className="node-icon">🤖</span>
              <span className="node-name-text">{selectedNode.name}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Role Definition</label>
              <select
                className="form-select"
                value={selectedNode.role}
                onChange={(e) => onUpdateNode({ ...selectedNode, role: e.target.value })}
                disabled={executionState === 'running'}
              >
                <option value="research">Market / Research Analyst</option>
                <option value="coding">Software Developer</option>
                <option value="testing">QA & Validation</option>
                <option value="approval">🛡️ Human-In-The-Loop Checkpoint</option>
                <option value="evaluator">Benchmark Evaluator</option>
                <option value="orchestrator">Orchestrator Manager</option>
                <option value="input">Workflow Trigger</option>
                <option value="output">Output Consolidation</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Model</label>
              <input
                type="text"
                className="form-input"
                value={selectedNode.model || 'qwen/qwen3.8-27b'}
                onChange={(e) => onUpdateNode({ ...selectedNode, model: e.target.value })}
                disabled={executionState === 'running'}
              />
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Sampling Temperature</label>
                <span className="mono-val">{selectedNode.temperature ?? 0.1}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="form-range"
                value={selectedNode.temperature ?? 0.1}
                onChange={(e) => onUpdateNode({ ...selectedNode, temperature: parseFloat(e.target.value) })}
                disabled={executionState === 'running'}
              />
            </div>

            {/* Attached Capabilities */}
            <div className="form-group">
              <label className="form-label">Attached Capabilities ({selectedNode.capabilities?.length || 0})</label>
              <div className="inspector-chips-list">
                {selectedNode.capabilities && selectedNode.capabilities.length > 0 ? (
                  selectedNode.capabilities.map((cap) => {
                    const capId = typeof cap === 'string' ? cap : cap.id;
                    const capName = typeof cap === 'string' ? cap : cap.name;
                    return (
                      <span key={capId} className="inspector-cap-chip">
                        <span>{capName}</span>
                        <button
                          className="chip-del"
                          onClick={() => {
                            const newCaps = selectedNode.capabilities.filter((c) => (c.id || c) !== capId);
                            onUpdateNode({ ...selectedNode, capabilities: newCaps });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                ) : (
                  <span className="inspector-hint">Drag features from the left palette to attach here.</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Directive</label>
              <textarea
                className="form-textarea inspector-prompt"
                value={selectedNode.prompt || ''}
                onChange={(e) => onUpdateNode({ ...selectedNode, prompt: e.target.value })}
                disabled={executionState === 'running'}
                rows={4}
              />
            </div>
          </div>
        ) : (
          <div className="inspector-empty">
            <span>Select any node on the canvas to inspect prompt & capabilities.</span>
          </div>
        )}
      </div>
    </div>
  );
}
