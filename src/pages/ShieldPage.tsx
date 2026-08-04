import { useEffect, useState } from 'react';
import { ShieldAlert, Terminal, EyeOff, AlertTriangle, CheckCircle, Search, Users, Loader2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { oracle, AuditLogEntryDto, UnregisteredAgentDto } from '../services/oracle';
import { SeededDataBadge } from '../components/shared/SeededDataBadge';

const UNREGISTERED_DISPLAY_LIMIT = 25;

export default function ShieldPage() {
  const { selectedAgent, agents } = useDashboard();
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [unregistered, setUnregistered] = useState<UnregisteredAgentDto[]>([]);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Global feed (no agentId) so this reflects the whole protected fleet, not just
    // the currently selected agent — matches the "Network Security Status" framing.
    oracle.getAuditLog(undefined, 50)
      .then(r => { if (active) setLogs(r); })
      .catch(() => { if (active) setLogs([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const runScan = () => {
    setScanning(true);
    oracle.getUnregisteredAgents()
      .then(r => setUnregistered(r))
      .catch(() => setUnregistered([]))
      .finally(() => setScanning(false));
  };

  useEffect(() => { runScan(); }, []);

  const denyCount = logs.filter(l => l.decision === 'DENY').length;
  const injectionCount = logs.filter(l => /inject/i.test(l.event_type)).length;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h2>Xibalba Shield</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Agent Security Platform, Runtime Threat Detection, and NHI Governance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Network Security Status</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4caf50', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} /> Operational
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Injection-Type Events (Audit Log)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{loading ? '—' : injectionCount}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Policy Denials (bcc_middleware)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f44336' }}>{loading ? '—' : denyCount}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registered Agents</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{agents.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Forensics & Audit Logs */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} /> Forensics & Audit Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '480px', overflowY: 'auto' }}>
            {logs.length === 0 && !loading && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No audit events recorded yet.</div>
            )}
            {logs.map((log) => (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '4px', borderLeft: `4px solid ${log.decision === 'DENY' ? '#f44336' : '#2196f3'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px',
                      background: log.decision === 'DENY' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                      color: log.decision === 'DENY' ? '#f44336' : '#2196f3'
                    }}>
                      {log.decision}
                    </span>
                  </div>
                  {log.decision === 'DENY' && <span style={{ fontSize: '0.75rem', color: '#f44336', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldAlert size={14} /> BLOCKED</span>}
                </div>
                <div style={{ fontSize: '0.95rem' }}>{log.event_type} {log.reason_code ? `— ${log.reason_code}` : ''}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Source: {log.source}{log.agent_id ? ` · Agent: ${log.agent_id}` : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Shadow AI Discovery & Network Scanner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <EyeOff size={18} /> Shadow AI Discovery
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Real detection: DIDs with telemetry or policy-decision evidence in the oracle's <code>otel_spans</code>/<code>audit_log</code> tables that never registered via <code>POST /v1/agent/register</code>. Not literal network scanning — see PRODUCTION_GAPS.md for scope.
            </p>
            {scanning ? (
              <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '4px', textAlign: 'center' }}>
                <Loader2 size={24} className="pulse" style={{ marginBottom: '0.5rem', color: 'var(--theme-accent)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Scanning…</div>
              </div>
            ) : unregistered.length === 0 ? (
              <div style={{ padding: '1rem', border: '1px dashed #4caf50', borderRadius: '4px', textAlign: 'center', background: 'rgba(76, 175, 80, 0.05)' }}>
                <CheckCircle size={24} color="#4caf50" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600, color: '#4caf50' }}>No unregistered agents detected.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {unregistered.slice(0, UNREGISTERED_DISPLAY_LIMIT).map((u) => (
                  <div key={`${u.source}-${u.agent_id}`} style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-color)', borderRadius: '4px', borderLeft: '3px solid #f59e0b', fontSize: '0.8rem' }}>
                    <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{u.agent_id}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>First seen {new Date(u.first_seen).toLocaleString()} via {u.source}</div>
                  </div>
                ))}
                {unregistered.length > UNREGISTERED_DISPLAY_LIMIT && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center' }}>
                    +{unregistered.length - UNREGISTERED_DISPLAY_LIMIT} more not shown
                  </div>
                )}
              </div>
            )}
            <button className="button" onClick={runScan} disabled={scanning} style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {scanning ? <Loader2 size={16} className="pulse" /> : <Search size={16} />}
              {scanning ? 'Scanning...' : 'Refresh Scan'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} /> Policy Rules <SeededDataBadge label="No policy-config API yet" />
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <input type="checkbox" defaultChecked disabled /> Auto-block unverified DIDs
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <input type="checkbox" defaultChecked disabled /> Require ZK-Proof on API ingress
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <input type="checkbox" defaultChecked disabled /> Block external LLM telemetry
              </label>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }} className="card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> NHI & Access Governance
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Real registered agents on this network (via <code>oracle.listAgents()</code>). Per-agent data-access/network-egress policy display is not backed by a live endpoint yet.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 0' }}>Agent Name</th>
              <th style={{ padding: '0.75rem 0' }}>DID</th>
              <th style={{ padding: '0.75rem 0' }}>Verification Tier</th>
              <th style={{ padding: '0.75rem 0' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>No agents registered on this network.</td></tr>
            ) : agents.map((agent) => {
              const active = agent.id === selectedAgent?.id;
              return (
                <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: active ? 600 : 400, color: active ? 'var(--theme-accent)' : 'inherit' }}>{agent.alias || agent.name || agent.id}</td>
                  <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{agent.id.substring(0, 20)}...</td>
                  <td style={{ padding: '1rem 0' }}>{agent.verification_tier}</td>
                  <td style={{ padding: '1rem 0', color: '#4caf50' }}>Active</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
