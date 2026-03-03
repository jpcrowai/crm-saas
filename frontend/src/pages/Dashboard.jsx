import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { getTenantStats, createLead, fetcher, getReports } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, DollarSign, TrendingUp, Users, Plus, Activity, CreditCard, Shield, Upload, ArrowRight, XCircle, Target, Briefcase, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import KpiCarousel from '../components/KpiCarousel';
import TabbedDashboard from '../components/TabbedDashboard';
import '../styles/tenant-luxury.css';
import '../components/KpiCarousel.css';
import '../components/TabbedDashboard.css';

const MasterAdminView = () => {
  const { data: stats, error } = useSWR('/tenant/admin-stats', fetcher);

  if (!stats) return (
    <div className="tenant-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div className="loading-container">
        <Activity className="animate-pulse" size={48} color="var(--gold-400)" />
        <p style={{ marginTop: '1rem', fontWeight: 600 }}>Acessando ambiente...</p>
      </div>
    </div>
  );

  return (
    <div className="tenant-page-container">
      <header className="page-header-row">
        <div className="page-title-group">
          <h1>{stats.nome}</h1>
          <p>Ambiente Gerenciado por CRMaster Global</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/import-leads'}>
            <Upload size={18} /> Importar Base
          </button>
        </div>
      </header>

      <div className="indicator-grid">
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
          <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)' }}><Users size={28} /></div>
          <div className="indicator-data">
            <label>Contas de Usuário</label>
            <p>{stats.user_count}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: stats.payment_status === 'em dia' ? 'var(--success)' : 'var(--error)' }}>
          <div className="indicator-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}><CreditCard size={28} /></div>
          <div className="indicator-data">
            <label>Status Financeiro</label>
            <p style={{ textTransform: 'uppercase', fontSize: '1.2rem' }}>{stats.payment_status}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-700)' }}>
          <div className="indicator-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}><Shield size={28} /></div>
          <div className="indicator-data">
            <label>Administrador Responsável</label>
            <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{stats.admin_email}</p>
          </div>
        </div>
      </div>

      <div className="data-card-luxury" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--grad-premium)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Activity size={64} style={{ color: 'var(--gold-400)', margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
        <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Visualização Administrativa</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>
          Este painel reflete o status operacional do tenant. Os dados de inteligência comercial e movimentações financeiras são restritos ao ambiente do cliente.
        </p>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', value: 0 });
  const { user } = useAuth();

  const { data: summary, isValidating } = useSWR('/tenant/dashboard-summary', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000
  });

  const stats = summary?.stats;
  const reportData = summary ? {
    total_leads: summary.stats.total_leads,
    total_revenue: summary.stats.total_revenue,
    total_expenses: summary.total_expenses,
    customer_ranking: summary.customer_ranking
  } : null;

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setShowLeadForm(false);
      setNewLead({ name: '', email: '', phone: '', value: 0 });
      // Clear cache and re-fetch to reflect new lead immediately
      mutate('/tenant/dashboard-summary');
    } catch (error) {
      alert('Erro ao criar lead');
    }
  };

  const chartData = [
    { name: 'Seg', leads: 4 }, { name: 'Ter', leads: 3 }, { name: 'Qua', leads: 7 },
    { name: 'Qui', leads: 2 }, { name: 'Sex', leads: 6 }, { name: 'Sab', leads: 5 }, { name: 'Dom', leads: 4 },
  ];

  // KPI CARDS DEFINITIONS
  const generalKpis = summary ? [
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-600)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}><Users size={28} /></div>
      <div className="indicator-data">
        <label>Base de Clientes</label>
        <p>{summary.total_customers}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}><CheckCircle2 size={28} /></div>
      <div className="indicator-data">
        <label>Assinaturas Ativas</label>
        <p>{summary.active_subscriptions}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: summary.past_due_subscriptions > 0 ? 'var(--error)' : 'var(--success)' }}>
      <div className="indicator-icon-wrapper" style={{ background: summary.past_due_subscriptions > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: summary.past_due_subscriptions > 0 ? 'var(--error)' : 'white' }}>
        <AlertCircle size={28} />
      </div>
      <div className="indicator-data">
        <label>Atrasos Detectados</label>
        <p>{summary.past_due_subscriptions}</p>
      </div>
    </div>
  ] : [
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>,
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>,
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>
  ];

  const salesKpis = stats ? [
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--gold-500)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-500)' }}><Target size={28} /></div>
      <div className="indicator-data">
        <label>Total de Leads</label>
        <p>{stats.total_leads}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}><TrendingUp size={28} /></div>
      <div className="indicator-data">
        <label>Taxa Conversão</label>
        <p>{stats.conversion_rate}%</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><DollarSign size={28} /></div>
      <div className="indicator-data">
        <label>LTV Estimado</label>
        <p>R$ {(stats.total_revenue / (summary?.total_customers || 1)).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  ] : [
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>,
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>,
    <div className="indicator-card-luxury skeleton" style={{ height: '140px' }}></div>
  ];

  const cashFlowData = reportData ? [
    { name: 'Receita', value: reportData.total_revenue, fill: 'var(--success)' },
    { name: 'Despesas', value: reportData.total_expenses, fill: 'var(--error)' }
  ] : [];

  const dashboardTabs = [
    {
      label: 'Geral',
      content: (
        <div className="tab-fade-in">
          <KpiCarousel items={generalKpis} />
          <div className="grid-profile">
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Resumo de Operações</h3>
              </div>
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>Ticket Médio</h4>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-400)' }}>
                      R$ {(stats?.total_revenue / (summary?.total_customers || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp color="var(--gold-500)" opacity={0.5} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#60a5fa', display: 'block', marginBottom: '0.5rem' }}>Novos Leads</label>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats?.total_leads || 0}</span>
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#34d399', display: 'block', marginBottom: '0.5rem' }}>Conversões</label>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats?.converted_leads || 0}</span>
                  </div>
                </div>

                <div className="luxury-alert-box" style={{
                  background: summary?.past_due_subscriptions > 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: summary?.past_due_subscriptions > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: summary?.past_due_subscriptions > 0 ? 'var(--error)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertCircle size={20} color="white" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Saúde da Carteira</h5>
                    <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                      {summary?.past_due_subscriptions > 0
                        ? `Atenção: ${summary.past_due_subscriptions} assinaturas estão inadimplentes.`
                        : 'Todas as assinaturas estão em dia no momento.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Últimos Leads Capturados</h3>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats ? stats.recent_leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="list-row-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="indicator-icon-wrapper" style={{ width: 32, height: 32, background: 'var(--grad-gold)', color: 'var(--navy-950)', fontSize: '0.75rem', fontWeight: 800 }}>
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)' }}>{lead.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>{lead.email}</p>
                    </div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.35rem 0.6rem', borderRadius: '6px', background: lead.funil_stage === 'converted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)', color: lead.funil_stage === 'converted' ? '#34d399' : '#cbd5e1' }}>
                      {lead.funil_stage?.toUpperCase()}
                    </span>
                  </div>
                )) : (
                  [1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '50px', borderRadius: '10px' }}></div>)
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Vendas e Metas',
      content: (
        <div className="tab-fade-in">
          <KpiCarousel items={salesKpis} />
          <div className="grid-profile">
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Funil de Vendas (Leads)</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} stroke="rgba(255,255,255,0.4)" />
                      <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} stroke="rgba(255,255,255,0.4)" />
                      <Tooltip cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }} contentStyle={{ borderRadius: '12px', background: 'var(--navy-900)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      <Bar dataKey="leads" fill="var(--gold-500)" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Ranking de Faturamento/Cliente</h3>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {summary?.customer_ranking?.slice(0, 5).map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: idx === 0 ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: idx === 0 ? '1px solid var(--gold-500)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === 0 ? 'var(--grad-gold)' : 'rgba(255,255,255,0.1)', color: idx === 0 ? 'var(--navy-950)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.customer_name}</p>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: idx === 0 ? 'var(--gold-400)' : 'white' }}>R$ {c.total_revenue.toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Financeiro',
      content: (
        <div className="tab-fade-in">
          <KpiCarousel items={[
            <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
              <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><TrendingUp size={28} /></div>
              <div className="indicator-data">
                <label>Receita Líquida</label>
                <p>R$ {(stats?.total_revenue - summary?.total_expenses).toLocaleString('pt-BR')}</p>
              </div>
            </div>,
            <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
              <div className="indicator-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><CreditCard size={28} /></div>
              <div className="indicator-data">
                <label>Despesas Pagas</label>
                <p>R$ {summary?.total_expenses?.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ]} />
          <div className="grid-profile">
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Composição Financeira</h3>
              </div>
              <div style={{ padding: '1.5rem', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cashFlowData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                      {cashFlowData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="data-card-luxury" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <Activity size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
              <p style={{ opacity: 0.5 }}>Insights avançados de fluxo de caixa estarão disponíveis em breve.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="tenant-page-container">
      <header className="page-header-row">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>{user?.nome_empresa || `Dashboard`}</h1>
            {isValidating && (
              <span className="badge-syncing" title="Sincronizando com o servidor...">
                <Activity size={12} className="animate-pulse" /> Sincronizando
              </span>
            )}
          </div>
          <p>Ecossistema de Inteligência {user?.nicho_nome ? `para ${user.nicho_nome}` : ''}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => setShowLeadForm(true)}>
            <Plus size={20} /> Capturar Lead
          </button>
        </div>
      </header>

      <TabbedDashboard tabs={dashboardTabs} />

      {/* NEW LEAD MODAL */}
      {showLeadForm && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div className="modal-header-luxury">
              <h2>Capturar Prospect</h2>
              <button onClick={() => setShowLeadForm(false)} className="btn-icon" style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddLead} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input className="input-premium" placeholder="Ex: Lucas Silva" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email de Contato</label>
                <input className="input-premium" type="email" placeholder="lucas@exemplo.com" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input className="input-premium" placeholder="(11) 9..." value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Valor Previsto</label>
                  <input className="input-premium" type="number" placeholder="R$ 0,00" value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} />
                </div>
              </div>
              <footer style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLeadForm(false)}>Descartar</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Salvar Lead</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  if (user && user.role_global === 'master') {
    return <MasterAdminView />;
  }
  return <ClientDashboard />;
};

export default Dashboard;
