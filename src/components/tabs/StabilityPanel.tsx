import { Panel } from '../shared/Panel';
import { BarChart2, Zap, Globe, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

export function StabilityPanel() {
  const llmProviders = [
    { name: 'GPT-4o', provider: 'OpenAI', ais: 982, stability: 99.4, grounding: 98.1, status: 'certified' },
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', ais: 978, stability: 99.1, grounding: 98.5, status: 'certified' },
    { name: 'Gemini 1.5 Pro', provider: 'Google', ais: 965, stability: 97.8, grounding: 96.2, status: 'certified' },
    { name: 'Llama 3 70B', provider: 'Meta (Groq)', ais: 942, stability: 96.5, grounding: 91.0, status: 'certified' },
    { name: 'Mistral Large 2', provider: 'Mistral', ais: 915, stability: 94.2, grounding: 89.5, status: 'pending' },
  ];

  return (
    <div className="flex-col gap-6">
      <Panel title="Stability Leaderboard" icon={<BarChart2 size={18} />}>
        <div className="flex-col gap-4">
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>
            Public ranking of LLM providers by performance variance (Entropy) and grounding fidelity.
            Certified providers maintain <span style={{ color: 'var(--primary)', fontWeight: 600 }}>95%+ stability</span> over 30 days.
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Model / Provider</th>
                  <th>Avg. AIS</th>
                  <th>Stability (1-E)</th>
                  <th>Grounding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {llmProviders.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.provider}</div>
                    </td>
                    <td className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>{p.ais}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: '60px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${p.stability}%`, height: '100%', background: 'var(--success)' }}></div>
                        </div>
                        <span className="mono" style={{ fontSize: '0.75rem' }}>{p.stability}%</span>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: '0.875rem' }}>{p.grounding}%</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="grid-cols-2">
        <Panel title="Regional Performance" icon={<Globe size={18} />}>
          <div className="flex-col gap-4">
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>US-East (N. Virginia)</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>12ms avg.</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>EU-Central (Frankfurt)</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>18ms avg.</span>
            </div>
            <div className="flex justify-between items-center" style={{ fontSize: '0.875rem' }}>
              <span>AP-Northeast (Tokyo)</span>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>45ms avg.</span>
            </div>
            
            <div style={{ height: '120px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                <Globe size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <br />
                Latency Heatmap Visualization
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Certification Pipeline" icon={<ShieldCheck size={18} />}>
          <div className="flex-col gap-4">
            <div style={{ padding: 'var(--space-3)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                Apply for Institutional Certification
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Requires 1M+ tokens processed via Xibalba Integrity Sockets and zero consensus violations.
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.875rem' }}>Active Audits</span>
              <span className="mono" style={{ fontWeight: 600 }}>12</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '0.875rem' }}>ZK-Verifiers Online</span>
              <span className="mono" style={{ fontWeight: 600 }}>8,421</span>
            </div>

            <button className="btn btn-primary" style={{ marginTop: 'auto' }}>
              Start Certification Audit
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
