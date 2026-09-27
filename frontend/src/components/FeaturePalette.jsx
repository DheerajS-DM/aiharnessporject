import React, { useState } from 'react';
import { DraggableFeatureCard } from './DraggableFeatureCard';

export const AVAILABLE_FEATURES = [
  // 1. Reasoning & Cognitive
  {
    id: 'cot_reasoning',
    name: 'Chain of Thought',
    category: 'reasoning',
    badge: 'CoT',
    icon: '🧠',
    description: 'Enforces explicit multi-step reasoning before generating actions.'
  },
  {
    id: 'self_reflection',
    name: 'Self-Reflection',
    category: 'reasoning',
    badge: 'Reflect',
    icon: '🪞',
    description: 'Autonomous critique cycle to catch errors before emitting output.'
  },

  // 2. Model Context Protocol (MCP) Tools
  {
    id: 'tool_web_search',
    name: 'Live Web Search',
    category: 'tools',
    badge: 'MCP',
    icon: '🌐',
    description: 'Real-time search across live web data & financial indices.'
  },
  {
    id: 'tool_code_exec',
    name: 'Python Sandbox',
    category: 'tools',
    badge: 'MCP',
    icon: '⚡',
    description: 'Isolated Python code execution environment for data algorithms.'
  },
  {
    id: 'tool_fin_calc',
    name: 'FinTech Calculator',
    category: 'tools',
    badge: 'MCP',
    icon: '📈',
    description: 'Institutional financial math: CAGR, Sharpe Ratio, SIP, Volatility.'
  },
  {
    id: 'tool_sql',
    name: 'SQL Data Query',
    category: 'tools',
    badge: 'MCP',
    icon: '🗄️',
    description: 'Relational query engine for in-memory and database records.'
  },

  // 3. Governance & HITL
  {
    id: 'human_approval',
    name: 'Human-in-the-Loop Gate',
    category: 'governance',
    badge: 'HITL',
    icon: '🛡️',
    description: 'Pauses pipeline for human verification before proceeding downstream.'
  },
  {
    id: 'schema_guard',
    name: 'JSON Schema Guard',
    category: 'governance',
    badge: 'Guard',
    icon: '🔒',
    description: 'Strict schema adherence validator with auto-retry logic.'
  },

  // 4. Benchmarking & Telemetry
  {
    id: 'latency_sla',
    name: 'Latency SLA Monitor',
    category: 'benchmark',
    badge: 'SLA',
    icon: '⏱️',
    description: 'Tracks TTFT, P95 latency, and enforces SLA thresholds.'
  },
  {
    id: 'evaluator_scoring',
    name: 'Consensus Scorer',
    category: 'benchmark',
    badge: 'Eval',
    icon: '🎯',
    description: 'Cross-verifies outputs against peer agent responses for consensus.'
  }
];

export const FeaturePalette = ({ isCollapsed, onToggle }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', label: 'All Capabilities' },
    { id: 'reasoning', label: 'Reasoning' },
    { id: 'tools', label: 'MCP Tools' },
    { id: 'governance', label: 'HITL & Guards' },
    { id: 'benchmark', label: 'Benchmark' }
  ];

  const filteredFeatures = AVAILABLE_FEATURES.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <aside className={`feature-palette-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="palette-header">
        <div className="palette-title-row">
          <span className="palette-icon">🧩</span>
          <h3>Agentic Features</h3>
          <span className="palette-counter">{AVAILABLE_FEATURES.length}</span>
        </div>
        <p className="palette-subtitle">Drag capabilities onto any agent node on the canvas</p>
        
        <input
          type="text"
          className="palette-search"
          placeholder="Filter features (e.g. CoT, MCP)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="palette-pills">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`palette-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-cards-container">
        {filteredFeatures.map((feat) => (
          <DraggableFeatureCard key={feat.id} feature={feat} />
        ))}
      </div>
    </aside>
  );
};
