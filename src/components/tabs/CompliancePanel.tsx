import { Panel } from '../shared/Panel';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export function CompliancePanel() {
  const { selectedAgent, isBackendOffline } = useDashboard();
  
  // Without backend, we have no score to display
  const score = null; 
  const events: any[] = [];

  return (
    <div className="grid-cols-2">
      <Panel title="Compliance Scorecard" icon={<ShieldCheck size={18} />}>
        {isBackendOffline ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            Oracle Database Offline. Cannot fetch compliance metrics.
          </div>
        ) : !selectedAgent ? (
          <div className="text-muted">Select an agent</div>
        ) : !score ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            No compliance data available for this agent.
          </div>
        ) : (
          <div className="flex-col gap-4">
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
                100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Rating</div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Audit Trail & Alerts" icon={<AlertTriangle size={18} />}>
        {isBackendOffline ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            Oracle Database Offline. Cannot fetch audit trail.
          </div>
        ) : events.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            No recent compliance events found.
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
