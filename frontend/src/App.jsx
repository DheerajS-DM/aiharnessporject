import React, { useState, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import Monitor from './components/Monitor';

// Preset Workflow Templates
const PRESET_TEMPLATES = [
  {
    id: 'software-dev',
    name: 'Software Engineering Team',
    description: 'Specs -> Code -> QA. Standard engineering pipeline.',
    mode: 'debate',
    task: 'Create a lightweight Python CLI utility that reads a CSV file, parses columns, and outputs basic summary statistics.',
    nodes: [
      { id: 'node-in', name: 'User Task Input', role: 'input', x: 40, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Collect requirements from the user.' },
      { id: 'node-spec', name: 'Software Architect', role: 'research', x: 280, y: 40, model: 'versatile', temperature: 0.0, prompt: 'Analyze CSV spec requirements. Design JSON data schemas and function outlines. Always output response as JSON.' },
      { id: 'node-dev', name: 'Senior Python Developer', role: 'coding', x: 520, y: 40, model: 'versatile', temperature: 0.0, prompt: 'Implement code strictly matching architect specifications. Format response as JSON containing your thoughts, action (code block), and response.' },
      { id: 'node-qa', name: 'QA & Testing Engineer', role: 'testing', x: 520, y: 220, model: 'versatile', temperature: 0.0, prompt: 'Analyze developer code. Write mock assertions to verify execution. Output test feedback in JSON format.' },
      { id: 'node-out', name: 'Final Review & Assemble', role: 'output', x: 800, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Assemble final vetted script.' }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-spec' },
      { id: 'c2', fromNode: 'node-spec', toNode: 'node-dev' },
      { id: 'c3', fromNode: 'node-dev', toNode: 'node-qa' },
      { id: 'c4', fromNode: 'node-qa', toNode: 'node-out' }
    ]
  },
  {
    id: 'finance-analyst',
    name: 'Financial Risk Assessment',
    description: 'Market research and risk modeling team.',
    mode: 'sequential',
    task: 'Analyze the current quarterly performance of NVIDIA (NVDA) and compile a risk recommendation portfolio.',
    nodes: [
      { id: 'node-in', name: 'Target Stocks', role: 'input', x: 40, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Pass ticker inputs.' },
      { id: 'node-mkt', name: 'Market Intelligence', role: 'research', x: 280, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Retrieve and summarize pricing indices, P/E ratios, and growth factors.' },
      { id: 'node-risk', name: 'Quantitative Modeler', role: 'testing', x: 540, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Model standard deviations, Beta metrics, and drawdown variables.' },
      { id: 'node-out', name: 'Report Assembler', role: 'output', x: 800, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Synthesize risk metrics and market analyses into a comprehensive portfolio.' }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-mkt' },
      { id: 'c2', fromNode: 'node-mkt', toNode: 'node-risk' },
      { id: 'c3', fromNode: 'node-risk', toNode: 'node-out' }
    ]
  },
  {
    id: 'marketing-copy',
    name: 'Parallel Creative Campaign',
    description: 'Parallel brainstorming and copywriting synthesis.',
    mode: 'broadcast',
    task: 'Draft a marketing slogan and social media copy launch plan for a new plant-based organic energy drink.',
    nodes: [
      { id: 'node-in', name: 'Product Outline', role: 'input', x: 40, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Product detail specs.' },
      { id: 'node-w1', name: 'Slogan Copywriter', role: 'research', x: 340, y: 30, model: 'versatile', temperature: 0.0, prompt: 'Brainstorm punchy, short slogans. Return in JSON format.' },
      { id: 'node-w2', name: 'Social Media Writer', role: 'coding', x: 340, y: 220, model: 'versatile', temperature: 0.0, prompt: 'Draft Twitter threads and LinkedIn launch copies. Return in JSON.' },
      { id: 'node-out', name: 'Brand Editor', role: 'output', x: 740, y: 120, model: 'versatile', temperature: 0.0, prompt: 'Collate slogans and copy options, aligning with strict brand compliance rules.' }
    ],
    connections: [
      { id: 'c1', fromNode: 'node-in', toNode: 'node-w1' },
      { id: 'c2', fromNode: 'node-in', toNode: 'node-w2' },
      { id: 'c3', fromNode: 'node-w1', toNode: 'node-out' },
      { id: 'c4', fromNode: 'node-w2', toNode: 'node-out' }
    ]
  }
];

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const [nodes, setNodes] = useState(PRESET_TEMPLATES[0].nodes);
  const [connections, setConnections] = useState(PRESET_TEMPLATES[0].connections);
  const [activeTemplateId, setActiveTemplateId] = useState(PRESET_TEMPLATES[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedMode, setSelectedMode] = useState(PRESET_TEMPLATES[0].mode);
  const [taskPrompt, setTaskPrompt] = useState(PRESET_TEMPLATES[0].task);

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
  const [stats, setStats] = useState({
    status: 'Ready',
    latency: 0.0,
    steps: 0,
    tokens: 0,
    cost: 0.0
  });

  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const latencyTimerRef = useRef(null);
  const socketRef = useRef(null);

  // Synchronize style theme classes
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [themeMode]);

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
    setStats({
      status: 'Ready',
      latency: 0.0,
      steps: 0,
      tokens: 0,
      cost: 0.0
    });
    if (latencyTimerRef.current) {
      clearInterval(latencyTimerRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  // Trigger Execution (Flask HTTP stream connection vs Fallback mock run)
  const handleRunWorkflow = async () => {
    handleResetWorkflow();
    setExecutionState('running');
    setConsoleCollapsed(false);
    addLog('System', `Initiating Multi-Agent Workflow run in mode: ${selectedMode}`);

    // Start timer
    const startTime = Date.now();
    latencyTimerRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        latency: (Date.now() - startTime) / 1000,
        status: 'Running'
      }));
    }, 100);

    // If keys are provided, query our Flask backend SSE stream.
    if (apiKeys.groqKey) {
      try {
        addLog('System', 'Connecting to Flask agent engine streaming endpoint...');
        const backendUrl = `http://localhost:8000/api/run`;
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nodes,
            connections,
            mode: selectedMode,
            task: taskPrompt,
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
          buffer = lines.pop(); // Keep remaining buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));

              if (data.type === 'node_start') {
                setActiveNodeId(data.nodeId);
                addLog('System', `Activating node: ${data.nodeName}`);
              } else if (data.type === 'node_progress') {
                addLog(data.agent, data.message);
                setStats(prev => ({
                  ...prev,
                  steps: prev.steps + 1,
                  tokens: prev.tokens + (data.tokens || 0),
                  cost: prev.cost + (data.cost || 0.0001)
                }));
              } else if (data.type === 'node_complete') {
                setCompletedNodeIds(prev => [...prev, data.nodeId]);
                setSharedMemory(data.memory);
              } else if (data.type === 'workflow_complete') {
                clearInterval(latencyTimerRef.current);
                setExecutionState('completed');
                setActiveNodeId(null);
                setStats(prev => ({ ...prev, status: 'Completed' }));
                addLog('System', 'Workflow execution successfully completed.');
                addLog('Gemini Review', `FINAL ANALYSIS VERDICT:\n${data.review}`);
              } else if (data.type === 'error') {
                clearInterval(latencyTimerRef.current);
                setExecutionState('error');
                setActiveNodeId(null);
                setStats(prev => ({ ...prev, status: 'Failed' }));
                addLog('System', `Critical Engine Error: ${data.message}`);
              }
            }
          }
        }
        return;
      } catch (e) {
        console.error('Failed to connect to Flask stream, starting local sandbox simulation', e);
        addLog('System', `Backend connection failed: ${e.message}. Starting local simulation fallback.`);
      }
    }

    // Default Fallback: High Fidelity Local Matte Sandbox Simulator
    runMockSimulation();
  };

  // High Fidelity Local UI Simulator for immediate visual feedback
  const runMockSimulation = () => {
    addLog('System', 'Launching high-fidelity Local Sandbox simulation. (No keys needed or backend offline)');
    
    // Sort nodes to simulate logical sequence
    const execOrder = ['node-in', 'node-spec', 'node-dev', 'node-qa', 'node-out'];
    let stepIndex = 0;
    let localMemory = {};
    let turnCount = 0;

    const runNextStep = () => {
      if (stepIndex >= execOrder.length) {
        // Complete execution
        clearInterval(latencyTimerRef.current);
        setExecutionState('completed');
        setActiveNodeId(null);
        setStats(prev => ({ ...prev, status: 'Completed' }));
        
        // Final review stage via mock Gemini
        setTimeout(() => {
          addLog('Gemini', JSON.stringify({
            thoughts: "Verifying final conversation flow. Checking strict JSON conformity. Evaluating product usability.",
            action: "GEMINI_VERSATILE_REVIEW",
            response: "REVIEW VERDICT: Passed. Senior Python Developer code works, satisfies CSV requirements, and successfully handles column structures. Tested assertions evaluate to TRUE. 0 exceptions raised. Fast compilation completed."
          }));
          addLog('System', 'Multi-Agent run telemetry finished.');
        }, 1200);
        return;
      }

      const currentId = execOrder[stepIndex];
      const node = nodes.find(n => n.id === currentId);
      
      if (!node) {
        stepIndex++;
        runNextStep();
        return;
      }

      setActiveNodeId(currentId);
      addLog('System', `Activating node: ${node.name} [Role: ${node.role}]`);

      setTimeout(() => {
        // Build JSON process updates based on role
        let message = '';
        let stepTokens = 120;
        let stepCost = 0.0003;

        if (node.role === 'input') {
          localMemory.task = taskPrompt;
          localMemory.files_found = ["customers.csv", "sales_report.csv"];
          message = JSON.stringify({
            thoughts: "Analyzing core prompt requirements. Initiating directory reads.",
            action: "SCAN_FILES",
            response: `Loaded target file context. Ready to proceed with: "${taskPrompt}"`
          });
        } 
        else if (node.role === 'research') {
          localMemory.specs = {
            columns: ["Customer_ID", "Purchase_Amt", "Order_Date"],
            data_types: { "Customer_ID": "str", "Purchase_Amt": "float", "Order_Date": "date" },
            aggregations: ["mean(Purchase_Amt)", "count(Customer_ID)"]
          };
          message = JSON.stringify({
            thoughts: "Determining file layouts. Formatting strict JSON configurations for developer node.",
            action: "SCHEMA_DESIGN",
            response: "Parsed CSV schema structures. Mapped aggregation logic: aggregate 'Purchase_Amt' by 'Customer_ID' with average calculation."
          });
        } 
        else if (node.role === 'coding') {
          localMemory.code = `
import pandas as pd
def analyze_csv(filepath):
    df = pd.read_csv(filepath)
    summary = {
        'total_records': len(df),
        'mean_purchase': df['Purchase_Amt'].mean(),
        'unique_customers': df['Customer_ID'].nunique()
      }
    return summary
`;
          message = JSON.stringify({
            thoughts: "Writing Pandas CLI script to load file. Implementing required dictionary counters.",
            action: "CODE_GEN",
            response: "Python function analyze_csv successfully written. Inputs validated. Memory parameters updated."
          });
        } 
        else if (node.role === 'testing') {
          localMemory.test_results = {
            assertions_checked: 3,
            passed: 3,
            errors: 0
          };
          message = JSON.stringify({
            thoughts: "Executing code assertions in isolated mock memory sandbox. Validating schema inputs.",
            action: "RUN_UNIT_TESTS",
            response: "TEST RESULTS: 3 Assertions passed, 0 failures. No columns mismatch errors detected."
          });
        } 
        else if (node.role === 'output') {
          localMemory.final_status = "Approved";
          message = JSON.stringify({
            thoughts: "Merging logs, verified assertions, and finalized python scripts.",
            action: "ASSEMBLE_ARTIFACT",
            response: "All pipeline operations successful. Code is vetted, verified, and ready for deployment."
          });
        }

        addLog(node.role, message);
        setCompletedNodeIds(prev => [...prev, currentId]);
        setSharedMemory({ ...localMemory });
        
        // Update stats
        setStats(prev => ({
          ...prev,
          steps: prev.steps + 1,
          tokens: prev.tokens + stepTokens,
          cost: prev.cost + stepCost
        }));

        stepIndex++;
        runNextStep();
      }, 2000); // 2 second pause to visually track connection paths
    };

    runNextStep();
  };

  const handleUpdateNode = (updatedNode) => {
    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const handleUpdateNodes = (newNodes) => {
    setNodes(newNodes);
  };

  const handleUpdateConnections = (newConnections) => {
    setConnections(newConnections);
  };

  return (
    <div className="app-container">
      {/* Platform Header */}
      <header className="app-header">
        <div className="brand-section">
          <span style={{ fontSize: '1.2rem' }}>🌌</span>
          <span className="brand-title">AgentVerse</span>
          <span className="brand-badge">v1.2 // Matte Minimal</span>
        </div>
        <div className="nav-controls">
          <button
            className="theme-toggle-btn"
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
          >
            {themeMode === 'dark' ? '☀ Light UI' : '☾ Dark UI'}
          </button>
          <button
            className="action-btn"
            onClick={() => {
              // Quick clear / reset
              handleResetWorkflow();
            }}
          >
            Clear Screen
          </button>
        </div>
      </header>

      {/* Main Panel layout */}
      <div className="main-content">
        {/* Left pane details selector */}
        <Sidebar
          templates={PRESET_TEMPLATES}
          activeTemplateId={activeTemplateId}
          onSelectTemplate={handleSelectTemplate}
          selectedNode={nodes.find(n => n.id === selectedNodeId)}
          onUpdateNode={handleUpdateNode}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          taskPrompt={taskPrompt}
          onChangeTaskPrompt={setTaskPrompt}
          onRunWorkflow={handleRunWorkflow}
          onResetWorkflow={handleResetWorkflow}
          executionState={executionState}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Visual Workflow Designer canvas */}
        <Canvas
          nodes={nodes}
          connections={connections}
          activeNodeId={activeNodeId}
          completedNodeIds={completedNodeIds}
          onUpdateNodes={handleUpdateNodes}
          onUpdateConnections={handleUpdateConnections}
          onSelectNode={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
          executionState={executionState}
        />

        {/* API Settings Modal */}
        {showSettingsModal && (
          <div className="settings-overlay">
            <div className="settings-modal">
              <div className="settings-modal-header">
                <h3>Configure API Credentials</h3>
                <button className="close-modal-btn" onClick={() => setShowSettingsModal(false)}>
                  ×
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enter your credentials below. Credentials are saved locally on your device (in LocalStorage) and are never uploaded.
                </div>
                
                <div className="form-group">
                  <label className="form-label">Groq API Key (Fast Execution)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="gsk_..."
                    defaultValue={apiKeys.groqKey}
                    id="groq-key-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gemini API Key (Review Stage)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="AIzaSy..."
                    defaultValue={apiKeys.geminiKey}
                    id="gemini-key-input"
                  />
                </div>
              </div>

              <div className="settings-modal-footer">
                <button
                  className="action-btn"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => {
                    const groqVal = document.getElementById('groq-key-input').value;
                    const geminiVal = document.getElementById('gemini-key-input').value;
                    handleSaveKeys({ groqKey: groqVal, geminiKey: geminiVal });
                  }}
                >
                  Save Keys
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Process Tracing Monitor */}
      <Monitor
        logs={logs}
        sharedMemory={sharedMemory}
        stats={stats}
        nodes={nodes}
        activeNodeId={activeNodeId}
        isCollapsed={consoleCollapsed}
        onToggleCollapse={() => setConsoleCollapsed(!consoleCollapsed)}
      />
    </div>
  );
}
