import json
import time
import requests

class AgentOrchestrator:
  def __init__(self, nodes, connections, mode, task, keys):
    self.nodes = {n['id']: n for n in nodes}
    self.connections = connections
    self.mode = mode
    self.task = task
    self.groq_key = keys.get('groqKey', '')
    self.gemini_key = keys.get('geminiKey', '')
    
    self.shared_memory = {}
    self.logs = []
    
    # Resolve model aliases
    self.groq_model = "qwen/qwen3.6-27b"
    self.gemini_model = "gemini-3.5-flash"

  def log_step(self, source, message, tokens=0, cost=0.0):
    entry = {
      "time": time.strftime("%X"),
      "source": source,
      "message": message,
      "tokens": tokens,
      "cost": cost
    }
    self.logs.append(entry)
    return entry

  def query_groq(self, system_prompt, user_prompt, model_override=None):
    if not self.groq_key:
      return self.simulate_response(system_prompt, user_prompt)

    model = model_override if model_override and model_override != "versatile" else self.groq_model
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
      "Authorization": f"Bearer {self.groq_key}",
      "Content-Type": "application/json"
    }
    
    # Simplified JSON formatting instructions to reduce token count and improve validation success
    full_system = f"You are an AI assistant. You must respond ONLY with a raw JSON object matching the schema below. Do not wrap in markdown code blocks. Do not write text before or after the JSON.\n\nSchema:\n{{\n  \"thoughts\": \"your internal reasoning\",\n  \"action\": \"your action\",\n  \"response\": \"your response\"\n}}\n\nRole:\n{system_prompt}"
    
    payload = {
      "model": model,
      "messages": [
        {"role": "system", "content": full_system},
        {"role": "user", "content": user_prompt}
      ],
      "temperature": 0.0,
      "response_format": {"type": "json_object"},
      "max_tokens": 4096
    }

    retries = 3
    for attempt in range(retries):
      try:
        resp = requests.post(url, headers=headers, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        content = data['choices'][0]['message']['content']
        
        # Robust JSON cleaning
        clean_content = content.strip()
        if clean_content.startswith("```"):
          # Try to strip markdown block formatting
          lines = clean_content.splitlines()
          if lines and lines[0].startswith("```"):
            lines = lines[1:]
          if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
          clean_content = "\n".join(lines).strip()
        
        # Extract content between first '{' and last '}'
        start_idx = clean_content.find("{")
        end_idx = clean_content.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
          clean_content = clean_content[start_idx:end_idx+1]
          
        parsed = json.loads(clean_content)
        tokens = data.get('usage', {}).get('total_tokens', 150)
        cost = (data.get('usage', {}).get('prompt_tokens', 0) * 0.0005 / 1000) + \
               (data.get('usage', {}).get('completion_tokens', 0) * 0.0008 / 1000)
        if cost == 0:
          cost = tokens * 0.000002
        return parsed, tokens, cost
      except requests.exceptions.HTTPError as he:
        if he.response is not None and he.response.status_code == 429:
          wait_time = 5.0
          try:
            error_data = he.response.json()
            err_msg = error_data.get('error', {}).get('message', '')
            if "try again in" in err_msg:
              parts = err_msg.split("try again in")
              wait_time = float(parts[1].strip().split("s")[0].strip()) + 0.5
          except:
            pass
          
          # Read retry-after header if present
          retry_after = he.response.headers.get("retry-after")
          if retry_after:
            try:
              wait_time = float(retry_after) + 0.5
            except:
              pass
          
          print(f"RATE LIMIT (429) HIT: Sleeping for {wait_time:.2f}s before retry {attempt + 1}/{retries}...", flush=True)
          time.sleep(wait_time)
          continue
        
        import traceback
        traceback.print_exc()
        error_msg = he.response.text if he.response is not None else str(he)
        print(f"DEBUG: Groq HTTPError response body: {error_msg}")
        try:
          with open('debug_error.log', 'w') as f:
            f.write(f"STATUS CODE: {he.response.status_code if he.response is not None else 'N/A'}\n")
            f.write(f"ERROR: {error_msg}\n")
        except:
          pass
        return {
          "thoughts": f"API request error: {str(he)}",
          "action": "ERROR_FALLBACK",
          "response": f"Failed to receive JSON from Groq: {error_msg}"
        }, 0, 0.0
      except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DEBUG: General Exception: {str(e)}")
        try:
          with open('debug_error.log', 'w') as f:
            f.write(f"GENERAL ERROR: {str(e)}\n")
        except:
          pass
        return {
          "thoughts": f"API request error: {str(e)}",
          "action": "ERROR_FALLBACK",
          "response": f"Failed to receive JSON from Groq: {str(e)}"
        }, 0, 0.0

    return {
      "thoughts": "API request error: Rate limit retries exhausted",
      "action": "ERROR_FALLBACK",
      "response": "Failed to receive JSON from Groq: Rate limit (429) retries exhausted. Please try again later."
    }, 0, 0.0

  def query_gemini_review(self, conversation_history):
    if not self.gemini_key:
      return "Gemini review mock: Validated. All agent conversation turns satisfy JSON formatting criteria and task specifications."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_key}"
    headers = {"Content-Type": "application/json"}
    
    review_prompt = f"Analyze this conversation history between collaborative AI agents:\n\n{json.dumps(conversation_history, indent=2)}\n\nProvide a final evaluation of their output code or analysis, detailing if the assertions passed and whether requirements were met."
    
    payload = {
      "contents": [
        {"parts": [{"text": review_prompt}]}
      ],
      "generationConfig": {
        "temperature": 0.0
      }
    }

    try:
      resp = requests.post(url, headers=headers, json=payload, timeout=15)
      resp.raise_for_status()
      data = resp.json()
      review_text = data['candidates'][0]['content']['parts'][0]['text']
      return review_text
    except Exception as e:
      return f"Gemini review completed with warnings (API request error: {str(e)})"

  def simulate_response(self, system_prompt, user_prompt):
    time.sleep(1.0)
    if "Developer" in system_prompt or "coding" in system_prompt:
      return {
        "thoughts": "Structuring the requested Python pandas statistics processor.",
        "action": "CODE_GEN",
        "response": "import pandas as pd\n\ndef calculate_csv_stats(path):\n    df = pd.read_csv(path)\n    return df.describe().to_json()"
      }, 140, 0.00028
    elif "QA" in system_prompt or "testing" in system_prompt:
      return {
        "thoughts": "Testing generated calculator code. Verifying Pandas read exceptions.",
        "action": "RUN_UNIT_TESTS",
        "response": "TEST VERDICT: Passed. 3 mock runs executed with 0 failures."
      }, 100, 0.0002
    elif "Architect" in system_prompt or "research" in system_prompt:
      return {
        "thoughts": "Extracting schema specifications and column details.",
        "action": "SCHEMA_DESIGN",
        "response": "CSV specs resolved: target aggregations = mean, sum; active fields = Customer_ID, Purchase_Amt."
      }, 110, 0.00022
    else:
      return {
        "thoughts": "Assembling unified outputs from agent nodes.",
        "action": "MERGE_OUTPUT",
        "response": "Multi-agent run successfully executed. Core task requirements completed."
      }, 120, 0.00024

  def run(self):
    # Determine execution order based on connections
    in_degree = {nid: 0 for nid in self.nodes}
    adj_list = {nid: [] for nid in self.nodes}
    
    for conn in self.connections:
      u, v = conn['fromNode'], conn['toNode']
      if u in adj_list and v in in_degree:
        adj_list[u].append(v)
        in_degree[v] += 1
        
    queue = [nid for nid in self.nodes if in_degree[nid] == 0]
    execution_order = []
    
    while queue:
      u = queue.pop(0)
      execution_order.append(u)
      for v in adj_list[u]:
        in_degree[v] -= 1
        if in_degree[v] == 0:
          queue.append(v)

    conversation_turns = []
    
    if self.mode == 'debate':
      dev_node = next((n for n in self.nodes.values() if n['role'] == 'coding'), None)
      qa_node = next((n for n in self.nodes.values() if n['role'] == 'testing'), None)
      
      if dev_node and qa_node:
        yield {"type": "node_start", "nodeId": dev_node['id'], "nodeName": dev_node['name']}
        
        context = f"Main Task: {self.task}"
        for turn in range(1, 4): # Cap at 3 turns
          # Developer Turn
          dev_prompt = f"{context}\n\nLast Feedback: {self.shared_memory.get('qa_feedback', 'None')}"
          yield {"type": "node_start", "nodeId": dev_node['id'], "nodeName": dev_node['name']}
          
          res, t, c = self.query_groq(dev_node['prompt'], dev_prompt, dev_node.get('model'))
          self.shared_memory['developed_code'] = res.get('response', '')
          
          self.log_step(dev_node['role'], json.dumps(res), t, c)
          yield {
            "type": "node_progress", 
            "agent": dev_node['role'], 
            "message": json.dumps(res),
            "tokens": t,
            "cost": c
          }
          conversation_turns.append({"agent": "Developer", "output": res})
          
          # QA Turn
          yield {"type": "node_start", "nodeId": qa_node['id'], "nodeName": qa_node['name']}
          qa_prompt = f"Code to test:\n{self.shared_memory['developed_code']}"
          
          res, t, c = self.query_groq(qa_node['prompt'], qa_prompt, qa_node.get('model'))
          self.shared_memory['qa_feedback'] = res.get('response', '')
          
          self.log_step(qa_node['role'], json.dumps(res), t, c)
          yield {
            "type": "node_progress", 
            "agent": qa_node['role'], 
            "message": json.dumps(res),
            "tokens": t,
            "cost": c
          }
          conversation_turns.append({"agent": "QA_Tester", "output": res})
          
          yield {"type": "node_complete", "nodeId": dev_node['id'], "memory": self.shared_memory}
          yield {"type": "node_complete", "nodeId": qa_node['id'], "memory": self.shared_memory}

    else:
      for node_id in execution_order:
        node = self.nodes[node_id]
        if node['role'] == 'input':
          self.shared_memory['input_task'] = self.task
          self.log_step("system", f"Input registered: {self.task}")
          yield {"type": "node_complete", "nodeId": node_id, "memory": self.shared_memory}
          continue
          
        yield {"type": "node_start", "nodeId": node_id, "nodeName": node['name']}
        
        user_prompt = f"Task: {self.task}\nShared Context State: {json.dumps(self.shared_memory)}"
        
        res, tokens, cost = self.query_groq(node['prompt'], user_prompt, node.get('model'))
        self.shared_memory[f"{node['role']}_output"] = res.get('response', '')
        
        yield {
          "type": "node_progress", 
          "agent": node['role'], 
          "message": json.dumps(res),
          "tokens": tokens,
          "cost": cost
        }
        
        conversation_turns.append({"agent": node['name'], "output": res})
        yield {"type": "node_complete", "nodeId": node_id, "memory": self.shared_memory}
        time.sleep(0.5)

    # Final review
    self.log_step("system", "Assembling conversations. Querying Gemini for final review.")
    review = self.query_gemini_review(conversation_turns)
    self.log_step("gemini", f"Review Completed:\n{review}")
    
    yield {
      "type": "workflow_complete",
      "memory": self.shared_memory,
      "review": review
    }
