import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { Hammer, Code, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import Editor from '@monaco-editor/react';

export function FactoryPanel() {
  const { addToast } = useDashboard();
  const [contractType, setContractType] = useState('custom');
  const [language, setLanguage] = useState('solidity');
  const [code, setCode] = useState('// Write your smart contract here\n\ncontract IntegrityCustom {\n  \n}');
  const [isDeploying, setIsDeploying] = useState(false);

  const templates: Record<string, { lang: string, code: string }> = {
    custom: { lang: 'solidity', code: '// Write your smart contract here\n\ncontract IntegrityCustom {\n  \n}' },
    SLA: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract ServiceLevelAgreement {\n  uint256 public constant MIN_UPTIME = 999; // 99.9%\n  uint256 public penaltyAmount;\n\n  function reportDowntime() external {\n    // Penalty execution logic\n  }\n}' },
    Escrow: { lang: 'rust', code: 'use anchor_lang::prelude::*;\n\n#[program]\npub mod trustless_escrow {\n  use super::*;\n  pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {\n    // Lock funds\n    Ok(())\n  }\n}' },
    RevenueShare: { lang: 'typescript', code: 'import { Contract, Context } from "@integrity/sdk";\n\nexport class RevenueShare extends Contract {\n  distributeYield(ctx: Context) {\n    // Calculate and send dividends to equity holders\n  }\n}' },
    LoanAgreement: { lang: 'solidity', code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract CollateralizedLoan {\n  address public borrower;\n  uint256 public principal;\n  uint256 public requiredAIS;\n\n  function liquidate() external {\n    // Foreclosure logic if AIS drops\n  }\n}' }
  };

  const handleTemplateClick = (id: string) => {
    setContractType(id);
    if (templates[id]) {
      setLanguage(templates[id].lang);
      setCode(templates[id].code);
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    try {
      const res = await api.deployContract({ type: contractType, language, code });
      addToast('success', `Contract deployed successfully at ${res.contract_address.substring(0, 10)}...`);
    } catch (err) {
      addToast('error', 'Deployment failed. Check oracle backend connection.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="grid-cols-2">
      <div className="flex-col gap-6">
        <Panel title="Contract Templates" icon={<Hammer size={18} />}>
          <div className="flex-col gap-3">
            {[
              { id: 'custom', name: 'Custom Code', desc: 'Define your own smart contract logic from scratch.' },
              { id: 'SLA', name: 'Service Level Agreement', desc: 'Performance guarantees with automated penalty execution.' },
              { id: 'Escrow', name: 'Trustless Escrow', desc: 'Secure funds for Agent-to-Agent transactions.' },
              { id: 'RevenueShare', name: 'Revenue Share', desc: 'Multi-party distribution of generated yield.' },
              { id: 'LoanAgreement', name: 'Loan Agreement', desc: 'Formalize lending with AIS-backed collateral.' }
            ].map(t => (
              <div 
                key={t.id}
                onClick={() => handleTemplateClick(t.id)}
                style={{
                  padding: 'var(--space-3)', 
                  border: `1px solid ${contractType === t.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: contractType === t.id ? 'var(--primary-dim)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>{t.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="flex-col gap-6">
        <Panel title="Smart Contract IDE" icon={<Code size={18} />} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <form onSubmit={handleDeploy} className="flex-col gap-4" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Network</label>
                <select className="select">
                  <option value="base-sepolia">Base Sepolia (L2)</option>
                  <option value="ethereum">Ethereum Mainnet</option>
                  <option value="solana">Solana Devnet</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="select" value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="solidity">Solidity</option>
                  <option value="rust">Rust</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python / Vyper</option>
                  <option value="go">Go</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: '300px', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isDeploying}>
              {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <Hammer size={16} />}
              Compile & Deploy Contract
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
