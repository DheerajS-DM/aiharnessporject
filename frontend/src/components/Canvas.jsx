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
  executionState
}) {
  const canvasRef = useRef(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node dragging state
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Connection dragging state
  const [drawingConnection, setDrawingConnection] = useState(null); // { fromNodeId, startX, startY, currentX, currentY }

  // Constant Node Dimensions
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 80;

  // Calculate Port positions
  const getInputPortCoords = (node) => {
    return {
      x: node.x + pan.x,
      y: node.y + NODE_HEIGHT / 2 + pan.y
    };
  };

  const getOutputPortCoords = (node) => {
    return {
      x: node.x + NODE_WIDTH + pan.x,
      y: node.y + NODE_HEIGHT / 2 + pan.y
    };
  };

  // Drag canvas background pan
  const handleMouseDown = (e) => {
    if (e.target.className === 'canvas-grid') {
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
      const updatedNodes = nodes.map(node => {
        if (node.id === draggingNodeId) {
          // Calculate grid alignment
          const newX = Math.round((e.clientX - pan.x - nodeOffset.x) / 12) * 12;
          const newY = Math.round((e.clientY - pan.y - nodeOffset.y) / 12) * 12;
          return { ...node, x: newX, y: newY };
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

  const handleMouseUp = (e) => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
    setDrawingConnection(null);
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    if (executionState === 'running') return; // Disable editing during execution

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setNodeOffset({
      x: e.clientX - pan.x - node.x,
      y: e.clientY - pan.y - node.y
    });
  };

  // Connection Drag Handlers
  const handlePortMouseDown = (e, nodeId, isOutput) => {
    e.stopPropagation();
    if (executionState === 'running') return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const portCoords = isOutput ? getOutputPortCoords(node) : getInputPortCoords(node);

    setDrawingConnection({
      fromNodeId: nodeId,
      startX: portCoords.x,
      startY: portCoords.y,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    });
  };

  const handlePortMouseUp = (e, targetNodeId, isInput) => {
    e.stopPropagation();
    if (drawingConnection && isInput && drawingConnection.fromNodeId !== targetNodeId) {
      // Create new connection if it doesn't already exist
      const exists = connections.some(
        c => c.fromNode === drawingConnection.fromNodeId && c.toNode === targetNodeId
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
    onUpdateConnections(connections.filter(c => c.id !== id));
  };

  // Helper to calculate SVG bezier curves
  const getBezierPath = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div
      ref={canvasRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Blueprint grid */}
      <div
        className="canvas-grid"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* SVG Connections Layer */}
      <svg className="connections-layer">
        {/* Render connection lines */}
        {connections.map((conn) => {
          const fromNode = nodes.find((n) => n.id === conn.fromNode);
          const toNode = nodes.find((n) => n.id === conn.toNode);

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
            <g key={conn.id} className="connection-group" style={{ pointerEvents: 'visibleStroke' }}>
              {/* Invisible wider path for easier clicking/hovering */}
              <path
                d={getBezierPath(p1.x, p1.y, p2.x, p2.y)}
                fill="none"
                stroke="transparent"
                strokeWidth="10"
                cursor="pointer"
                onClick={() => deleteConnection(conn.id)}
              />
              <path
                d={getBezierPath(p1.x, p1.y, p2.x, p2.y)}
                className={`connection-line ${isFlowing ? 'active-flow' : ''} ${
                  isCompleted ? 'success-flow' : ''
                }`}
                strokeWidth="1.5"
                onClick={() => deleteConnection(conn.id)}
                cursor="pointer"
                title="Click line to delete connection"
              />
            </g>
          );
        })}

        {/* Render temp line being drawn */}
        {drawingConnection && (
          <path
            d={getBezierPath(
              drawingConnection.startX,
              drawingConnection.startY,
              drawingConnection.currentX,
              drawingConnection.currentY
            )}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="1.5"
            strokeDasharray="4, 4"
          />
        )}
      </svg>

      {/* Nodes Layer */}
      {nodes.map((node) => {
        const isActive = activeNodeId === node.id;
        const isCompleted = completedNodeIds.includes(node.id);
        let nodeClass = 'canvas-node';
        if (isActive) nodeClass += ' active-node';
        else if (isCompleted) nodeClass += ' success-node';
        if (node.id === selectedNodeId) nodeClass += ' selected';

        return (
          <div
            key={node.id}
            className={nodeClass}
            style={{
              left: node.x + pan.x,
              top: node.y + pan.y,
              width: `${NODE_WIDTH}px`,
              height: `${NODE_HEIGHT}px`
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          >
            <div
              className="canvas-node-header"
              style={{
                backgroundColor:
                  node.type === 'orchestrator'
                    ? 'rgba(79, 70, 229, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor:
                      isActive
                        ? 'var(--accent-running)'
                        : isCompleted
                        ? 'var(--accent-success)'
                        : 'var(--text-muted)'
                  }}
                />
                {node.name}
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  border: '1px solid var(--border)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--bg)'
                }}
              >
                {node.role}
              </span>
            </div>
            
            <div className="canvas-node-body">
              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {node.model || 'versatile'} | temp: {node.temperature ?? 0.0}
              </div>
            </div>

            {/* Ports */}
            {node.role !== 'input' && (
              <div
                className="port port-input"
                onMouseDown={(e) => handlePortMouseDown(e, node.id, false)}
                onMouseUp={(e) => handlePortMouseUp(e, node.id, true)}
                title="Input Port"
              />
            )}
            {node.role !== 'output' && (
              <div
                className="port port-output"
                onMouseDown={(e) => handlePortMouseDown(e, node.id, true)}
                onMouseUp={(e) => handlePortMouseUp(e, node.id, false)}
                title="Output Port"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
