# AgentVerse: An Intelligent Multi-Agent AI Collaboration Platform

AgentVerse is a multi-agent AI operating environment designed to build, run, and monitor collaborative teams of specialized AI agents. Unlike traditional AI applications relying on a single large language model, AgentVerse enables multiple specialized agents—such as Research, Coding, Testing, and Assembly agents—to work together within structured execution topologies to solve complex tasks.

The platform provides an interactive visual workflow canvas, a centralized shared memory system, an intelligent orchestration engine with low-latency constraints, and a real-time process monitoring console.

---

## Technical Stack & Architecture

AgentVerse is built as a lightweight, full-stack application designed to run locally with minimal setup overhead.

*   **Frontend (React + Vite)**: 
    *   **Core Logic**: JavaScript (ES6+), React hooks for canvas and console state.
    *   **Styling**: Premium, flat **matte minimalist lines** design system in pure CSS (no tailwind/bootstrap dependencies). Supports responsive dark and light modes.
    *   **Canvas rendering**: Custom SVG layers drawing cubic Bezier connection lines, animated dash arrays, and node dragging handlers.
*   **Backend (Flask)**:
    *   **Server Framework**: Python 3.11+ Flask framework.
    *   **SSE Streaming**: Server-Sent Events (`text/event-stream`) to stream agent progress chunks in real-time, removing complex WebSockets configuration blocks.
*   **AI Orchestration Engine**:
    *   **Primary Generator (Groq)**: Queries Groq's versatile model (e.g. `qwen/qwen3.6-27b`) with low temperature (`0.0`) for rapid execution.
    *   **Auditor / Reviewer (Gemini)**: Queries Gemini's versatile model (e.g. `gemini-3.5-flash`) at the end of the run to review final outputs.
    *   **Strict JSON validation**: All prompts request structured JSON output, which is validated at each step before passing data to the next agent.
    *   **Debate Limit Cap**: Execution loops (such as Coder-Tester debate loops) are strictly capped at a **maximum of 3 turns** to optimize token usage.

---

## Directory Structure

```
tanshika/
├── backend/
│   ├── main.py               # Flask application entry point & API endpoints
│   ├── orchestrator.py       # Multi-agent orchestrator & HTTP LLM client
│   └── requirements.txt      # Python backend package requirements
├── frontend/
│   ├── package.json          # Vite + React package metadata
│   ├── vite.config.js        # Vite configurations (proxies and ports)
│   ├── index.html            # Web app entry point (custom fonts loaded)
│   └── src/
│       ├── main.jsx          # React app mounting
│       ├── App.jsx           # Master layout and state coordinator
│       ├── App.css           # Minimalist matte lines styles and themes
│       └── components/
│           ├── Canvas.jsx    # Visual SVG flow graph builder
│           ├── Monitor.jsx   # Live log stream, thoughts panel, and stats graphs
│           └── Sidebar.jsx   # Configuration parameters & presets selector
└── README.md                 # Project documentation (this file)
```

---

## Installation & Setup Instructions

### Prerequisites
*   **Python 3.11+**
*   **Node.js 18+ & npm**

### 1. Backend Server Setup
From the project root directory, perform the following commands:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell/Git Bash):
source venv/bin/activate
# Windows (CMD):
.\venv\Scripts\activate

# Install the required packages
pip install -r backend/requirements.txt

# Run the Flask backend server
python backend/main.py
```
*The backend server will run on `http://localhost:8000`.*

### 2. Frontend React Setup
Open a new terminal window at the project root directory:

```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend web app will open at `http://localhost:3000`.*

---

## User Interaction Guide

1.  **Configure API Keys**: Click the **⚙ API Keys** button in the sidebar header to add your Groq and Gemini API keys (these are saved locally on your device in LocalStorage). If left blank, the platform automatically starts in **High-Fidelity Local Simulator Mode**.
2.  **Select Preset Teams**: Choose a preset on the sidebar (e.g. *Software Engineering Team*). The canvas will draw specialized nodes and routes.
3.  **Inspect Nodes**: Click on any node on the canvas to configure its system prompts, temperature sliders, or model assignments.
4.  **Edit Canvas Routes**: Click and drag from the output port (right side of a node) to the input port (left side of a node) to create connection lines. Click a line to delete it.
5.  **Run Workflows**: Describe a task in the instructions field and click **Run Workflow**. You can monitor telemetry, shared memory variables, and agent reasoning streams in the bottom panel in real time.

---

## References (APA 7th Edition)

1.  Russell, S., & Norvig, P. (2021). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.
2.  Wooldridge, M. (2009). *An Introduction to MultiAgent Systems* (2nd ed.). John Wiley & Sons.
3.  Wu, Q., Bansal, G., Zhang, J., Wu, Y., Li, B., Zhu, E., Jiang, L., Zhang, X., Zhang, S., Awadallah, A. H., White, R. W., Burger, D., & Wang, C. (2024). AutoGen: Enabling next-generation LLM applications via multi-agent conversation. *Proceedings of the Conference on Language Modeling (COLM 2024)*.
4.  Hong, S., Zhuge, M., Chen, J., Zheng, X., Cheng, Y., Wang, J., Zhang, C., Wang, Z., Yau, S. K. S., Lin, Z., Zhou, L., Ran, C., Xiao, L., Wu, C., & Schmidhuber, J. (2024). MetaGPT: Meta programming for a multi-agent collaborative framework. *Proceedings of the International Conference on Learning Representations (ICLR 2024)*.
5.  Qian, C., Liu, W., Hong, H., et al. (2024). ChatDev: Communicative agents for software development. *Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (ACL 2024)*.
6.  Guo, T., Chen, X., Wang, Y., Chang, R., Pei, S., Chawla, N. V., Wiest, O., & Zhang, X. (2024). Large language model based multi-agents: A survey of progress and challenges. *Proceedings of IJCAI 2024*.
7.  Li, X., Wang, S., Zeng, S., Wu, Y., & Yang, Y. (2024). A survey on LLM-based multi-agent systems: Workflow, infrastructure, and challenges. *Vicinagearth*, 1, Article 9. Springer Nature.
8.  Li, G., Hammoud, H., Itani, H., Khizbullin, D., & Ghanem, B. (2025). LLM-based multi-agent systems for software engineering: Literature review, vision, and the road ahead. *ACM Transactions on Software Engineering and Methodology (TOSEM)*.
9.  Chen, Y., Arkin, J., Zhang, Y., Roy, N., & Fan, C. (2024). Scalable multi-robot collaboration with large language models: Centralized or decentralized systems? *Proceedings of the IEEE International Conference on Robotics and Automation (ICRA)*.
10. Brown, T. B., Mann, B., Ryder, N., et al. (2020). Language models are few-shot learners. *Advances in Neural Information Processing Systems (NeurIPS)*, 33, 1877–1901.
11. Vaswani, A., Shazeer, N., Parmar, N., et al. (2017). Attention is all you need. *Advances in Neural Information Processing Systems (NeurIPS)*, 30, 5998–6008.
12. Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. *Proceedings of NAACL-HLT*, 4171–4186.
13. Lewis, P., Perez, E., Piktus, A., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems (NeurIPS)*, 33, 9459–9474.
14. Mnih, V., Kavukcuoglu, K., Silver, D., et al. (2015). Human-level control through deep reinforcement learning. *Nature*, 518(7540), 529–533.
15. Li, X., Wang, S., Zeng, S., Wu, Y., & Yang, Y. (2024). Multi-agent orchestration and collaborative intelligence using large language models: Recent advances and open challenges. *Springer Nature Review on Intelligent Systems*.
#   a i h a r n e s s p o r j e c t  
 