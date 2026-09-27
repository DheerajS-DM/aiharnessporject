import React from 'react';

export default function TutorialModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 bg-[#252525] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            Platform Tutorial
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] text-sm text-gray-300 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Welcome to the Multi-Agent Benchmark Platform</h3>
            <p className="leading-relaxed">
              This platform allows you to design, deploy, and benchmark complex multi-agent architectures. You can visually construct Directed Acyclic Graphs (DAGs) representing workflows of autonomous agents.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">Key Features</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Agent Canvas:</strong> Drag and drop nodes to create custom agent workflows. Connect nodes to define the execution sequence.</li>
              <li><strong>Feature Palette:</strong> Open the left menu (closed by default) to drag specialized capabilities (like Web Search, Code Sandbox, or Human-in-the-Loop) onto agent nodes.</li>
              <li><strong>Output & Telemetry:</strong> Open the right menu to view real-time execution logs, inter-agent dialogue, shared memory (Blackboard), and performance benchmarks (Scorecard).</li>
              <li><strong>Preset Templates:</strong> Use the dropdown in the header to load pre-configured architectures like AutoGPT-style Loops, LLM Evaluator pipelines, or Consensus Debates.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">How to Run a Workflow</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Set your API Keys in the top-right settings (⚙️).</li>
              <li>Select a preset template or build your own DAG on the canvas.</li>
              <li>Define the main task prompt in the top input bar.</li>
              <li>Click <strong>Run Workflow</strong> to begin execution. Watch the agents collaborate in real-time!</li>
            </ol>
          </section>

          <section className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-1">Human-in-the-Loop (HITL)</h4>
            <p>
              If an agent node has the <strong>Human Approval Gate</strong> feature, execution will pause when reaching that node. A modal will appear allowing you to approve, reject, or modify the agent's proposed action before it proceeds.
            </p>
          </section>
        </div>
        
        <div className="p-4 border-t border-white/10 bg-[#252525] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
