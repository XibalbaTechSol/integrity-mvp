import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileText,
  Key,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  Gavel,
  RefreshCw,
  X,
  Search,
  ArrowRight,
  Database,
  Loader2,
  Info,
  Trash2
} from 'lucide-react';
import { Panel } from '../components/shared/Panel';
import { StatusBadge } from '../components/shared/StatusBadge';
import { SeededDataBadge } from '../components/shared/SeededDataBadge';
import { useDashboard } from '../context/DashboardContext';
import { SubTabs } from '../components/ui/SubTabs';
import { oracle, type BaaDto, type AuditLogEntryDto } from '../services/oracle';
import { SMART_BAA_FACTORY_ADDRESS, COVERED_ENTITY_REGISTRY_ADDRESS, ITK_TOKEN_ADDRESS, ARBITRATOR_ADDRESS } from '../constants';
import { SMART_BAA_FACTORY_ABI, SMART_BAA_ABI, COVERED_ENTITY_REGISTRY_ABI, ENTITY_TYPE_COVERED_ENTITY } from '../chain/shield';
import { ERC20_ABI, executeAsAgent } from '../chain/markets';

// ─── Interfaces ──────────────────────────────────────────────────────────────
// BAA/Interaction/Violation are now derived directly from real oracle DTOs
// (BaaDto, AuditLogEntryDto) rather than a hand-rolled mock shape — see
// fetchHealthData below, which mirrors integrity-dashboard's HealthPanel.tsx
// (the validated reference implementation for this exact flow).

interface InteractionLog {
  id: string;
  time: string;
  action: string;
  resourceHash: string;
  agent: string;
  baaId: string;
  status: 'PASSED' | 'BLOCKED';
}

interface ViolationRecord {
  id: string;
  address: string; // the disputed SmartBAA's own contract address (its "id" on-chain)
  agent: string;
  coveredEntity: string;
  detail: string;
}

interface ConsentContract {
  id: string;
  patientDid: string;
  requestingEntity: string;
  recordHash: string;
  status: 'Authorized' | 'Revoked' | 'Pending';
  lastUpdated: string;
}

interface QuarantinedAgent {
  id: string;
  agentDid: string;
  violationReason: string;
  lockoutExpiry: string;
  status: 'LOCKED' | 'RESTORED';
}



export default function HealthPage() {
  const { selectedAgent, addToast } = useDashboard() as any;
  const [activeTab, setActiveTab] = useState<'governance'|'shield'|'compliance'|'quarantine'>('governance');

  const TABS = [
    { id: 'governance', label: 'Smart BAAs', icon: <FileText size={14} /> },
    { id: 'shield', label: 'EHR Gates', icon: <Lock size={14} /> },
    { id: 'compliance', label: 'Audit & Compliance', icon: <ShieldCheck size={14} /> },
    { id: 'quarantine', label: 'Quarantine', icon: <AlertTriangle size={14} /> },
  ];
  const { walletAddress, agentsLoading } = useDashboard() as any;
  const [baas, setBaas] = useState<BaaDto[]>([]);
  const [saAddr, setSaAddr] = useState<string | null>(null);
  const [consents, setConsents] = useState<ConsentContract[]>([]);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [quarantinedAgents, setQuarantinedAgents] = useState<QuarantinedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBaa, setBusyBaa] = useState<string | null>(null);

  // Modal / Inputs
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [selectedBAA, setSelectedBAA] = useState<BaaDto | null>(null);

  // New BAA Inputs — a real content commitment (keccak256 of the uploaded PDF's
  // bytes), not a random/typed-in hash, mirroring integrity-dashboard's HealthPanel.
  // The covered entity is the connected wallet itself, not a typed-in address.
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [newStake, setNewStake] = useState('5000');

  // New Consent Inputs (still local UI state for this pass — see Workstream C2
  // in PRODUCTION_GAPS.md; EHRGate write wiring is a separate follow-up).
  const [newPatientDid, setNewPatientDid] = useState('did:xibalba:patient:0x981a...f281');
  const [newRequester, setNewRequester] = useState('0xHealth_Provider_Clinic_88a');
  const [newRecordHash, setNewRecordHash] = useState('0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

  const [quarantinedAgentsSeeded] = useState<QuarantinedAgent[]>([]);

  // ─── Real Smart BAA registry + audit log (mirrors integrity-dashboard's
  // HealthPanel.fetchData exactly — no mock api.getBAAs/getHealthInteractions). ───
  const fetchHealthData = useCallback(async () => {
    if (!selectedAgent) { setBaas([]); setLogs([]); setViolations([]); setLoading(false); return; }
    setLoading(true);
    const did = selectedAgent.eth_address;
    try {
      const [baaData, auditData] = await Promise.all([
        oracle.getAgentBaas(did).catch(() => [] as BaaDto[]),
        oracle.getAuditLog(did, 50).catch(() => [] as AuditLogEntryDto[]),
      ]);
      setBaas(baaData);
      setLogs(auditData.map((a) => ({
        id: a.id,
        time: new Date(a.created_at).toLocaleString(),
        action: a.event_type,
        resourceHash: a.detail || '—',
        agent: a.agent_id || '—',
        baaId: a.source,
        status: (/pass|allow|permit/i.test(a.decision) ? 'PASSED' : 'BLOCKED') as 'PASSED' | 'BLOCKED',
      })));
      // A BAA in the on-chain Disputed state IS the real violation/review queue —
      // no separate fake "violations" table.
      setViolations(baaData.filter((b) => b.status === 'Disputed').map((b) => ({
        id: b.address,
        address: b.address,
        agent: b.business_associate,
        coveredEntity: b.covered_entity,
        detail: `Disputed SmartBAA with covered entity ${b.covered_entity.slice(0, 10)}… — awaiting on-chain arbitration.`,
      })));
    } catch (err: any) {
      addToast('error', `Health data sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  useEffect(() => {
    const did = selectedAgent?.eth_address;
    if (!did) { setSaAddr(null); return; }
    let active = true;
    oracle.resolveSovereignAgent(did).then(a => { if (active) setSaAddr(a); }).catch(() => { if (active) setSaAddr(null); });
    return () => { active = false; };
  }, [selectedAgent]);

  useEffect(() => {
    fetchHealthData();
    setQuarantinedAgents(quarantinedAgentsSeeded); // no real quarantine backend — see PRODUCTION_GAPS.md
  }, [fetchHealthData, quarantinedAgentsSeeded]);

  const getSigner = async () => new ethers.BrowserProvider((window as any).ethereum).getSigner();

  // ─── Handlers ──────────────────────────────────────────────────────────────

  // Real SmartBAAFactory.createBAA. The caller is the covered entity (the connected
  // wallet), which must be an active Covered Entity in CoveredEntityRegistry —
  // registration is REGISTRAR_ROLE-gated, not self-service, so if the wallet isn't
  // registered we say so plainly, and only self-register if it actually holds
  // REGISTRAR_ROLE (mirrors integrity-dashboard's HealthPanel.ProposeBAAModal).
  const handleProposeBAA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) { addToast('error', 'Select an agent first.'); return; }
    if (!walletAddress) { addToast('error', 'Connect the covered-entity wallet first.'); return; }
    if (!pdfFile) { addToast('error', 'Attach the BAA document.'); return; }

    setBusyBaa('propose');
    try {
      const businessAssociate = await oracle.resolveSovereignAgent(selectedAgent.eth_address);
      const signer = await getSigner();

      const registry = new ethers.Contract(COVERED_ENTITY_REGISTRY_ADDRESS, COVERED_ENTITY_REGISTRY_ABI, signer);
      const isActive: boolean = await registry.isActiveCoveredEntity(walletAddress);
      if (!isActive) {
        const registrarRole: string = await registry.REGISTRAR_ROLE();
        const canRegister: boolean = await registry.hasRole(registrarRole, walletAddress);
        if (!canRegister) {
          throw new Error('Your wallet is not a registered Covered Entity. Registration requires the protocol registrar (REGISTRAR_ROLE).');
        }
        addToast('info', 'Registering your wallet as a Covered Entity…');
        await (await registry.registerEntity(walletAddress, ENTITY_TYPE_COVERED_ENTITY, 'ipfs://covered-entity')).wait();
      }

      const bytes = new Uint8Array(await pdfFile.arrayBuffer());
      const agreementHash = ethers.keccak256(bytes);
      const requiredCollateral = ethers.parseEther(newStake || '0');

      const factory = new ethers.Contract(SMART_BAA_FACTORY_ADDRESS, SMART_BAA_FACTORY_ABI, signer);
      addToast('info', 'Creating the SmartBAA on-chain…');
      await (await factory.createBAA(businessAssociate, agreementHash, requiredCollateral)).wait();

      addToast('success', 'Smart BAA created. The agent must sign to activate it.');
      setIsProposeOpen(false);
      setPdfFile(null);
      fetchHealthData();
    } catch (err: any) {
      addToast('error', `Failed to create BAA: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setBusyBaa(null);
    }
  };

  // The agent (business associate) activates a Proposed BAA by posting its required
  // collateral — pulled from its SovereignAgent, so we top the SA up + approve, then
  // sign, all routed through SovereignAgent.execute (mirrors StakingPanel's pattern).
  const handleSignBAA = async (baaAddr: string) => {
    if (!saAddr) { addToast('error', 'Agent SovereignAgent not resolved.'); return; }
    if (!walletAddress) { addToast('error', 'Connect the agent controller wallet.'); return; }
    setBusyBaa(baaAddr);
    try {
      const signer = await getSigner();
      const baa = new ethers.Contract(baaAddr, SMART_BAA_ABI, signer);
      const collateral: bigint = await baa.requiredCollateral();
      const itk = new ethers.Contract(ITK_TOKEN_ADDRESS, ERC20_ABI, signer);
      const bal: bigint = await itk.balanceOf(saAddr);
      if (bal < collateral) {
        addToast('info', 'Funding your agent with the BAA collateral…');
        await (await itk.transfer(saAddr, collateral - bal)).wait();
      }
      const allowance: bigint = await itk.allowance(saAddr, baaAddr);
      if (allowance < collateral) {
        const approveData = new ethers.Interface(ERC20_ABI as any).encodeFunctionData('approve', [baaAddr, collateral]);
        await executeAsAgent(signer, saAddr, ITK_TOKEN_ADDRESS, approveData);
      }
      const signData = new ethers.Interface(SMART_BAA_ABI as any).encodeFunctionData('sign', []);
      addToast('info', 'Signing the BAA…');
      await executeAsAgent(signer, saAddr, baaAddr, signData);
      addToast('success', 'BAA signed and activated.');
      fetchHealthData();
    } catch (err: any) {
      addToast('error', `Sign failed: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setBusyBaa(null);
    }
  };

  // Real SmartBAA.raiseDispute — covered-entity-only (dashboard's HealthPanel never
  // built this; it's new here). We can't route through executeAsAgent since the
  // caller is the CE's own wallet, not the agent.
  const handleRaiseDispute = async (baaAddr: string, coveredEntity: string) => {
    if (!walletAddress || walletAddress.toLowerCase() !== coveredEntity.toLowerCase()) {
      addToast('error', 'Only the covered entity on this BAA can raise a dispute.');
      return;
    }
    setBusyBaa(baaAddr);
    try {
      const signer = await getSigner();
      const baa = new ethers.Contract(baaAddr, SMART_BAA_ABI, signer);
      await (await baa.raiseDispute()).wait();
      addToast('success', 'Dispute raised — awaiting arbitration.');
      fetchHealthData();
    } catch (err: any) {
      addToast('error', `Raising dispute failed: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setBusyBaa(null);
    }
  };

  // Real SmartBAA.revoke — either party, blocked on-chain while Disputed.
  const handleRevokeBAA = async (baaAddr: string) => {
    setBusyBaa(baaAddr);
    try {
      const signer = await getSigner();
      const baa = new ethers.Contract(baaAddr, SMART_BAA_ABI, signer);
      await (await baa.revoke()).wait();
      addToast('success', 'BAA revoked.');
      fetchHealthData();
    } catch (err: any) {
      addToast('error', `Revoke failed: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setBusyBaa(null);
    }
  };

  const handleCreateConsent = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: ConsentContract = {
      id: 'con_gate_' + Math.floor(Math.random() * 1000),
      patientDid: newPatientDid,
      requestingEntity: newRequester,
      recordHash: newRecordHash,
      status: 'Pending',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setConsents(prev => [newC, ...prev]);
    addToast('success', 'Consent Contract gating record proposed.');
  };

  const handleToggleConsent = async (id: string, action: 'Authorized' | 'Revoked') => {
    try {
      addToast('info', 'Awaiting Biometric Passkey signature...');
      
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const publicKeyCredentialCreationOptions = {
          challenge: challenge,
          rp: {
              name: "Xibalba Shield (EHR Gate)"
          },
          user: {
              id: new Uint8Array(16),
              name: "patient-" + id,
              displayName: "Patient Sovereign Identity"
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
              authenticatorAttachment: "platform", // Forces Touch ID / Windows Hello
              userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
      } as any;

      const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        setConsents(prev => prev.map(c => c.id === id ? { ...c, status: action, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) } : c));
        addToast('success', `EHR Gate successfully updated to: ${action} via Passkey Signature.`);
      }
    } catch (error) {
      console.error(error);
      addToast('error', 'Passkey authentication cancelled or unsupported on this device.');
    }
  };

  // Real SmartBAA.arbitrate — onlyArbitrator (a fixed neutral address set at factory
  // deploy time, never the CE or the agent). Gated on the connected wallet, exactly
  // like integrity-dashboard's handleResolveViolation — anyone else is told plainly
  // rather than the UI pretending to resolve it.
  const handleArbitrate = async (baaAddr: string, slash: boolean) => {
    if (!walletAddress || walletAddress.toLowerCase() !== ARBITRATOR_ADDRESS.toLowerCase()) {
      addToast('error', 'Only the protocol arbitrator can resolve BAA disputes.');
      return;
    }
    setBusyBaa(baaAddr);
    try {
      const signer = await getSigner();
      const baa = new ethers.Contract(baaAddr, SMART_BAA_ABI, signer);
      await (await baa.arbitrate(slash)).wait();
      addToast('success', slash ? 'Collateral slashed to the covered entity.' : 'Dispute dismissed; BAA restored to Active.');
      fetchHealthData();
    } catch (err: any) {
      addToast('error', `Arbitration failed: ${err.shortMessage || err.reason || err.message}`);
    } finally {
      setBusyBaa(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* ─── Hero HIPAA Gateway Bar ─── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.05) 0%, rgba(5, 13, 24, 0.95) 100%)',
          border: '1px solid var(--theme-accent-muted)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6) var(--space-8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--theme-accent)' }}>Health Protocol</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Smart BAA registry is real (Base Sepolia); EHR Gates &amp; Quarantine remain illustrative — see per-tab notes.</span>
        </div>

        {/* ─── HIPAA Stats Strip ─── */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-5)', textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--theme-accent)', lineHeight: 1 }}>
              {loading ? '—' : baas.filter(b => b.status === 'Active').length}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>
              Active BAAs
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-5)', textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>
              {loading ? '—' : baas.filter(b => b.status === 'Disputed').length}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>
              Disputed BAAs
            </div>
          </div>
        </div>
      </div>



      {/* ── Sub-navigation Tab Bar ───────────────────────────────────────── */}
      <div style={{ marginBottom: '16px', marginTop: '16px' }}>
        <SubTabs tabs={TABS as any} activeTab={activeTab} setActiveTab={setActiveTab as any} />
      </div>

      {/* ─── Render Tab Contents ─── */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: Smart BAAs */}
        {activeTab === 'governance' && (
          <motion.div
            key="baas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-col gap-6"
          >
            <div className="grid-cols-2" style={{ gap: 'var(--space-6)' }}>
              
              {/* Active BAAs */}
              <Panel 
                title="Smart BAA Registry" 
                icon={<FileText size={18} color="var(--theme-accent)" />}
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => setIsProposeOpen(true)}>
                    + Propose BAA Contract
                  </button>
                }
              >
                <div className="flex-col gap-4">
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Real, on-chain Business Associate Agreements via <code>SmartBAAFactory</code>/<code>SmartBAA</code>. Locked ITK collateral is slashed only by the protocol arbitrator, on a raised dispute.
                  </p>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Covered Entity</th>
                          <th>Status</th>
                          <th>Required Collateral</th>
                          <th>Agreement Hash</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Loading…</td></tr>
                        ) : baas.length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No BAAs found for this agent.</td></tr>
                        ) : (
                          baas.map(b => {
                            const canSign = b.status === 'Proposed' && !!saAddr && b.business_associate.toLowerCase() === saAddr.toLowerCase();
                            const canDispute = b.status === 'Active' && !!walletAddress && b.covered_entity.toLowerCase() === walletAddress.toLowerCase();
                            const canRevoke = b.status === 'Active' && !!walletAddress &&
                              (b.covered_entity.toLowerCase() === walletAddress.toLowerCase() || (!!saAddr && b.business_associate.toLowerCase() === saAddr.toLowerCase()));
                            return (
                            <tr key={b.address}>
                              <td className="mono" title={b.covered_entity}>{b.covered_entity.substring(0, 15)}...</td>
                              <td><StatusBadge status={b.status} /></td>
                              <td className="mono" style={{ color: 'var(--theme-accent)' }}>{(Number(b.required_collateral) / 1e18).toLocaleString()} ITK</td>
                              <td className="mono" title={b.agreement_hash}>{b.agreement_hash.substring(0, 10)}...</td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {canSign && (
                                    <button className="btn btn-success btn-xs" disabled={busyBaa === b.address} onClick={() => handleSignBAA(b.address)}>
                                      {busyBaa === b.address ? '…' : 'Sign'}
                                    </button>
                                  )}
                                  {canDispute && (
                                    <button className="btn btn-danger btn-xs" disabled={busyBaa === b.address} onClick={() => handleRaiseDispute(b.address, b.covered_entity)}>
                                      Dispute
                                    </button>
                                  )}
                                  {canRevoke && (
                                    <button className="btn btn-outline btn-xs" disabled={busyBaa === b.address} onClick={() => handleRevokeBAA(b.address)}>
                                      Revoke
                                    </button>
                                  )}
                                  <button className="btn btn-outline btn-xs" onClick={() => setSelectedBAA(b)}>Explore</button>
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>

              {/* Legal / Enclave Info */}
              <Panel title="HIPAA Gateway Concept & Safeguards" icon={<ShieldCheck size={18} color="var(--theme-accent)" />}>
                <div className="flex-col gap-4" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <div style={{ padding: '16px', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)' }}>
                    <strong>Parametric Enforcement:</strong> BAA contracts are no longer passive paper. Under Xibalba Shield, the contract acts as a cryptographic custodian of performance. If a validator enclave leaks PHI, the contract executes the slash automatically.
                  </div>
                  
                  {[
                    { title: 'TEE Hardware Isolation', desc: 'Medical records are queried inside Secure Enclaves (Intel SGX) with zero memory visibility to host operators.' },
                    { title: 'Edge-Blinding', desc: 'No unblinded PHI is committed to the blockchain ledger. We store cryptographic SHA-256 hashes of record histories.' },
                    { title: 'Intent Verification', desc: 'BCC boundary controls audit queries in real-time, blocking outbound transmission of patient datasets.' }
                  ].map((x, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ display: 'block', color: 'white', marginBottom: '2px' }}>{x.title}</strong>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{x.desc}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PHI Access Gates */}
        {activeTab === 'shield' && (
          <motion.div
            key="gates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-col gap-6"
          >
            <div className="grid-cols-2" style={{ gap: 'var(--space-6)' }}>
              
              {/* Record Gate Consent Contracts */}
              <Panel title="Patient Consent Contracts (EHR Gates)" icon={<Lock size={18} color="var(--theme-accent)" />}>
                <div className="flex-col gap-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SeededDataBadge label="EHRGate not yet deployed to Base Sepolia" />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    The real on-chain consent mechanism is <code>EHRGate.grantAccess</code>/<code>revokeAccess</code> — the ABI is wired (<code>chain/shield.ts</code>) but the contract has only ever been deployed locally, never to Base Sepolia. This panel stays local-state until that deploy runs; see PRODUCTION_GAPS.md.
                  </p>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Patient DID</th>
                          <th>Requester</th>
                          <th>Record Hash</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consents.map(c => (
                          <tr key={c.id}>
                            <td className="mono" title={c.patientDid} style={{ whiteSpace: 'nowrap' }}>{c.patientDid.substring(0, 15)}...</td>
                            <td className="mono" title={c.requestingEntity} style={{ whiteSpace: 'nowrap' }}>{c.requestingEntity.substring(0, 12)}...</td>
                            <td className="mono" style={{ whiteSpace: 'nowrap' }}>{c.recordHash.substring(0, 10)}...</td>
                            <td style={{ whiteSpace: 'nowrap' }}><StatusBadge status={c.status.toLowerCase()} /></td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {c.status !== 'Authorized' && (
                                  <button className="btn btn-success btn-sm" onClick={() => handleToggleConsent(c.id, 'Authorized')}>AUTHORIZE</button>
                                )}
                                {c.status !== 'Revoked' && (
                                  <button className="btn btn-danger btn-sm" onClick={() => handleToggleConsent(c.id, 'Revoked')}>REVOKE</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>

              {/* Propose Consent Request */}
              <Panel title="Request / Register Consent Gate" icon={<Key size={18} />}>
                <form className="flex-col gap-4" onSubmit={handleCreateConsent}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="patient-did">Patient DID</label>
                    <input 
                      id="patient-did"
                      className="input" 
                      value={newPatientDid} 
                      onChange={e => setNewPatientDid(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="requester-entity">Requesting Entity Address</label>
                    <input 
                      id="requester-entity"
                      className="input" 
                      value={newRequester} 
                      onChange={e => setNewRequester(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ehr-record-hash">Medical Record Hash (SHA-256)</label>
                    <input 
                      id="ehr-record-hash"
                      className="input" 
                      value={newRecordHash} 
                      onChange={e => setNewRecordHash(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Deploy Consent Gate Contract
                  </button>
                </form>
              </Panel>
            </div>
          </motion.div>
        )}

        {/* TAB 3: Audit & Compliance */}
        {activeTab === 'compliance' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-col gap-6"
          >
            {/* Interaction Logs + Violations */}
            <div className="grid-cols-3" style={{ gap: 'var(--space-6)' }}>
              
              {/* Interaction Logs */}
              <div className="col-span-2">
                <Panel title="Medical Record Interaction Logs" icon={<Activity size={18} color="var(--theme-accent)" />}>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Resource Hash</th>
                          <th>Agent</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(l => (
                          <tr key={l.id}>
                            <td className="mono text-muted">{l.time}</td>
                            <td style={{ fontWeight: 600 }}>{l.action}</td>
                            <td className="mono">{l.resourceHash}</td>
                            <td>{l.agent}</td>
                            <td>
                              <span style={{
                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                background: l.status === 'PASSED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                color: l.status === 'PASSED' ? 'var(--success)' : 'var(--danger)',
                                border: `1px solid ${l.status === 'PASSED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                fontWeight: 700
                              }}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>

              {/* Violations Review Queue */}
              <div className="col-span-1">
                <Panel title="Compliance Review Queue" icon={<AlertTriangle size={18} color="var(--danger)" />}>
                  <div className="flex-col gap-4">
                    <p className="text-muted" style={{ fontSize: '0.7rem', margin: 0 }}>
                      Real disputed <code>SmartBAA</code>s awaiting arbitration. Resolving requires connecting the protocol arbitrator's wallet.
                    </p>
                    {violations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        <ShieldCheck size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        No violations flagged for review.
                      </div>
                    ) : (
                      violations.map(v => (
                        <div
                          key={v.id}
                          style={{
                            background: 'rgba(244, 63, 94, 0.05)',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>
                              BAA DISPUTE
                            </span>
                            <ShieldAlert size={16} color="var(--danger)" />
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>
                            {v.detail}
                          </p>
                          <div className="flex gap-2">
                            <button className="btn btn-danger btn-xs" style={{ flex: 1 }} disabled={busyBaa === v.address} onClick={() => handleArbitrate(v.address, true)}>
                              Slash Stake
                            </button>
                            <button className="btn btn-ghost btn-xs" style={{ flex: 1, border: '1px solid var(--border)' }} disabled={busyBaa === v.address} onClick={() => handleArbitrate(v.address, false)}>
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: Quarantine Zone */}
        {activeTab === 'quarantine' && (
          <motion.div
            key="quarantine"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-col gap-6"
          >
            <div className="grid-cols-1" style={{ gap: 'var(--space-6)' }}>
              <Panel title="Agent Circuit Breakers (Quarantine Zone)" icon={<AlertTriangle size={18} color="var(--danger)" />}>
                <div className="flex-col gap-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SeededDataBadge label="No quarantine backend exists" />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Agents that have violated the OPA HIPAA intent policies or lacked active BAA smart contracts are locked out at the pre-execution middleware layer. Their network access is severed until the lockout expires.
                  </p>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Agent DID</th>
                          <th>Violation Reason</th>
                          <th>Lockout Expiry</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarantinedAgents.map(qa => (
                          <tr key={qa.id}>
                            <td className="mono" title={qa.agentDid}>{qa.agentDid}</td>
                            <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{qa.violationReason}</td>
                            <td className="mono">{new Date(qa.lockoutExpiry).toLocaleTimeString()}</td>
                            <td>
                              <span style={{
                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                background: qa.status === 'LOCKED' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: qa.status === 'LOCKED' ? 'var(--danger)' : 'var(--success)',
                                border: `1px solid ${qa.status === 'LOCKED' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                fontWeight: 700
                              }}>
                                {qa.status}
                              </span>
                            </td>
                            <td>
                              {qa.status === 'LOCKED' && (
                                <button className="btn btn-outline btn-xs" onClick={() => {
                                  setQuarantinedAgents(prev => prev.map(q => q.id === qa.id ? { ...q, status: 'RESTORED' } : q));
                                  addToast('success', 'Manual override: Agent restored from quarantine.');
                                }}>
                                  Force Restore
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Panel>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Modals ─── */}

      {/* Propose BAA Modal */}
      {isProposeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={() => setIsProposeOpen(false)} style={{ position: 'absolute', inset: 0, background: 'var(--navy-deep)', opacity: 0.85, backdropFilter: 'blur(8px)' }} />
          <form 
            onSubmit={handleProposeBAA}
            style={{ 
              position: 'relative', width: '100%', maxWidth: '450px', background: 'var(--bg-card)', 
              border: '1px solid var(--theme-accent)', borderRadius: 'var(--radius-lg)', padding: '24px', 
              display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>Propose Smart BAA</h3>

            <div className="form-group">
              <label className="form-label">Covered Entity (your connected wallet)</label>
              {walletAddress ? (
                <div className="input mono" style={{ opacity: 0.8 }}>{walletAddress}</div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Connect a wallet first.</div>
              )}
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                You create the BAA as the covered entity; <span className="mono">{selectedAgent?.alias || 'the selected agent'}</span> is the business associate.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">BAA Document (PDF)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <div className="input flex items-center gap-2" style={{ background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
                  <FileText size={16} /> {pdfFile ? pdfFile.name : 'Upload BAA...'}
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Hashed client-side (keccak256) as the on-chain agreement commitment — the file itself is never uploaded anywhere.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Staked ITK Collateral Amount</label>
              <input
                type="number" className="input" value={newStake}
                onChange={e => setNewStake(e.target.value)} required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busyBaa === 'propose' || !walletAddress || !pdfFile}>
              {busyBaa === 'propose' ? 'Creating BAA…' : 'Deploy Smart BAA'}
            </button>
          </form>
        </div>
      )}

      {/* Explore BAA Modal */}
      {selectedBAA && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={() => setSelectedBAA(null)} style={{ position: 'absolute', inset: 0, background: 'var(--navy-deep)', opacity: 0.85, backdropFilter: 'blur(8px)' }} />
          <div 
            style={{ 
              position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-card)', 
              border: '1px solid var(--theme-accent)', borderRadius: 'var(--radius-lg)', padding: '24px', 
              display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 700 }}>Explore HIPAA Smart BAA</h3>
              <button onClick={() => setSelectedBAA(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contract Address</span>
                <div style={{ fontSize: '0.8rem' }} className="mono">{selectedBAA.address}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</span>
                <div><StatusBadge status={selectedBAA.status} /></div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Covered Entity</span>
                <div style={{ fontSize: '0.8rem' }} className="mono">{selectedBAA.covered_entity}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Business Associate</span>
                <div style={{ fontSize: '0.8rem' }} className="mono">{selectedBAA.business_associate}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Required Collateral</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--theme-accent)' }} className="mono">{(Number(selectedBAA.required_collateral) / 1e18).toLocaleString()} ITK</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Agreement Hash</span>
                <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }} className="mono">{selectedBAA.agreement_hash}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                The agreement PDF itself is never uploaded to this app or stored on-chain — only its keccak256 content commitment is. Verifying the document matches this hash requires the original PDF file.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
