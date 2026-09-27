import React from 'react';

export const DraggableFeatureCard = ({ feature }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/agentverse-feature', JSON.stringify(feature));
    e.dataTransfer.effectAllowed = 'copy';
    // Visual drag image effect
    if (e.target) {
      e.target.classList.add('dragging');
    }
  };

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.classList.remove('dragging');
    }
  };

  return (
    <div
      className={`feature-card feature-category-${feature.category}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={`Drag onto any agent node to attach ${feature.name}`}
    >
      <div className="feature-card-header">
        <span className="feature-icon">{feature.icon}</span>
        <span className="feature-name">{feature.name}</span>
        <span className="feature-badge">{feature.badge}</span>
      </div>
      <p className="feature-desc">{feature.description}</p>
      <div className="feature-drag-hint">
        <span>⠿ Drag to Agent</span>
      </div>
    </div>
  );
};
