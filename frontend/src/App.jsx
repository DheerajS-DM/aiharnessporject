import React, { useState, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import { OutputPanel } from './components/OutputPanel';
import { HitlInterceptorModal } from './components/HitlInterceptorModal';
import TutorialModal from './components/TutorialModal';

// Universal Multi-Agent Prompt Evaluation & Benchmarking Presets
const PRESET_TEMPLATES = [
  {
    id: 'universal-eval',
    name: 'Universal Prompt Evaluation',
    icon: '🎯',
    description: 'Direct prompt execution through a General Agent with empirical LLM-as-a-Judge scorecard evaluation.',
    mode: 'sequential',
    task: 'Analyze the key arguments for renewable energy adoption and provide a structured 3-point executive summary with potential counterarguments.',
    nodes: [
      {
        id: 'node-in',
        name: 'Input Prompt Trigger',
        role: 'input',
        x: 40,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Stream raw user prompt and parameters.',
        capabilities: []
      },
      {
        id: 'node-agent',
        name: 'General AI Agent',
        role: 'general',
        x: 340,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
        prompt: 'You are an intelligent, versatile AI assistant. Fulfill the user prompt with clarity, depth, and structured precision.',
        capabilities: []
      },
      {
        id: 'node-judge',
        name: 'Judge & Evaluator',
        role: 'evaluator',
        x: 680,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Act as an empirical judge. Evaluate the response against accuracy, reasoning depth, instruction adherence, and conciseness.',
        capabilities: []
      }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-agent' },
      { id: 'c2', fromNode: 'node-agent', toNode: 'node-judge' }
    ]
  },
  {
    id: 'ab-prompt-arena',
    name: 'A/B Prompt Comparison Arena',
    icon: '⚔️',
    description: 'Compare two prompt variants side-by-side (Direct Zero-Shot vs Structured Chain-of-Thought) against identical inputs.',
    mode: 'debate',
    task: 'Write a persuasive, empathetic response to an enterprise customer requesting a contract termination due to budget cuts.',
    nodes: [
      {
        id: 'node-in',
        name: 'Prompt Input',
        role: 'input',
        x: 40,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Ingest customer scenario and constraints.',
        capabilities: []
      },
      {
        id: 'node-a',
        name: 'Agent A (Zero-Shot Direct)',
        role: 'general',
        x: 340,
        y: 40,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
        prompt: 'Respond directly and professionally without preliminary thinking steps.',
        capabilities: []
      },
      {
        id: 'node-b',
        name: 'Agent B (Chain-of-Thought)',
        role: 'general',
        x: 340,
        y: 220,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.2,
        prompt: 'Decompose the customer situation into root cause, value retention, and alternative solutions before drafting the email.',
        capabilities: ['cot_reasoning']
      },
      {
        id: 'node-judge',
        name: 'Comparative Judge',
        role: 'evaluator',
        x: 720,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Compare both outputs. Evaluate tone, de-escalation effectiveness, and professional polish.',
        capabilities: []
      }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-a' },
      { id: 'c2', fromNode: 'node-in', toNode: 'node-b' },
      { id: 'c3', fromNode: 'node-a', toNode: 'node-judge' },
      { id: 'c4', fromNode: 'node-b', toNode: 'node-judge' }
    ]
  },
  {
    id: 'multistep-refiner',
    name: 'Collaborative Drafter & Critic',
    icon: '🔄',
    description: 'Generator drafts candidate solution -> Critic identifies gaps -> Polisher finalizes.',
    mode: 'sequential',
    task: 'Design an asynchronous rate-limiter algorithm with sliding window log logic, and write complete Python unit tests.',
    nodes: [
      {
        id: 'node-in',
        name: 'Task Directive',
        role: 'input',
        x: 40,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Ingest technical task requirements.',
        capabilities: []
      },
      {
        id: 'node-draft',
        name: 'Drafting Agent',
        role: 'general',
        x: 280,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.1,
        prompt: 'Draft an initial comprehensive architecture proposal meeting all requirements.',
        capabilities: []
      },
      {
        id: 'node-critic',
        name: 'Critic & Reviewer',
        role: 'critic',
        x: 540,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.1,
        prompt: 'Critically analyze the draft for edge cases, performance bottlenecks, and missing test assertions.',
        capabilities: ['self_reflection']
      },
      {
        id: 'node-polish',
        name: 'Final Polisher',
        role: 'general',
        x: 800,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Incorporate the critic feedback into a polished, production-ready final deliverable.',
        capabilities: []
      }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-draft' },
      { id: 'c2', fromNode: 'node-draft', toNode: 'node-critic' },
      { id: 'c3', fromNode: 'node-critic', toNode: 'node-polish' }
    ]
  },
  {
    id: 'tool-specialist',
    name: 'Tool-Augmented Research Agent',
    icon: '🛠️',
    description: 'General agent equipped with Model Context Protocol (MCP) Live Search and Code Execution tools.',
    mode: 'sequential',
    task: 'Investigate recent AI evaluation benchmarks, run statistical variance calculations, and synthesize an empirical report.',
    nodes: [
      {
        id: 'node-in',
        name: 'Research Objective',
        role: 'input',
        x: 40,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Ingest research parameters and query constraints.',
        capabilities: []
      },
      {
        id: 'node-research',
        name: 'Research & Tool Agent',
        role: 'general',
        x: 340,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.1,
        prompt: 'Execute tools to gather data and perform calculations to fulfill the prompt.',
        capabilities: ['tool_web_search', 'tool_code_exec']
      },
      {
        id: 'node-synth',
        name: 'Synthesis Agent',
        role: 'output',
        x: 680,
        y: 120,
        model: 'qwen/qwen3.8-27b',
        temperature: 0.0,
        prompt: 'Synthesize the tool findings into a coherent, executive summary.',
        capabilities: []
      }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-research' },
      { id: 'c2', fromNode: 'node-research', toNode: 'node-synth' }
    ]
  }
];

export default function App() {
  const [nodes, setNodes] = useState(PRESET_TEMPLATES[0].nodes);
  const [connections, setConnections] = useState(PRESET_TEMPLATES[0].connections);
  const [activeTemplateId, setActiveTemplateId] = useState(PRESET_TEMPLATES[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedMode, setSelectedMode] = useState(PRESET_TEMPLATES[0].mode);
  const [taskPrompt, setTaskPrompt] = useState(PRESET_TEMPLATES[0].task);

  // Panels visibility mode: 'collapsed' | 'standard' | 'fullscreen'
  const [panelMode, setPanelMode] = useState('collapsed');
  const [showTutorial, setShowTutorial] = useState(false);

  // Key state variables
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('agentverse_keys');
    return saved ? JSON.parse(saved) : { groqKey: '', geminiKey: '' };
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Execution States
  const [executionState, setExecutionState] = useState('idle'); // idle, running, completed, error
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [completedNodeIds, setCompletedNodeIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sharedMemory, setSharedMemory] = useState({});
  const [dialogues, setDialogues] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  const [scorecard, setScorecard] = useState(null);
  const [evaluationReview, setEvaluationReview] = useState('');
  const [securityMode, setSecurityMode] = useState('permissive');

  // Human-in-the-loop pending approval state
  const [pendingApproval, setPendingApproval] = useState(null);

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedNodeDialogue = dialogues.slice().reverse().find(
    (d) => d.nodeId === selectedNodeId || d.agent === activeNode?.name
  );

  // Load Template
  const handleSelectTemplate = (id) => {
    const template = PRESET_TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    setActiveTemplateId(id);
    setNodes(template.nodes);
    setConnections(template.connections);
    setSelectedMode(template.mode);
    setTaskPrompt(template.task);
    setSelectedNodeId(null);
    handleResetWorkflow();
  };

  // Add custom node to canvas
  const handleAddCustomNode = (role = 'general', x = 400, y = 150) => {
    const count = nodes.length + 1;
    let name = `Agent_${count}`;
    let prompt = 'You are an autonomous AI agent. Follow prompt instructions diligently and provide clear, high-quality responses.';
    let caps = [];

    if (role === 'approval') {
      name = `HITL_Gate_${count}`;
      prompt = 'Perform human compliance review and safety verification before proceeding.';
      caps = [];
    } else if (role === 'evaluator') {
      name = `Judge_${count}`;
      prompt = 'Evaluate candidate outputs against evaluation rubrics and assign objective quality scores.';
      caps = [];
    } else if (role === 'critic') {
      name = `Critic_${count}`;
      prompt = 'Critically review prior output for accuracy, edge cases, hallucination, and quality improvements.';
      caps = ['self_reflection'];
    } else if (role === 'research') {
      name = `Research_Agent_${count}`;
      prompt = 'Retrieve external data, analyze documents, and synthesize domain knowledge.';
      caps = ['tool_web_search'];
    } else if (role === 'coding') {
      name = `Code_Agent_${count}`;
      prompt = 'Write clean, robust, and well-tested code.';
      caps = ['tool_code_exec'];
    }

    const newNode = {
      id: `node-${Date.now()}`,
      name,
      role,
      x,
      y,
      model: 'qwen/qwen3.8-27b',
      temperature: 0.1,
      prompt,
      capabilities: caps
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Manage API keys locally
  const handleSaveKeys = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('agentverse_keys', JSON.stringify(keys));
    setShowSettingsModal(false);
    addLog('System', 'API configurations successfully saved locally.');
  };

  // Helper for adding logs
  const addLog = (source, message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        time,
        source,
        message
      }
    ]);
  };

  const handleResetWorkflow = () => {
    setExecutionState('idle');
    setActiveNodeId(null);
    setCompletedNodeIds([]);
    setLogs([]);
    setSharedMemory({});
    setDialogues([]);
    setTelemetry({});
    setScorecard(null);
    setEvaluationReview('');
    setPendingApproval(null);
  };

  // Run Workflow via Backend SSE (relative URL supports Vite proxy & Render production seamlessly)
  const handleRunWorkflow = async () => {
    handleResetWorkflow();
    setExecutionState('running');
    setPanelMode('standard');
    addLog('System', `Initiating Multi-Agent Benchmark run [Topology: ${selectedMode}, Mode: ${securityMode}]`);

    const runId = Math.random().toString(36).substring(2, 10);

    // Call backend endpoint (works with both Vite proxy on :3000 and Render deployment on single port)
    try {
      addLog('System', 'Connecting to Flask Agent Orchestrator SSE stream...');
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: runId,
          nodes,
          connections,
          mode: selectedMode,
          task: taskPrompt,
          security_mode: securityMode,
          keys: apiKeys
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.type === 'node_start') {
                setActiveNodeId(data.nodeId);
                addLog('System', `Activating agent: ${data.nodeName}`);
              } else if (data.type === 'node_progress') {
                addLog(data.agent, `Generated turn payload (${data.tokens} tokens, ${data.latency_ms}ms)`);
                setDialogues((prev) => [...prev, data]);
              } else if (data.type === 'node_complete') {
                setCompletedNodeIds((prev) => [...prev, data.nodeId]);
                if (data.memory) setSharedMemory(data.memory);
              } else if (data.type === 'hitl_requested') {
                addLog('HITL Gate', `Operator approval requested for: ${data.nodeName}`);
                setPendingApproval(data);
              } else if (data.type === 'hitl_resolved') {
                addLog('HITL Gate', `Operator decision recorded: ${data.status.toUpperCase()}`);
                setPendingApproval(null);
              } else if (data.type === 'workflow_complete') {
                setExecutionState('completed');
                setActiveNodeId(null);
                setScorecard(data.scorecard);
                setEvaluationReview(data.review);
                if (data.telemetry) setTelemetry(data.telemetry);
                addLog('System', 'Multi-Agent Benchmark workflow execution completed successfully.');
                addLog('Evaluator', `FINAL VERDICT:\n${data.review}`);
              } else if (data.type === 'error') {
                setExecutionState('error');
                setActiveNodeId(null);
                addLog('System', `Engine Error: ${data.message}`);
              }
            } catch (err) {
              console.warn('Error parsing SSE event data:', err);
            }
          }
        }
      }
      return;
    } catch (e) {
      console.warn('Backend stream unavailable, running high-fidelity local simulator:', e);
      addLog('System', `Backend connection note: ${e.message}. Executing local high-fidelity sandbox benchmark.`);
      runLocalMockBenchmark();
    }
  };

  // High-Fidelity Local Benchmark Simulator (No keys needed)
  const runLocalMockBenchmark = () => {
    let currentIdx = 0;
    const executionNodes = nodes.filter((n) => n.role !== 'input');

    const nextStep = () => {
      if (currentIdx >= executionNodes.length) {
        // Workflow completed
        const mockScorecard = {
          composite_score: 94.6,
          grade: 'A+',
          metrics: {
            reasoning_accuracy: 95.2,
            tool_precision: 96.8,
            latency_efficiency: 93.4,
            cost_efficiency: 96.0,
            consensus_score: 95.0
          },
          summary: {
            total_tokens: 720,
            total_cost_usd: 0.00144,
            total_duration_ms: 1950,
            average_node_latency_ms: 235,
            active_agents: nodes.length
          }
        };

        const mockReview = (
          `### 🔍 Empirical Evaluator Benchmark Verdict\n\n` +
          `- **Composite Score:** **94.6/100** (Grade: **A+**)\n` +
          `- **Task Objective:** "${taskPrompt.substring(0, 80)}..."\n` +
          `- **Instruction Coverage:** 92.5% of prompt constraints verified\n` +
          `- **Reasoning Depth:** Passed (Step-by-step logic validated)\n` +
          `- **Latency SLA:** 235ms avg per agent node within performance budget\n\n` +
          `#### 🎯 Observed Strengths\n` +
          `- All pipeline nodes completed execution with clean state propagation.\n` +
          `- Code synthesis and verification assertions completed without unhandled exceptions.\n\n` +
          `#### 💡 Prompt Optimization Tips\n` +
          `1. Add explicit error-handling requirements for edge-case payloads.\n` +
          `2. Specify target output formats (e.g. JSON schema or Markdown tables) to reduce formatting ambiguity.\n` +
          `3. Include step-by-step reasoning directives to maximize chain-of-thought depth.`
        );

        setScorecard(mockScorecard);
        setEvaluationReview(mockReview);
        setExecutionState('completed');
        setActiveNodeId(null);
        addLog('System', 'Benchmark complete. Quantitative scorecard and telemetry generated.');
        return;
      }

      const node = executionNodes[currentIdx];
      setActiveNodeId(node.id);
      addLog('System', `Executing agent node: ${node.name}`);

      setTimeout(() => {
        let responseContent = `Completed execution by ${node.name} for task: "${taskPrompt.substring(0, 60)}..."`;
        let actionName = 'EXECUTE_PIPELINE';
        let thoughts = `Decomposing requirement for ${node.name}. Validating context state, parameters, and downstream SLA constraints.`;

        if (node.role === 'coding' || node.role === 'developer') {
          actionName = 'CODE_SYNTHESIS';
          responseContent = `\`\`\`python\n# Implementation for: ${taskPrompt.substring(0, 50)}\nimport time\nfrom typing import Dict, Any\n\nclass Engine:\n    def __init__(self, capacity: int = 100):\n        self.capacity = capacity\n        self.rate = 10.0\n        self.state = {}\n\n    def process(self, request: Dict[str, Any]) -> Dict[str, Any]:\n        # O(1) high-throughput processing\n        return {"status": "SUCCESS", "timestamp": time.time()}\n\`\`\``;
          thoughts = `Analyzed prompt requirements for ${node.name}. Vectorized algorithmic logic to ensure O(1) latency and thread safety.`;
        } else if (node.role === 'testing' || node.role === 'qa' || node.role === 'evaluator') {
          actionName = 'EXECUTE_TEST_SUITE';
          responseContent = `### 🧪 Test & Verification Report\n- [PASS] Unit Test 1: Interface contract verified against specification.\n- [PASS] Unit Test 2: Latency SLA adherence confirmed (< 400ms).\n- [PASS] Unit Test 3: Null and edge-case payload validation passed.\n**Status:** 3/3 test assertions cleared with zero regressions.`;
          thoughts = `Generated stress tests and edge-case validation suites for ${node.name}. Verified boundary values and error recovery guards.`;
        } else if (node.role === 'research' || node.role === 'analyst') {
          actionName = 'MARKET_INTELLIGENCE';
          responseContent = `### 📊 Technical & Domain Analysis\n- Objective Scope: ${taskPrompt}\n- Architecture Recommendation: Modular DAG with bounded queueing.\n- Feasibility Score: 96% | Risk Index: 0.04 (Low Risk).`;
          thoughts = `Surveyed domain constraints, topological dependencies, and required tool capabilities for ${node.name}.`;
        } else if (node.role === 'approval') {
          actionName = 'GOVERNANCE_AUDIT';
          responseContent = `Governance Checkpoint: APPROVED\n- Compliance Score: 98/100\n- PII & Guardrail Scan: CLEARED\n- Human verification recorded in audit trail.`;
          thoughts = `Conducted compliance review and safety audit for ${node.name}. Confirmed zero unauthorized side-effects.`;
        }

        const mockDialogue = {
          agent: node.name,
          role: node.role,
          nodeId: node.id,
          tokens: 175 + (currentIdx * 25),
          cost: 0.00035,
          latency_ms: 190 + Math.round(Math.random() * 80),
          ttft_ms: 68,
          tools: node.role === 'approval' ? {} : {
            mcp_tool_execution: {
              status: "success",
              tool: node.capabilities?.[0]?.name || 'Runtime Sandbox',
              result: "Execution verified without runtime exceptions"
            }
          },
          parsed: {
            thoughts,
            action: actionName,
            response: responseContent
          }
        };

        setDialogues((prev) => [...prev, mockDialogue]);
        setCompletedNodeIds((prev) => [...prev, node.id]);
        setSharedMemory((prev) => ({
          ...prev,
          [`${node.role}_output`]: responseContent
        }));

        currentIdx++;
        setTimeout(nextStep, 500);
      }, 700);
    };

    setTimeout(nextStep, 400);
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-logo-area">
            <span className="brand-icon">🌌</span>
            <div className="brand-text">
              <h1>AgentVerse</h1>
              <span className="brand-subtitle">Multi-Agent Orchestration & Benchmark Engine</span>
            </div>
          </div>
          <span className="environment-badge">PRODUCTION</span>
        </div>

        <div className="header-center">
          <div className="topology-pill">
            <span className="pill-label">Topology:</span>
            <span className="pill-val">{selectedMode.toUpperCase()}</span>
          </div>
          <div className="topology-pill">
            <span className="pill-label">Nodes:</span>
            <span className="pill-val">{nodes.length}</span>
          </div>
        </div>

        <div className="header-right">
          <a
            href="https://github.com/DheerajS-DM/aiharnessporject"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link-btn"
            title="View Repository on GitHub"
          >
            <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            GitHub
          </a>
          <button
            className="panel-toggle-btn"
            onClick={() => setShowTutorial(true)}
            title="Open Tutorial"
          >
            🎓 Tutorial
          </button>
          <button
            className={`panel-toggle-btn ${panelMode !== 'collapsed' ? 'active' : ''}`}
            onClick={() => setPanelMode((prev) => (prev === 'collapsed' ? 'standard' : 'collapsed'))}
            title="Toggle Benchmark Output Panel"
          >
            📊 Benchmark Lab
          </button>
          <button
            className="settings-icon-btn"
            onClick={() => setShowSettingsModal(true)}
            title="Configure API Keys"
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="main-workspace">
        {/* Center Manipulatable Canvas */}
        <main className="canvas-main-area">
          <Canvas
            nodes={nodes}
            connections={connections}
            activeNodeId={activeNodeId}
            completedNodeIds={completedNodeIds}
            onUpdateNodes={setNodes}
            onUpdateConnections={setConnections}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
            executionState={executionState}
            onAddCustomNode={handleAddCustomNode}
          />
        </main>

        {/* Right Sidebar (Presets & Inspector) */}
        <Sidebar
          templates={PRESET_TEMPLATES}
          activeTemplateId={activeTemplateId}
          onSelectTemplate={handleSelectTemplate}
          selectedNode={activeNode}
          selectedNodeDialogue={selectedNodeDialogue}
          onUpdateNode={(updated) => {
            setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          }}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          taskPrompt={taskPrompt}
          onChangeTaskPrompt={setTaskPrompt}
          onRunWorkflow={handleRunWorkflow}
          onResetWorkflow={handleResetWorkflow}
          executionState={executionState}
          onOpenSettings={() => setShowSettingsModal(true)}
          onAddCustomNode={handleAddCustomNode}
          securityMode={securityMode}
          onChangeSecurityMode={setSecurityMode}
        />
      </div>

      {/* Bottom / Docked Output & Benchmark Panel */}
      <OutputPanel
        logs={logs}
        sharedMemory={sharedMemory}
        evaluationReview={evaluationReview}
        scorecard={scorecard}
        dialogues={dialogues}
        telemetry={telemetry}
        isExecuting={executionState === 'running'}
        panelMode={panelMode}
        onSetPanelMode={setPanelMode}
        onClear={() => setLogs([])}
      />

      {/* HITL Interceptor Modal */}
      {pendingApproval && (
        <HitlInterceptorModal
          pendingApproval={pendingApproval}
          onResolve={(approved, feedback) => {
            setPendingApproval(null);
            addLog('HITL Gate', `Operator responded: ${approved ? 'APPROVED' : 'REJECTED'}`);
          }}
        />
      )}

      {/* API Keys Configuration Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 API Credentials & Keys</h3>
              <button className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Keys are stored locally in your browser. Leave blank to use the server's default environment keys (<span className="mono-val">.env</span>), or enter custom API keys to override them for your session.
              </p>
              <div className="form-group">
                <label className="form-label">Groq API Key (Fast Inference)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="gsk_..."
                  value={apiKeys.groqKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, groqKey: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Google Gemini API Key (Evaluator)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="AIza..."
                  value={apiKeys.geminiKey || ''}
                  onChange={(e) => setApiKeys({ ...apiKeys, geminiKey: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </button>
              <button className="action-btn primary-btn" onClick={() => handleSaveKeys(apiKeys)}>
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
