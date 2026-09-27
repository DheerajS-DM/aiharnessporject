import os
import json
from flask import Flask, request, Response, stream_with_context, jsonify, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Load environment variables (.env)
try:
    from dotenv import load_dotenv
    # Load from current directory and parent directory
    load_dotenv()
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

from orchestrator import AgentOrchestrator, submit_human_approval
from tools import default_tool_registry

app = Flask(__name__)

# Setup Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Locate compiled frontend assets for production / Render deployment
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    return response

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return add_cors_headers(Response())
    response = jsonify({
        "status": "healthy",
        "service": "AgentVerse Multi-Agent Benchmark Engine",
        "version": "2.4.0",
        "mcp_tools_count": len(default_tool_registry.tools)
    })
    return add_cors_headers(response)

@app.route('/api/tools', methods=['GET', 'OPTIONS'])
def list_tools():
    if request.method == 'OPTIONS':
        return add_cors_headers(Response())
    tools = default_tool_registry.get_definitions()
    return add_cors_headers(jsonify({"tools": tools}))

@app.route('/api/approval/<run_id>', methods=['POST', 'OPTIONS'])
def handle_approval(run_id):
    if request.method == 'OPTIONS':
        return add_cors_headers(Response())
    
    data = request.json or {}
    approved = data.get("approved", True)
    feedback = data.get("feedback", "")
    modified_action = data.get("modified_action", None)
    
    success = submit_human_approval(run_id, approved=approved, feedback=feedback, modified_action=modified_action)
    return add_cors_headers(jsonify({
        "run_id": run_id,
        "success": success,
        "status": "resumed" if success else "run_id_not_found_or_expired"
    }))

@app.route('/api/run', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute")
def run_workflow():
    if request.method == 'OPTIONS':
        return add_cors_headers(Response())

    config = request.json or {}
    nodes = config.get("nodes", [])
    connections = config.get("connections", [])
    mode = config.get("mode", "sequential")
    task = config.get("task", "")
    
    # Anti-Prompt Injection Validation
    forbidden_phrases = ["ignore previous instructions", "system prompt", "bypass", "override", "you are no longer", "forget all instructions"]
    task_lower = task.lower()
    for phrase in forbidden_phrases:
        if phrase in task_lower:
            response = jsonify({"error": "Security Error: Malicious prompt pattern detected."})
            response.status_code = 400
            return add_cors_headers(response)

    keys = config.get("keys", {})
    run_id = config.get("run_id")

    orchestrator = AgentOrchestrator(
        nodes=nodes,
        connections=connections,
        mode=mode,
        task=task,
        keys=keys,
        run_id=run_id
    )

    def generate():
        for event in orchestrator.run():
            yield f"data: {json.dumps(event)}\n\n"

    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    return add_cors_headers(response)

# Production Frontend Hosting for Render deployment
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404
        
    if os.path.exists(FRONTEND_DIST):
        target = os.path.join(FRONTEND_DIST, path)
        if path != "" and os.path.exists(target) and not os.path.isdir(target):
            return send_from_directory(FRONTEND_DIST, path)
        index_path = os.path.join(FRONTEND_DIST, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(FRONTEND_DIST, 'index.html')
            
    return jsonify({
        "status": "AgentVerse API is live",
        "note": "Frontend dist not built yet. Run 'npm run build' in frontend directory to serve UI."
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
