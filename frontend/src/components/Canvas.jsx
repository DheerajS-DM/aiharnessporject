import React, { useState, useRef, useEffect } from 'react';

export default function Canvas({
  nodes,
  connections,
  activeNodeId,
  completedNodeIds,
  onUpdateNodes,
  onUpdateConnections,
  onSelectNode,
  selectedNodeId,
  executionState,
  onAddCustomNode
}) {
  const canvasRef = useRef(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(1.0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Connection dragging state
  const [drawingConnection, setDrawingConnection] = useState(null);

  // Drop target highlighting for capabilities
  const [dragOverNodeId, setDragOverNodeId] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, canvasX, canvasY }

  // Constant Node Dimensions
  const NODE_WIDTH = 220;

  // Calculate Port positions taking zoom into account
  const getInputPortCoords = (node) => {
    return {
      x: (node.x * zoom) + pan.x,
      y: (node.y * zoom) + (60 * zoom) + pan.y
    };
  };

  const getOutputPortCoords = (node) => {
    return {
      x: ((node.x + NODE_WIDTH) * zoom) + pan.x,
      y: (node.y * zoom) + (60 * zoom) + pan.y
    };
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (contextMenu) setContextMenu(null);
    if (e.target.classList.contains('canvas-grid') || e.target.classList.contains('canvas-wrapper')) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNodeId !== null) {
      const updatedNodes = nodes.map((node) => {
        if (node.id === draggingNodeId) {
          const rawX = (e.clientX - pan.x) / zoom - nodeOffset.x;
          const rawY = (e.clientY - pan.y) / zoom - nodeOffset.y;
          const snappedX = Math.round(rawX / 16) * 16;
          const snappedY = Math.round(rawY / 16) * 16;
          return { ...node, x: Math.max(10, snappedX), y: Math.max(10, snappedY) };
        }
        return node;
      });
      onUpdateNodes(updatedNodes);
    } else if (drawingConnection !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDrawingConnection({
        ...drawingConnection,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
    setDrawingConnection(null);
  };

  // Zoom with Wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(1.8, Math.max(0.45, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (contextMenu) setContextMenu(null);
    onSelectNode(nodeId);
    if (executionState === 'running') return;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setNodeOffset({
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y
    });
  };

  // Connection Drag Handlers
  const handlePortMouseDown = (e, nodeId, isOutput) => {
    e.stopPropagation();
    if (executionState === 'running') return;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const portCoords = isOutput ? getOutputPortCoords(node) : getInputPortCoords(node);

    setDrawingConnection({
      fromNodeId: nodeId,
      startX: portCoords.x,
      startY: portCoords.y,
      currentX: portCoords.x,
      currentY: portCoords.y
    });
  };

  const handlePortMouseUp = (e, targetNodeId, isInput) => {
    e.stopPropagation();
    if (drawingConnection && isInput && drawingConnection.fromNodeId !== targetNodeId) {
      const exists = connections.some(
        (c) => (c.fromNode || c.from) === drawingConnection.fromNodeId && (c.toNode || c.to) === targetNodeId
      );

      if (!exists) {
        const newConnections = [
          ...connections,
          {
            id: `conn-${Date.now()}`,
            fromNode: drawingConnection.fromNodeId,
            toNode: targetNodeId
          }
        ];
        onUpdateConnections(newConnections);
      }
    }
    setDrawingConnection(null);
  };

  const deleteConnection = (id) => {
    if (executionState === 'running') return;
    onUpdateConnections(connections.filter((c) => c.id !== id));
  };

  // Right-click context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const canvasX = Math.round((clickX - pan.x) / zoom);
    const canvasY = Math.round((clickY - pan.y) / zoom);

    setContextMenu({
      clientX: e.clientX,
      clientY: e.clientY,
      canvasX: Math.max(20, canvasX),
      canvasY: Math.max(20, canvasY)
    });
  };

  // Feature Drop handling onto agent node
  const handleNodeDragOver = (e, nodeId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverNodeId !== nodeId) {
      setDragOverNodeId(nodeId);
    }
  };

  const handleNodeDragLeave = (e, nodeId) => {
    if (dragOverNodeId === nodeId) {
      setDragOverNodeId(null);
    }
  };

  const handleNodeDrop = (e, nodeId) => {
    e.preventDefault();
    setDragOverNodeId(null);
    const rawData = e.dataTransfer.getData('application/agentverse-feature');
    if (!rawData) return;

    try {
      const feature = JSON.parse(rawData);
      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          const currentCaps = node.capabilities || [];
          if (!currentCaps.some((c) => (typeof c === 'string' ? c === feature.id : c.id === feature.id))) {
            return {
              ...node,
              capabilities: [...currentCaps, feature]
            };
          }
        }
        return node;
      });
      onUpdateNodes(updatedNodes);
    } catch (err) {
      console.error('Failed to attach feature to node:', err);
    }
  };

  const handleRemoveCapability = (e, nodeId, capId) => {
    e.stopPropagation();
    const updatedNodes = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          capabilities: (node.capabilities || []).filter((c) => (typeof c === 'string' ? c !== capId : c.id !== capId))
        };
      }
      return node;
    });
    onUpdateNodes(updatedNodes);
  };

  // SVG bezier curve generator
  const getBezierPath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Center canvas view
  const handleResetView = () => {
    setPan({ x: 50, y: 50 });
    setZoom(1.0);
  };

  return (
    <div
      ref={canvasRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      {/* Background blueprint grid */}
      <div
        className="canvas-grid"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`
        }}
      />

      {/* Floating Canvas Controls HUD */}
      <div className="canvas-hud">
        <button className="hud-btn" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))} title="Zoom In (+)">
          +
        </button>
        <span className="hud-zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="hud-btn" onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))} title="Zoom Out (-)">
          -
        </button>
        <button className="hud-btn" onClick={handleResetView} title="Reset View (100%)">
          ⟲
        </button>
      </div>

      {/* SVG Connections Layer */}
      <svg className="connections-layer">
        <defs>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>

        {connections.map((conn) => {
          const fromNode = nodes.find((n) => n.id === (conn.fromNode || conn.from));
          const toNode = nodes.find((n) => n.id === (conn.toNode || conn.to));

          if (!fromNode || !toNode) return null;

          const p1 = getOutputPortCoords(fromNode);
          const p2 = getInputPortCoords(toNode);

          const isFlowing =
            executionState === 'running' &&
            activeNodeId === toNode.id &&
            completedNodeIds.includes(fromNode.id);

          const isCompleted =
            completedNodeIds.includes(fromNode.id) &&
            completedNodeIds.includes(toNode.id);

          return (
            <g key={conn.id} className="connection-group">
              <path
                d={getBezierPath(p1.x, p1.y, p2.x, p2.y)}
                fill="none"
                stroke="transparent"
                strokeWidth="14"
                cursor="pointer"
                onClick={() => deleteConnection(conn.id)}
              />
              <path
                d={getBezierPath(p1.x, p1.y, p2.x, p2.y)}
                className={`connection-line ${isFlowing ? 'active-flow' : ''} ${isCompleted ? 'success-flow' : ''}`}
                strokeWidth={isFlowing ? 2.5 : 1.75}
                onClick={() => deleteConnection(conn.id)}
                title="Click line to disconnect"
              />
            </g>
          );
        })}

        {/* Temporary line drawn during connection creation */}
        {drawingConnection && (
          <path
            d={getBezierPath(
              drawingConnection.startX,
              drawingConnection.startY,
              drawingConnection.currentX,
              drawingConnection.currentY
            )}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
            strokeDasharray="5, 5"
          />
        )}
      </svg>

      {/* Nodes Container */}
      <div
        className="nodes-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map((node) => {
          const isActive = activeNodeId === node.id;
          const isCompleted = completedNodeIds.includes(node.id);
          const isDropTarget = dragOverNodeId === node.id;
          const isSelected = node.id === selectedNodeId;
          const isHITL = node.role === 'approval' || (node.capabilities || []).some((c) => (c.id || c) === 'human_approval');

          let nodeClass = 'canvas-node';
          if (isActive) nodeClass += ' active-node';
          if (isCompleted) nodeClass += ' success-node';
          if (isSelected) nodeClass += ' selected';
          if (isDropTarget) nodeClass += ' drop-target';
          if (isHITL) nodeClass += ' node-hitl';

          const capabilities = node.capabilities || [];

          return (
            <div
              key={node.id}
              className={nodeClass}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${NODE_WIDTH}px`
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDragOver={(e) => handleNodeDragOver(e, node.id)}
              onDragLeave={(e) => handleNodeDragLeave(e, node.id)}
              onDrop={(e) => handleNodeDrop(e, node.id)}
            >
              {/* Node Header */}
              <div className="canvas-node-header">
                <div className="node-title-group">
                  <span className={`status-indicator ${isActive ? 'active' : isCompleted ? 'done' : 'idle'}`} />
                  <span className="node-name">{node.name}</span>
                </div>
                <span className={`role-badge role-${node.role}`}>
                  {node.role === 'approval' ? '🛡️ HITL' : node.role}
                </span>
              </div>

              {/* Node Body */}
              <div className="canvas-node-body">
                <div className="node-model-label">
                  <span>{node.model || 'Qwen 3.8'}</span>
                  <span className="node-temp">T:{node.temperature ?? 0.0}</span>
                </div>

                {/* Capability Chips Attached via Drag-and-Drop */}
                {capabilities.length > 0 && (
                  <div className="node-capabilities-wrap">
                    {capabilities.map((cap) => {
                      const capId = typeof cap === 'string' ? cap : cap.id;
                      const capName = typeof cap === 'string' ? cap : cap.badge || cap.name;
                      const capIcon = typeof cap === 'string' ? '⚡' : cap.icon || '⚡';
                      return (
                        <span key={capId} className="node-cap-chip" title={capName}>
                          <span className="cap-icon">{capIcon}</span>
                          <span className="cap-name">{capName}</span>
                          <button
                            className="cap-remove-btn"
                            onClick={(e) => handleRemoveCapability(e, node.id, capId)}
                            title="Remove capability"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Drop instruction placeholder */}
                {isDropTarget && (
                  <div className="drop-target-hint">
                    <span>+ Drop Capability Here</span>
                  </div>
                )}
              </div>

              {/* Input & Output Ports */}
              {node.role !== 'input' && (
                <div
                  className="port port-input"
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, false)}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, true)}
                  title="Connect from previous agent"
                />
              )}
              {node.role !== 'output' && (
                <div
                  className="port port-output"
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, true)}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, false)}
                  title="Connect to next agent"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="canvas-context-menu"
          style={{ left: contextMenu.clientX, top: contextMenu.clientY }}
        >
          <div className="context-menu-title">Canvas Actions</div>
          <button
            className="context-item"
            onClick={() => {
              if (onAddCustomNode) {
                onAddCustomNode('worker', contextMenu.canvasX, contextMenu.canvasY);
              }
              setContextMenu(null);
            }}
          >
            <span>🤖 Add Agent Node</span>
          </button>
          <button
            className="context-item"
            onClick={() => {
              if (onAddCustomNode) {
                onAddCustomNode('approval', contextMenu.canvasX, contextMenu.canvasY);
              }
              setContextMenu(null);
            }}
          >
            <span>🛡️ Add HITL Approval Node</span>
          </button>
          <button
            className="context-item"
            onClick={() => {
              if (onAddCustomNode) {
                onAddCustomNode('evaluator', contextMenu.canvasX, contextMenu.canvasY);
              }
              setContextMenu(null);
            }}
          >
            <span>🔍 Add Evaluator Node</span>
          </button>
          <div className="context-divider" />
          <button className="context-item" onClick={handleResetView}>
            <span>⟲ Reset Zoom & Pan</span>
          </button>
        </div>
      )}
    </div>
  );
}
