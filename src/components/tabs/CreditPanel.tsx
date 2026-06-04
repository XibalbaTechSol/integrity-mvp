import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Panel } from '../shared/Panel';
import { StatusBadge } from '../shared/StatusBadge';
import { Coins, HandCoins, Clock } from 'lucide-react';
import { api } from '../../services/api';

export function CreditPanel() {
  const { selectedAgent, addToast, fetchData } = useDashboard();
  
  // Loan Form State
  const [borrowAmount, setBorrowAmount] = useState('5000');
  const [termDays, setTermDays] = useState('30');
  const [selectedCollateral, setSelectedCollateral] = useState<string[]>([]);

  // Derived calculations
  const p = parseFloat(borrowAmount) || 0;
  const ais = selectedAgent?.current_ais || 500;
  const interestRate = Math.max(1.5, 12 - (ais / 100)); // Dynamic rate based on AIS
  const isOverLimit = p > (selectedAgent?.credit_profile?.max_borrow_limit || 0);

  const availableCollateral = selectedAgent?.owned_contracts?.filter(c => !c.is_collateralized) || [];
  const selectedCollateralValue = availableCollateral
    .filter(c => selectedCollateral.includes(c.contract_address))
    .reduce((sum, c) => sum + c.collateral_value, 0);

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    if (selectedCollateralValue < p) {
      addToast('error', 'Insufficient collateral value selected');
      return;
    }

    try {
      await api.borrow(selectedAgent.eth_address, {
        amount: p,
        term_days: parseInt(termDays),
        collateral_contracts: selectedCollateral
      });
      addToast('success', 'Loan approved and funded');
      setSelectedCollateral([]);
      fetchData();
    } catch (err) {
      addToast('error', 'Loan application failed');
    }
  };

  const toggleCollateral = (addr: string) => {
    setSelectedCollateral(prev => 
      prev.includes(addr) ? prev.filter(a => a !== addr) : [...prev, addr]
    );
  };

  return (
    <div className="flex-col gap-6">
      <div className="grid-cols-3">
        <Panel title="Credit Profile" icon={<Coins size={18} />} className="flex-col justify-between">
          {!selectedAgent ? <div className="text-muted">Select an agent</div> : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  {selectedAgent?.credit_profile?.credit_score || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Protocol Credit Score
                </div>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Borrow Limit</span>
                <span className="mono" style={{ color: 'var(--success)' }}>${(selectedAgent?.credit_profile?.max_borrow_limit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Total Borrowed</span>
                <span className="mono">${(selectedAgent?.credit_profile?.total_borrowed || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between" style={{ padding: 'var(--space-2) 0', borderTop: '1px solid var(--glass-border)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Defaults</span>
                <span className="mono" style={{ color: (selectedAgent?.credit_profile?.default_count || 0) > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {selectedAgent?.credit_profile?.default_count || 0}
                </span>
              </div>
            </>
          )}
        </Panel>

        <Panel title="AIS Collateralized Loan" icon={<HandCoins size={18} />} style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleBorrow} className="grid-cols-2">
            <div className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Principal Amount (ITK)</label>
                <input type="number" className="input" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} required />
                {isOverLimit && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>Exceeds maximum borrow limit</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Term Duration</label>
                <select className="select" value={termDays} onChange={e => setTermDays(e.target.value)}>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Interest Rate (APR)</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)' }}>{interestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Estimated Repayment</span>
                  <span className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {(p * (1 + (interestRate / 100) * (parseInt(termDays) / 365))).toFixed(2)} ITK
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-col gap-4">
              <div>
                <label className="form-label">Select Contract Collateral</label>
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
                  {availableCollateral.length === 0 ? (
                    <div style={{ padding: 'var(--space-3)', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>No free contracts available</div>
                  ) : availableCollateral.map(c => (
                    <div 
                      key={c.contract_address}
                      onClick={() => toggleCollateral(c.contract_address)}
                      style={{ 
                        padding: 'var(--space-2) var(--space-3)', 
                        borderBottom: '1px solid var(--glass-border)',
                        background: selectedCollateral.includes(c.contract_address) ? 'var(--primary-dim)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.contract_type}</div>
                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.contract_address.substring(0, 10)}...</div>
                      </div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>${c.collateral_value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2" style={{ fontSize: '0.75rem' }}>
                  <span className="text-muted">Selected Value:</span>
                  <span className="mono" style={{ color: selectedCollateralValue >= p ? 'var(--success)' : 'var(--danger)' }}>
                    ${selectedCollateralValue.toLocaleString()} / ${p.toLocaleString()} needed
                  </span>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto' }} disabled={!selectedAgent || isOverLimit || selectedCollateralValue < p}>
                Submit Loan Application
              </button>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title="Active Loans" icon={<Clock size={18} />}>
        {!selectedAgent || !selectedAgent.credit_profile || !selectedAgent.credit_profile.active_loans || selectedAgent.credit_profile.active_loans.length === 0 ? (
          <div className="text-muted">No active loans for this agent.</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Principal</th>
                  <th>APR</th>
                  <th>Collateral</th>
                  <th>Status</th>
                  <th>Repayment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(selectedAgent.credit_profile?.active_loans || []).map(loan => {
                  const progress = (loan.repaid_amount / (loan.principal * 1.05)) * 100; // Simplified 5% flat for demo
                  return (
                    <tr key={loan.loan_id}>
                      <td className="mono">{loan.loan_id}</td>
                      <td className="mono" style={{ color: 'var(--gold)' }}>{loan.principal.toLocaleString()} ITK</td>
                      <td>{loan.interest_rate}%</td>
                      <td>
                        {loan.collateral_contracts?.length || 0} Contract(s) <br/>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AIS: {loan.collateral_ais}</span>
                      </td>
                      <td><StatusBadge status={loan.status} /></td>
                      <td style={{ minWidth: '150px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '2px' }}>
                          <span>{loan.repaid_amount} ITK</span>
                          <span className="text-muted">{Math.round(progress)}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: 'var(--success)' }} />
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--success)' }} onClick={() => addToast('success', 'Repayment processed')}>
                          Repay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
