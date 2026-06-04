import { Panel } from '../shared/Panel';
import { Search, Network, Globe } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export function AdvancedPanel() {
  const { selectedAgent, isBackendOffline } = useDashboard();

  return (
    <div className="flex-col gap-6">
      <Panel title="Forensic Provenance Explorer" icon={<Search size={18} />}>
        {isBackendOffline ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            Oracle Database Offline. Cannot fetch provenance records.
          </div>
        ) : !selectedAgent ? (
          <div className="text-muted">Select an agent</div>
        ) : (
          <div className="flex-col gap-4">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Immutable audit trail of agent decisions and state changes.
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Action</th><th>Model</th><th>Input Hash</th><th>Output Hash</th><th>Time</th></tr></thead>
                <tbody>
                  <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No provenance records found</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Advanced Contract Markets" icon={<Globe size={18} />}>
          <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)', gap: 'var(--space-2)' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Fractional Contract Ownership</span>
            <span className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', padding: '0 var(--space-4)' }}>
              Visualizing Collateralized Debt Positions (CDPs) and yield derivatives derived from agent-owned contracts.
            </span>
          </div>
        </Panel>

        <Panel title="A2A Liquidity Topology" icon={<Network size={18} />}>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted">Graph visualization requires Oracle backend sync.</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
