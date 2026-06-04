import { useState, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import { LineChart, Handshake, Terminal, Zap } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { StatusBadge } from '../shared/StatusBadge';

interface ExecutionLog {
  id: number;
  time: string;
  message: string;
}

interface SimulatedContract {
  id: string;
  counterparty: string;
  type: string;
  status: string;
}

export function MarketsPanel() {
  const { selectedAgent, agents, isBackendOffline } = useDashboard();
  
  // Simulation State
  const [counterparty, setCounterparty] = useState<string>('');
  const [contractTemplate, setContractTemplate] = useState('Data Stream Access');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [activeAgreements, setActiveAgreements] = useState<SimulatedContract[]>(() => {
    const saved = localStorage.getItem('integrity_a2a_agreements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('integrity_a2a_agreements', JSON.stringify(activeAgreements));
  }, [activeAgreements]);

  const availableCounterparties = agents.filter(a => a.eth_address !== selectedAgent?.eth_address);

  // Set default counterparty if none selected
  useEffect(() => {
    if (!counterparty && availableCounterparties.length > 0) {
      setCounterparty(availableCounterparties[0].eth_address);
    }
  }, [availableCounterparties, counterparty]);

  const executeSimulation = async () => {
    if (!selectedAgent || !counterparty) return;
    
    setIsExecuting(true);
    setLogs([]);
    
    const targetAgent = agents.find(a => a.eth_address === counterparty);
    const targetName = targetAgent ? targetAgent.alias : 'Unknown Agent';

    const addLog = (msg: string) => {
      setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), message: msg }]);
    };

    // Simulated Execution Flow
    addLog(`Initiating cryptographic handshake with ${targetName}...`);
    await new Promise(r => setTimeout(r, 800));
    
    addLog(`Counterparty verified via TEE Enclave. Negotiating terms for [${contractTemplate}]...`);
    await new Promise(r => setTimeout(r, 1200));
    
    addLog(`Terms accepted by both autonomous agents. Generating ZK Proof of SLA...`);
    await new Promise(r => setTimeout(r, 1500));
    
    addLog(`ZK Proof verified. Deploying smart contract to L2...`);
    await new Promise(r => setTimeout(r, 1000));
    
    addLog(`SUCCESS: Contract executed and deployed.`);
    
    setActiveAgreements(prev => [{
      id: `0x${Math.floor(Math.random()*16777215).toString(16)}...`,
      counterparty: targetName,
      type: contractTemplate,
      status: 'active'
    }, ...prev]);

    setIsExecuting(false);
  };

  return (
    <div className="flex-col gap-6">
      <Panel title="A2A Contract Simulator" icon={<Zap size={18} />}>
        <div className="grid-cols-2" style={{ gap: 'var(--space-6)' }}>
          {/* Form Side */}
          <div className="flex-col gap-4">
            <div style={{ padding: 'var(--space-3)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                Agent-to-Agent (A2A) Autonomous Contracting
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                Define and execute a simulated autonomous agreement between your selected agent and a counterparty.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Initiating Agent</label>
              <div className="input" style={{ opacity: 0.7 }}>
                {selectedAgent ? `${selectedAgent.alias} (${selectedAgent.eth_address.substring(0,8)}...)` : 'Select an agent'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Counterparty</label>
              <select className="select" value={counterparty} onChange={e => setCounterparty(e.target.value)} disabled={availableCounterparties.length === 0}>
                {availableCounterparties.length === 0 ? (
                  <option>No other agents available</option>
                ) : (
                  availableCounterparties.map(a => (
                    <option key={a.eth_address} value={a.eth_address}>{a.alias} ({a.current_ais} AIS)</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contract Template</label>
              <select className="select" value={contractTemplate} onChange={e => setContractTemplate(e.target.value)}>
                <option value="Data Stream Access">Data Stream Access (Pay-per-byte)</option>
                <option value="Compute Subcontracting">Compute Subcontracting (SLA)</option>
                <option value="Trustless Escrow">Trustless Escrow Trade</option>
                <option value="Model Fine-Tuning Partnership">Model Fine-Tuning Partnership (Revenue Share)</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={executeSimulation} disabled={isExecuting || !selectedAgent || availableCounterparties.length === 0}>
              {isExecuting ? 'Executing Autonomous Contract...' : 'Execute A2A Contract'}
            </button>
          </div>

          {/* Console / Results Side */}
          <div className="flex-col gap-4">
            <div style={{ background: '#0a0a0c', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', height: '220px', padding: 'var(--space-3)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '4px', marginBottom: '4px' }}>
                <Terminal size={14} /> Execution Logs
              </div>
              {logs.length === 0 && !isExecuting ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: 'var(--space-2)' }}>
                  Awaiting execution payload...
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="mono" style={{ fontSize: '0.75rem', color: log.message.includes('SUCCESS') ? 'var(--success)' : 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span> {log.message}
                  </div>
                ))
              )}
            </div>

            {activeAgreements.length > 0 && (
              <div className="table-container">
                <table className="table" style={{ fontSize: '0.75rem' }}>
                  <thead><tr><th>Contract ID</th><th>Counterparty</th><th>Type</th><th>Status</th></tr></thead>
                  <tbody>
                    {activeAgreements.map((a, i) => (
                      <tr key={i}>
                        <td className="mono">{a.id}</td>
                        <td>{a.counterparty}</td>
                        <td>{a.type}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Contract Trading" icon={<Handshake size={18} />}>
          {isBackendOffline ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              Oracle Database Offline. Cannot fetch tradeable contracts.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Contract</th><th>Revenue</th><th>Ask Price</th><th>Action</th></tr></thead>
                <tbody>
                  <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center' }}>No contracts listed for sale</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Agent Equity Holdings" icon={<LineChart size={18} />}>
          {isBackendOffline ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              Oracle Database Offline. Cannot fetch equity data.
            </div>
          ) : !selectedAgent ? (
            <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              Select an agent to view equity holdings.
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Agent</th><th>Shares</th><th>Ownership %</th><th>Dividends</th></tr></thead>
                <tbody>
                  {selectedAgent.equity?.length > 0 ? selectedAgent.equity.map((e, i) => (
                    <tr key={i}>
                      <td className="mono">{e.agent_address.substring(0, 10)}...</td>
                      <td>{e.shares} / {e.total_shares}</td>
                      <td style={{ color: 'var(--primary)' }}>{e.percentage}%</td>
                      <td style={{ color: 'var(--success)' }}>{e.dividends_earned} ITK</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center' }}>No equity holdings</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
