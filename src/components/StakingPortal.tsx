import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { ShieldCheck, Info, Loader2, Coins, ArrowUpRight, TrendingUp, Lock } from 'lucide-react';
import axios from 'axios';
import { API_BASE, ITK_TOKEN_ADDRESS, REPUTATION_REGISTRY_ADDRESS } from '../constants';
import ITK_ABI from '../abi/IntegrityToken.json';
import REGISTRY_ABI from '../abi/ReputationRegistry.json';

interface StakingPortalProps {
    selectedAgent: any;
    userAddress: string | null;
}

export const StakingPortal: React.FC<StakingPortalProps> = ({ selectedAgent, userAddress }) => {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [stakedBalance, setStakedBalance] = useState('0.0');
    const [itkBalance, setItkBalance] = useState('0.0');

    const fetchBalances = async () => {
        if (!userAddress || !selectedAgent || !window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const itkContract = new ethers.Contract(ITK_TOKEN_ADDRESS, ITK_ABI, provider);
            const registryContract = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REGISTRY_ABI, provider);

            const bal = await itkContract.balanceOf(userAddress);
            setItkBalance(ethers.formatEther(bal));

            const staked = await registryContract.userStakes(userAddress, selectedAgent.eth_address);
            setStakedBalance(ethers.formatEther(staked));
        } catch (e) {
            console.error("Balance fetch error:", e);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [selectedAgent, userAddress]);

    const handleStake = async () => {
        if (!amount || !userAddress || !selectedAgent || !window.ethereum) return;
        setIsLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            const itkContract = new ethers.Contract(ITK_TOKEN_ADDRESS, ITK_ABI, signer);
            const registryContract = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REGISTRY_ABI, signer);

            const amountWei = ethers.parseEther(amount);

            // 1. Approve Registry
            const allowance = await itkContract.allowance(userAddress, REPUTATION_REGISTRY_ADDRESS);
            if (allowance < amountWei) {
                const approveTx = await itkContract.approve(REPUTATION_REGISTRY_ADDRESS, ethers.MaxUint256);
                await approveTx.wait();
            }

            // 2. Stake to Agent
            const stakeTx = await registryContract.stakeToAgent(selectedAgent.eth_address, amountWei);
            await stakeTx.wait();

            alert("Successfully staked ITK to agent!");
            fetchBalances();
        } catch (e: any) {
            console.error("Stake error:", e);
            alert(`Staking failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glow-panel"
            style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.02)', border: '1px solid rgba(212, 175, 55, 0.1)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Staking Portal</h3>
                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>REPUTATION BACKING</div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Your Stake</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold)' }}>{parseFloat(stakedBalance).toLocaleString()} ITK</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <TrendingUp size={14} style={{ color: 'var(--emerald)' }} />
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Sacrifice Boost</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>+{Math.min(100, Math.floor(parseFloat(stakedBalance)/100))}%</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Coins size={14} style={{ color: 'var(--gold)' }} />
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>Est. Yield</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>8.4% <span style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>APR</span></div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>Stake to Agent</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>Bal: {parseFloat(itkBalance).toLocaleString()} ITK</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
                    />
                    <button 
                        disabled={isLoading || !amount}
                        onClick={handleStake}
                        className="btn btn-primary" 
                        style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : <><Lock size={14} /> STAKE</>}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Staked ITK is locked for 7 days. Backing agents increases their computational priority in the Xibalba network.</p>
            </div>
        </motion.div>
    );
};
