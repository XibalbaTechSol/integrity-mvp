import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, EyeOff, Loader2, Plus, RefreshCw, Search, Shield, Terminal, Trash2, Users } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { bccMiddleware } from '../services/bccMiddleware';
import { oracle, type AuditLogEntryDto, type UnregisteredAgentDto } from '../services/oracle';
import { SHIELD_BACKEND_TOKEN } from '../config';
import { shieldBackend, type ShieldDashboardSummary, type ShieldDecision, type ShieldDevice } from '../services/shieldBackend';
import { ShieldEvidenceGraph } from '../components/ShieldEvidenceGraph';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
    return <span className={`shield-badge ${tone}`}>{children}</span>;
}

function actionOf(item: ShieldDecision) { return String((item.decision.decision as { action?: string } | undefined)?.action ?? 'unknown'); }
function decisionTone(action: string): 'good' | 'warn' | 'bad' | 'neutral' { return action === 'allow' || action === 'log_only' ? 'good' : action === 'deny' ? 'bad' : action === 'escalate' ? 'warn' : 'neutral'; }

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
    return <div className="shield-metric"><span>{label}</span><strong className={tone}>{value}</strong></div>;
}

function DeviceTable({ devices }: { devices: ShieldDevice[] }) {
    return <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Device</th><th>Role</th><th>Policy</th><th>Last seen</th></tr></thead><tbody>{devices.length === 0 ? <tr><td colSpan={4} className="shield-muted">No devices enrolled.</td></tr> : devices.map((device) => <tr key={`${device.tenant_id}:${device.device_id}`}><td><strong>{device.device_id}</strong><small>{device.agent_label}</small></td><td>{device.device_role || 'unassigned'}</td><td><span>{device.policy_version || 'none'}</span><code>{device.policy_hash || ''}</code></td><td>{device.last_seen_at || 'n/a'}</td></tr>)}</tbody></table></div>;
}

function DecisionTable({ decisions }: { decisions: ShieldDecision[] }) {
    return <div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Action</th><th>Rule</th><th>Event class</th><th>Export</th><th>Received</th></tr></thead><tbody>{decisions.length === 0 ? <tr><td colSpan={5} className="shield-muted">No backend decisions recorded.</td></tr> : decisions.map((item, index) => { const decision = item.decision; const action = actionOf(item); const rule = decision.rule as { rule_id?: string } | undefined; const event = decision.event_ref as { class?: string } | undefined; const exportInfo = decision.export as { decision_exported?: boolean; authorized?: boolean } | undefined; return <tr key={`${item.received_at}-${index}`}><td><Badge tone={decisionTone(action)}>{action}</Badge>{decision.synthetic === true && <small>synthetic</small>}</td><td>{rule?.rule_id || 'no rule'}</td><td>{event?.class || String(decision.class || 'unknown')}</td><td>{exportInfo?.decision_exported || exportInfo?.authorized ? <Badge tone="good">ok</Badge> : <Badge tone="warn">gap</Badge>}</td><td>{item.received_at}</td></tr>; })}</tbody></table></div>;
}

function EnrollDeviceModal({ tenantId, adminToken, onClose, onSuccess }: { tenantId: string; adminToken: string; onClose: () => void; onSuccess: () => void }) {
    const [deviceId, setDeviceId] = useState('');
    const [deviceRole, setDeviceRole] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await shieldBackend.enrollDevice({ tenant_id: tenantId, device_id: deviceId, device_role: deviceRole }, adminToken);
            onSuccess();
        } catch (err) {
            setError(String(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Enroll Device</h3>
                {error && <div style={{ color: 'var(--bad-color, #ef4444)', fontSize: '0.875rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Tenant ID
                        <input value={tenantId} readOnly style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-secondary)' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Device ID
                        <input value={deviceId} onChange={e => setDeviceId(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Device Role
                        <input value={deviceRole} onChange={e => setDeviceRole(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} className="shield-small-button">Cancel</button>
                        <button type="submit" disabled={submitting} className="shield-primary-button">{submitting ? 'Enrolling...' : 'Enroll'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddIntegrationModal({ tenantId, adminToken, onClose, onSuccess }: { tenantId: string; adminToken: string; onClose: () => void; onSuccess: () => void }) {
    const [kind, setKind] = useState('webhook');
    const [config, setConfig] = useState('{}');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            let parsedConfig = {};
            try { parsedConfig = JSON.parse(config); } catch (err) { throw new Error('Invalid JSON config'); }
            await shieldBackend.putIntegration({ tenant_id: tenantId, kind, config: parsedConfig }, adminToken);
            onSuccess();
        } catch (err) {
            setError(String(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Add Integration</h3>
                {error && <div style={{ color: 'var(--bad-color, #ef4444)', fontSize: '0.875rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Tenant ID
                        <input value={tenantId} readOnly style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-secondary)' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Kind
                        <select value={kind} onChange={e => setKind(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                            <option value="webhook">Webhook</option>
                            <option value="siem">SIEM</option>
                            <option value="custom">Custom</option>
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        Config (JSON)
                        <textarea value={config} onChange={e => setConfig(e.target.value)} required rows={4} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button type="button" onClick={onClose} className="shield-small-button">Cancel</button>
                        <button type="submit" disabled={submitting} className="shield-primary-button">{submitting ? 'Adding...' : 'Add'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ShieldPage() {
    const { selectedAgent, agents } = useDashboard();
    const [tenantId, setTenantId] = useState('demo-tenant');
    const [adminToken, setAdminToken] = useState(SHIELD_BACKEND_TOKEN);
    const [summary, setSummary] = useState<ShieldDashboardSummary | null>(null);
    const [backendOnline, setBackendOnline] = useState(false);
    const [backendError, setBackendError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
    const [unregistered, setUnregistered] = useState<UnregisteredAgentDto[]>([]);
    const [scanning, setScanning] = useState(true);
    const [allowlist, setAllowlist] = useState<string[]>([]);
    const [allowlistLoading, setAllowlistLoading] = useState(true);
    const [newAllowlistAgent, setNewAllowlistAgent] = useState('');
    const [allowlistBusy, setAllowlistBusy] = useState(false);
    const [allowlistError, setAllowlistError] = useState<string | null>(null);
    const [graphBackground, setGraphBackground] = useState<'light' | 'dark' | 'plain' | 'blueprint'>('light');
    const [graphEdgeType, setGraphEdgeType] = useState('all');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showIntegrationModal, setShowIntegrationModal] = useState(false);

    const refreshBackend = async () => {
        setRefreshing(true); setBackendError(null);
        try { const health = await shieldBackend.health(); setBackendOnline(health.ok); setSummary(await shieldBackend.dashboardSummary(tenantId, adminToken)); }
        catch (error) { setBackendOnline(false); setSummary(null); setBackendError(String(error)); }
        finally { setRefreshing(false); }
    };
    useEffect(() => { void refreshBackend(); }, [tenantId, adminToken]);
    useEffect(() => { let active = true; oracle.getAuditLog(undefined, 50).then((items) => { if (active) setLogs(items); }).catch(() => setLogs([])); return () => { active = false; }; }, []);
    const runScan = () => { setScanning(true); oracle.getUnregisteredAgents().then(setUnregistered).catch(() => setUnregistered([])).finally(() => setScanning(false)); };
    useEffect(() => { runScan(); }, []);
    const refreshAllowlist = () => { setAllowlistLoading(true); bccMiddleware.getClinicalAllowlist().then((result) => setAllowlist(result.agents)).catch(() => setAllowlist([])).finally(() => setAllowlistLoading(false)); };
    useEffect(() => { refreshAllowlist(); }, []);
    const addToAllowlist = async () => { const did = newAllowlistAgent.trim(); if (!did || allowlist.includes(did)) return; setAllowlistBusy(true); setAllowlistError(null); try { const next = [...allowlist, did]; await bccMiddleware.setClinicalAllowlist(next); setAllowlist(next); setNewAllowlistAgent(''); } catch (error) { setAllowlistError(String(error)); } finally { setAllowlistBusy(false); } };
    const removeFromAllowlist = async (did: string) => { setAllowlistBusy(true); setAllowlistError(null); try { const next = allowlist.filter((item) => item !== did); await bccMiddleware.setClinicalAllowlist(next); setAllowlist(next); } catch (error) { setAllowlistError(String(error)); } finally { setAllowlistBusy(false); } };
    const seedDemo = async () => { try { await shieldBackend.seedDemo({ tenant_id: tenantId }, adminToken); await refreshBackend(); } catch (error) { setBackendError(String(error)); } };
    const counts = summary?.decisions_by_action ?? {};
    const injectionCount = logs.filter((log) => /inject/i.test(log.event_type)).length;
    const policyDenials = logs.filter((log) => log.decision === 'DENY').length;
    const latestDecisions = useMemo(() => summary?.latest_decisions ?? [], [summary]);

    return <div className="shield-page"><header className="shield-header"><div className="shield-title"><Shield size={25} /><div><span className="shield-eyebrow">Endpoint enforcement and evidence</span><h1>Xibalba Shield</h1></div></div><div className="shield-toolbar"><button className="shield-small-button" onClick={() => setShowEnrollModal(true)} type="button"><Plus size={14} /> Enroll Device</button><button className="shield-small-button" onClick={() => setShowIntegrationModal(true)} type="button"><Plus size={14} /> Add Integration</button><label>Tenant<input value={tenantId} onChange={(event) => setTenantId(event.target.value)} /></label><label>Admin token<input type="password" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} /></label><button className="shield-icon-button" onClick={() => void refreshBackend()} type="button" title="Refresh Shield backend" aria-label="Refresh Shield backend"><RefreshCw size={16} className={refreshing ? 'shield-spin' : ''} /></button><button className="shield-primary-button" onClick={() => void seedDemo()} type="button"><Database size={15} /> Seed demo</button></div></header>{backendError && <div className="shield-api-banner"><AlertTriangle size={16} /> Backend unavailable <span>{backendError}</span></div>}<section className="shield-status-strip"><Badge tone={backendOnline ? 'good' : 'bad'}>{backendOnline ? 'Shield backend connected' : 'Shield backend unavailable'}</Badge><span>Local enforcement remains authoritative; backend is dashboard and evidence propagation.</span></section><main className="shield-content"><section className="shield-metrics"><Metric label="Devices" value={summary?.device_count ?? 0} /><Metric label="Allows" value={counts.allow ?? 0} tone="good" /><Metric label="Denies" value={counts.deny ?? 0} tone="bad" /><Metric label="Escalations" value={counts.escalate ?? 0} tone="warn" /><Metric label="Oracle injections" value={injectionCount} /><Metric label="Audit denials" value={policyDenials} tone="bad" /></section><section className="shield-grid-two"><div className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">Fleet inventory</span><h2>Devices</h2></div><Badge>{summary?.device_count ?? 0} enrolled</Badge></div><DeviceTable devices={summary?.devices ?? []} /></div><div className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">Policy outcomes</span><h2>Decision log</h2></div><Badge>{latestDecisions.length} latest</Badge></div><DecisionTable decisions={latestDecisions} /></div></section><section className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">Tenant to evidence flow</span><h2>Evidence graph</h2></div><div className="shield-graph-controls"><select value={graphBackground} onChange={(event) => setGraphBackground(event.target.value as typeof graphBackground)}><option value="light">Light grid</option><option value="dark">Dark grid</option><option value="plain">Plain</option><option value="blueprint">Blueprint</option></select><select value={graphEdgeType} onChange={(event) => setGraphEdgeType(event.target.value)}><option value="all">All connections</option><option value="enrollment">Enrollment</option><option value="policy">Policy</option><option value="decision">Decision</option><option value="export">Export</option><option value="integration">Integration</option><option value="metrics">Metrics</option></select></div></div><ShieldEvidenceGraph summary={summary} background={graphBackground} edgeType={graphEdgeType} /></section><section className="shield-grid-three"><div className="shield-panel"><div className="shield-panel-heading"><h2>Burn-in metrics</h2></div>{summary?.latest_metrics ? <pre className="shield-metrics-code">{JSON.stringify(summary.latest_metrics, null, 2)}</pre> : <p className="shield-muted">No metrics reported.</p>}</div><div className="shield-panel"><div className="shield-panel-heading"><h2>Exporter status</h2></div>{(summary?.exporter_status ?? []).length === 0 ? <p className="shield-muted">No exporter status reported.</p> : summary?.exporter_status.map((item) => <div className="shield-status-row" key={item.device_id}><strong>{item.device_id}</strong><Badge tone={item.status.did_registered === true ? 'good' : 'warn'}>{item.status.did_registered === true ? 'registered' : 'not registered'}</Badge><small>{String(item.status.oracle_readback ?? 'not checked')}</small></div>)}</div><div className="shield-panel"><div className="shield-panel-heading"><h2>Integrations</h2></div>{(summary?.integrations ?? []).length === 0 ? <p className="shield-muted">No integrations configured.</p> : summary?.integrations.map((integration) => <div className="shield-status-row" key={integration.integration_id}><strong>{integration.integration_id}</strong><Badge>{integration.kind}</Badge><small>{integration.created_at}</small></div>)}</div></section><section className="shield-grid-two"><div className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">Oracle evidence feed</span><h2>Shadow AI discovery</h2></div><button className="shield-small-button" onClick={runScan} disabled={scanning} type="button"><Search size={14} /> {scanning ? 'Scanning' : 'Refresh'}</button></div>{scanning ? <div className="shield-empty"><Loader2 className="shield-spin" size={22} /> Scanning oracle evidence</div> : unregistered.length === 0 ? <div className="shield-empty good"><CheckCircle2 size={22} /> No unregistered agents detected</div> : <div className="shield-list">{unregistered.slice(0, 25).map((item) => <div className="shield-list-row" key={`${item.source}-${item.agent_id}`}><strong>{item.agent_id}</strong><small>{item.source} · {item.first_seen}</small></div>)}</div>}</div><div className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">BCC runtime policy</span><h2>Clinical allowlist</h2></div><Badge>{allowlist.length} agents</Badge></div>{allowlistLoading ? <p className="shield-muted">Loading allowlist.</p> : <div className="shield-list">{allowlist.map((did) => <div className="shield-list-row" key={did}><code>{did}</code><button className="shield-icon-button" disabled={allowlistBusy} onClick={() => void removeFromAllowlist(did)} type="button" title="Remove from allowlist" aria-label={`Remove ${did}`}><Trash2 size={14} /></button></div>)}{allowlist.length === 0 && <p className="shield-muted">No agents on the runtime allowlist.</p>}</div>}<div className="shield-add-row"><input value={newAllowlistAgent} onChange={(event) => setNewAllowlistAgent(event.target.value)} placeholder="did:integrity:..." /><button className="shield-small-button" disabled={allowlistBusy || !newAllowlistAgent.trim()} onClick={() => void addToAllowlist()} type="button"><Plus size={14} /> Add</button></div>{allowlistError && <p className="shield-error">{allowlistError}</p>}</div></section><section className="shield-panel"><div className="shield-panel-heading"><div><span className="shield-eyebrow">Current MVP identity view</span><h2>NHI access governance</h2></div><Badge>{agents.length} Oracle agents</Badge></div><div className="shield-table-wrap"><table className="shield-table"><thead><tr><th>Agent</th><th>DID</th><th>Tier</th><th>Status</th></tr></thead><tbody>{agents.length === 0 ? <tr><td colSpan={4} className="shield-muted">No agents registered on this network.</td></tr> : agents.map((agent) => <tr key={agent.id}><td><strong className={agent.id === selectedAgent?.id ? 'shield-accent' : ''}>{agent.alias || agent.name || agent.id}</strong></td><td><code>{agent.id.slice(0, 24)}...</code></td><td>{agent.verification_tier}</td><td><Badge tone="good">active</Badge></td></tr>)}</tbody></table></div></section></main>{showEnrollModal && <EnrollDeviceModal tenantId={tenantId} adminToken={adminToken} onClose={() => setShowEnrollModal(false)} onSuccess={() => { setShowEnrollModal(false); void refreshBackend(); }} />}{showIntegrationModal && <AddIntegrationModal tenantId={tenantId} adminToken={adminToken} onClose={() => setShowIntegrationModal(false)} onSuccess={() => { setShowIntegrationModal(false); void refreshBackend(); }} />}</div>;
}
