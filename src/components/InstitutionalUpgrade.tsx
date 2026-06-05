import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, ShieldCheck, FileCheck, Globe, Building, ArrowRight, X, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../constants';

interface InstitutionalUpgradeProps {
    isOpen: boolean;
    onClose: () => void;
    agent: any;
    onSuccess: () => void;
}

export const InstitutionalUpgrade: React.FC<InstitutionalUpgradeProps> = ({ isOpen, onClose, agent, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isVerifying, setIsVerifying] = useState(false);
    const [formData, setFormData] = useState({
        businessName: '',
        registrationNumber: '',
        domain: '',
        contactEmail: ''
    });

    const handleUpgrade = async () => {
        setIsVerifying(true);
        try {
            // Simulate Institutional Verification Process
            await new Promise(r => setTimeout(r, 3000));
            
            // In real app, this would submit documents to the Oracle for manual/automated review
            // For now, we simulate a successful upgrade request
            
            setStep(3);
            setIsVerifying(false);
        } catch (e) {
            alert("Verification submission failed.");
            setIsVerifying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(5, 13, 24, 0.95)', backdropFilter: 'blur(20px)' }} 
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{ 
                    position: 'relative', width: '100%', maxWidth: '600px', 
                    background: 'var(--navy-deep)', border: '1px solid rgba(212, 175, 55, 0.3)', 
                    borderRadius: '24px', overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.8)' 
                }}
            >
                <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                            <Landmark size={22} />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Institutional Tier 3 Upgrade</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '40px' }}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <Building size={48} style={{ color: 'var(--gold)', marginBottom: '16px' }} />
                                    <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Institutional Custody</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                        Upgrade <strong>{agent?.alias}</strong> to Tier 3 to unlock $1M+ insurance coverage, ZK-Shielded PHI processing, and preferred routing in the Xibalba network.
                                    </p>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Globe size={20} style={{ color: 'var(--gold)' }} />
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Domain Binding</div>
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Prove ownership of your corporate domain via DNS TXT record.</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <FileCheck size={20} style={{ color: 'var(--gold)' }} />
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>KYC / KYB Verification</div>
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Submit business registration documents for cryptographic audit.</div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => setStep(2)} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '0.9rem' }}>BEGIN VERIFICATION</button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>Legal Entity Name</label>
                                        <input type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} placeholder="e.g. Xibalba Solutions LLC" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>Corporate Domain</label>
                                        <input type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }} placeholder="xibalba.solutions" />
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(212,175,55,0.05)', borderRadius: '12px', border: '1px dashed rgba(212,175,55,0.2)' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                                            <strong>DNS Verification Required:</strong> After submission, you must add a TXT record to your domain's DNS settings containing your Agent DID.
                                        </p>
                                    </div>
                                    <button onClick={handleUpgrade} disabled={isVerifying || !formData.businessName} className="btn btn-primary" style={{ width: '100%', padding: '16px', marginTop: '12px' }}>
                                        {isVerifying ? <><Loader2 className="animate-spin" size={20} /> SUBMITTING DOCUMENTS...</> : 'SUBMIT FOR AUDIT'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                                <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '24px' }} />
                                <h3 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Audit Initiated</h3>
                                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '32px' }}>
                                    Your institutional verification request for <strong>{formData.businessName}</strong> has been logged. Our auditors will verify your DNS and registration within 24-48 hours.
                                </p>
                                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>RETURN TO DASHBOARD</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
