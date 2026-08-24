from flask import Flask, request, Response, stream_with_context, jsonify
import json
from orchestrator import AgentOrchestrator

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
  response = jsonify({"status": "healthy", "service": "AgentVerse Flask Backend"})
  response.headers.add("Access-Control-Allow-Origin", "*")
  return response

@app.route('/api/run', methods=['POST', 'OPTIONS'])
def run_workflow():
  if request.method == 'OPTIONS':
    # Handle preflight CORS request
    response = Response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
    return response

  config = request.json or {}
  nodes = config.get("nodes", [])
  connections = config.get("connections", [])
  mode = config.get("mode", "sequential")
  task = config.get("task", "")
  keys = config.get("keys", {})

  try:
    with open("debug_keys.txt", "w") as f:
      f.write(json.dumps(keys, indent=2))
  except:
    pass

  orchestrator = AgentOrchestrator(
    nodes=nodes,
    connections=connections,
    mode=mode,
    task=task,
    keys=keys
  )

  def generate():
    for event in orchestrator.run():
      yield f"data: {json.dumps(event)}\n\n"

  response = Response(stream_with_context(generate()), mimetype='text/event-stream')
  response.headers.add("Access-Control-Allow-Origin", "*")
  response.headers.add("Access-Control-Allow-Headers", "*")
  return response

if __name__ == "__main__":
  # Run Flask server on port 8000
  app.run(host="0.0.0.0", port=8000, debug=True)
