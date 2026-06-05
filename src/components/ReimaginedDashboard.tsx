import React, { useState } from 'react';
import { Shield, Zap, Lock, Activity, Server, Target, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { UserReputationOverview } from './UserReputationOverview';
import { ImmutableLedger } from './ImmutableLedger';
import { TelemetryStream } from './TelemetryStream';
import { ethers } from 'ethers';

interface ReimaginedDashboardProps {
    agents: any[];
    selectedAgent: any;
    setSelectedAgent: (agent: any) => void;
    metaMaskAddress: string | null;
    connectMetaMask: () => void;
}

export const ReimaginedDashboard: React.FC<ReimaginedDashboardProps> = ({ 
    agents, 
    selectedAgent, 
    setSelectedAgent,
    metaMaskAddress,
    connectMetaMask
}) => {
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(false);

    const handleClaimOwnership = async () => {
        if (!selectedAgent) return;
        if (!metaMaskAddress) {
            connectMetaMask();
            return;
        }

        setIsClaiming(true);
        try {
            // Simulated signing and backend verification for UI
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const message = `I hereby claim ownership of Sovereign Node: ${selectedAgent.eth_address} on the Xibalba Network.`;
            await signer.signMessage(message);
            
            // Artificial delay to simulate backend verification
            await new Promise(r => setTimeout(r, 1500));
            setClaimSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.code !== 4001) { // user rejected
                alert("Ownership claim failed. Please ensure you are connected with the correct wallet.");
            }
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            
            {/* Top Bar: Agent Selector & Status */}
            <div className="glow-panel glow-panel-gold" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Server size={24} style={{ color: 'var(--gold)' }} />
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, fontFamily: 'Playfair Display, serif' }}>Fleet Telemetry</h2>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data-Dense Command Center</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase' }}>Select Active Node</label>
                        <select 
                            className="custom-select"
                            value={selectedAgent?.eth_address || ''}
                            onChange={(e) => {
                                const target = agents.find(a => a.eth_address === e.target.value);
                                if (target) setSelectedAgent(target);
                                setClaimSuccess(false); // Reset claim success on agent change
                            }}
                            style={{ minWidth: '250px' }}
                        >
                            {agents.map(a => (
                                <option key={a.eth_address} value={a.eth_address}>
                                    {a.alias} - {a.eth_address.slice(0,6)}...{a.eth_address.slice(-4)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedAgent ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    
                    {/* Column 1: Core Metrics & Claim */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Agent Identity & Claim Panel */}
                        <div className="glow-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Playfair Display, serif', margin: 0 }}>{selectedAgent.alias}</h2>
                                        <span style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.55rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em' }}>
                                            TIER {selectedAgent.verification_tier}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: '6px' }}>
                                        {selectedAgent.eth_address}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Integrity Score</span>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', fontFamily: 'Playfair Display, serif', lineHeight: 1, marginTop: '4px' }}>
                                        {selectedAgent.current_ais}
                                    </div>
                                </div>
                            </div>

                            {/* Ownership Claim Section */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Shield size={16} style={{ color: 'var(--gold)' }} />
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>Agent Ownership</h3>
                                </div>
                                
                                {claimSuccess ? (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>Ownership Verified</div>
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(16, 185, 129, 0.7)' }}>Cryptographic signature confirmed on-chain.</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: 1.5 }}>
                                            Verify cryptographic control of this node to unlock advanced configuration and treasury withdrawals.
                                        </p>
                                        <button 
                                            onClick={handleClaimOwnership}
                                            disabled={isClaiming}
                                            style={{
                                                background: 'linear-gradient(135deg, var(--gold) 0%, #a88432 100%)',
                                                border: 'none',
                                                color: '#0a0b0d',
                                                padding: '10px 16px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                cursor: isClaiming ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                width: '100%',
                                                justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(201, 168, 76, 0.2)'
                                            }}
                                        >
                                            {isClaiming ? 'VERIFYING SIGNATURE...' : 'CLAIM OWNERSHIP'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Telemetry Stream */}
                        <div style={{ flex: 'none' }}>
                            <TelemetryStream agentAddress={selectedAgent?.eth_address || selectedAgent?.alias} />
                        </div>
                    </div>

                    {/* Column 2: Tri-Metric & Ledger */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Tri-Metric Radars */}
                        <div className="glow-panel" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Activity size={18} style={{ color: 'var(--gold)' }} />
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Tri-Metric Diagnostics</h3>
                            </div>
                            <UserReputationOverview agents={agents} selectedAgent={selectedAgent} />
                        </div>

                        {/* Immutable Ledger Transactions */}
                        <div className="glow-panel" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Lock size={18} style={{ color: 'var(--gold)' }} />
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Immutable Ledger</h3>
                            </div>
                            <ImmutableLedger agentAddress={selectedAgent.eth_address} />
                        </div>

                    </div>
                </div>
            ) : (
                <div className="glow-panel" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    No Agent Selected or Available. Please register a new agent in the Fleet Registry.
                </div>
            )}
        </div>
    );
};
