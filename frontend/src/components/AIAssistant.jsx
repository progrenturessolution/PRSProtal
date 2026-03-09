import { useMemo, useState } from "react";
import "./AIAssistant.css";

const quickActions = [
  { id: "tasks", label: "Open Pending Tasks", section: "tasks", taskView: "individual" },
  { id: "assessments", label: "Go To Assessments", section: "assessments" },
  { id: "documents", label: "View Certificates", section: "documents" },
  { id: "notifications", label: "Check Notifications", section: "notifications" },
  { id: "jobs", label: "Job Updates", section: "jobs" },
];

function SnapshotItem({ label, value, tone }) {
  return (
    <div className={`copilot-snapshot-item copilot-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function AIAssistant({ onAction, onRefreshData, currentSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");

  const greeting = useMemo(() => {
    if (!snapshot?.name) return "Need a hand with your internship workflow?";
    return `Hi ${snapshot.name}, ready to continue your progress?`;
  }, [snapshot]);

  const refreshSnapshot = async () => {
    try {
      setIsRefreshing(true);
      setError("");
      const nextSnapshot = await onRefreshData();
      setSnapshot(nextSnapshot);
    } catch (err) {
      console.error("Assistant refresh failed:", err);
      setError("Could not refresh right now. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAction = async (action) => {
    try {
      setError("");
      await onAction(action);
    } catch (err) {
      console.error("Assistant action failed:", err);
      setError("Action could not be completed.");
    }
  };

  return (
    <div className="copilot-assistant-wrap">
      {isOpen && (
        <section className="copilot-assistant-panel" aria-label="AI Assistant panel">
          <header className="copilot-assistant-head">
            <div>
              <p className="copilot-kicker">GitHub Copilot</p>
              <h3>Intern Assistant</h3>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="copilot-close-btn">
              Close
            </button>
          </header>

          <p className="copilot-greeting">{greeting}</p>

          <div className="copilot-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`copilot-action-btn ${currentSection === action.section ? "active" : ""}`}
                onClick={() => handleAction(action)}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="copilot-refresh-row">
            <button type="button" className="copilot-refresh-btn" onClick={refreshSnapshot} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh My Live Data"}
            </button>
          </div>

          {snapshot && (
            <div className="copilot-snapshot-grid">
              <SnapshotItem label="Total Tasks" value={snapshot.totalTasks} tone="neutral" />
              <SnapshotItem label="Pending" value={snapshot.pendingTasks} tone="warning" />
              <SnapshotItem label="Completed" value={snapshot.completedTasks} tone="success" />
              <SnapshotItem label="Notifications" value={snapshot.notifications} tone="info" />
            </div>
          )}

          {error && <p className="copilot-error">{error}</p>}
        </section>
      )}

      <button
        type="button"
        className="copilot-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle assistant"
      >
        {isOpen ? "Hide Assistant" : "Open Assistant"}
      </button>
    </div>
  );
}
