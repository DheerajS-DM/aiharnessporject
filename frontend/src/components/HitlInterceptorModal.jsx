import React, { useState } from 'react';

export const HitlInterceptorModal = ({ pendingApproval, onResolve }) => {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!pendingApproval) return null;

  const handleAction = async (approved) => {
    setSubmitting(true);
    try {
      await fetch(`/api/approval/${pendingApproval.run_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          feedback,
          timestamp: new Date().toISOString()
        })
      });
      onResolve(approved, feedback);
    } catch (err) {
      console.error('Failed to submit approval:', err);
      onResolve(approved, feedback);
    } finally {
      setSubmitting(false);
    }
  };

  const proposed = pendingApproval.proposed_action || {};

  return (
    <div className="hitl-overlay">
      <div className="hitl-modal">
        <div className="hitl-modal-header">
          <div className="hitl-badge">
            <span className="hitl-dot-pulse" />
            <span>HUMAN-IN-THE-LOOP CHECKPOINT</span>
          </div>
          <span className="hitl-run-id">Run ID: {pendingApproval.run_id}</span>
        </div>

        <div className="hitl-modal-body">
          <div className="hitl-agent-info">
            <span className="hitl-agent-avatar">🛡️</span>
            <div>
              <h4>{pendingApproval.nodeName || 'Agent Checkpoint'}</h4>
              <p>{pendingApproval.message || 'Governance review requested before executing downstream actions.'}</p>
            </div>
          </div>

          <div className="hitl-context-card">
            <div className="hitl-card-title">Proposed Action & Context</div>
            <pre className="hitl-json-view">
              {JSON.stringify(proposed, null, 2)}
            </pre>
          </div>

          <div className="hitl-feedback-group">
            <label>Operator Guidance / Constraints (Optional):</label>
            <textarea
              className="hitl-textarea"
              placeholder="e.g. Ensure risk parameters do not exceed 5% allocation limits..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <div className="hitl-modal-footer">
          <button
            className="hitl-btn reject"
            disabled={submitting}
            onClick={() => handleAction(false)}
          >
            ❌ Reject & Stop
          </button>
          <button
            className="hitl-btn approve"
            disabled={submitting}
            onClick={() => handleAction(true)}
          >
            ✅ Approve & Resume Execution
          </button>
        </div>
      </div>
    </div>
  );
};
