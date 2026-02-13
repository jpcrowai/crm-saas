import React, { useEffect, useState } from 'react';
import { getTenantStats, createLead, getTenantAdminStats, getReports } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, DollarSign, TrendingUp, Users, Plus, Activity, CreditCard, Shield, Upload, ArrowRight, XCircle, Target, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import KpiCarousel from '../components/KpiCarousel';
import TabbedDashboard from '../components/TabbedDashboard';
import '../styles/tenant-luxury.css';
import '../components/KpiCarousel.css';
import '../components/TabbedDashboard.css';

const MasterAdminView = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTenantAdminStats();
        setStats(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  if (!stats) return <div className="tenant-page-container" style={{ color: 'white' }}>Carregando dados do cliente...</div>;

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
          <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><Users size={28} /></div>
          <div className="indicator-data">
            <label>Contas de Usuário</label>
            <p>{stats.user_count}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: stats.payment_status === 'em dia' ? 'var(--success)' : 'var(--error)' }}>
          <div className="indicator-icon-wrapper" style={{ background: '#f8fafc', color: 'var(--navy-900)' }}><CreditCard size={28} /></div>
          <div className="indicator-data">
            <label>Status Financeiro</label>
            <p style={{ textTransform: 'uppercase', fontSize: '1.2rem' }}>{stats.payment_status}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-700)' }}>
          <div className="indicator-icon-wrapper" style={{ background: '#f1f5f9', color: 'var(--navy-800)' }}><Shield size={28} /></div>
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
  const [stats, setStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', value: 0 });
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        getTenantStats(),
        getReports()
      ]);
      setStats(statsRes.data);
      setReportData(reportsRes.data);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setShowLeadForm(false);
      setNewLead({ name: '', email: '', phone: '', value: 0 });
      loadData();
    } catch (error) {
      alert('Erro ao criar lead');
    }
  };

  const chartData = [
    { name: 'Seg', leads: 4 }, { name: 'Ter', leads: 3 }, { name: 'Qua', leads: 7 },
    { name: 'Qui', leads: 2 }, { name: 'Sex', leads: 6 }, { name: 'Sab', leads: 5 }, { name: 'Dom', leads: 4 },
  ];

  if (!stats || !reportData) return (
    <div className="tenant-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div className="loading-container">
        <Activity className="animate-pulse" size={48} color="var(--gold-400)" />
        <p style={{ marginTop: '1rem', fontWeight: 600 }}>Sincronizando ecossistema...</p>
      </div>
    </div>
  );

  // KPI CARDS DEFINITIONS
  const generalKpis = [
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-900)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-950)', color: 'white' }}><Users size={28} /></div>
      <div className="indicator-data">
        <label>Total de Leads</label>
        <p>{stats.total_leads}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><DollarSign size={28} /></div>
      <div className="indicator-data">
        <label>Receita Bruta</label>
        <p>R$ {stats.total_revenue.toLocaleString('pt-BR')}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
      <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><TrendingUp size={28} /></div>
      <div className="indicator-data">
        <label>Taxa de Conversão</label>
        <p>{stats.conversion_rate}%</p>
      </div>
    </div>
  ];

  const financeKpis = [
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><Target size={28} /></div>
      <div className="indicator-data">
        <label>ROI Médio / Lead</label>
        <p>R$ {(reportData.total_revenue / (reportData.total_leads || 1)).toFixed(2)}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
      <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><TrendingUp size={28} /></div>
      <div className="indicator-data">
        <label>Receita Líquida</label>
        <p>R$ {(reportData.total_revenue - reportData.total_expenses).toLocaleString('pt-BR')}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
      <div className="indicator-icon-wrapper" style={{ background: '#fef2f2', color: 'var(--error)' }}><CreditCard size={28} /></div>
      <div className="indicator-data">
        <label>Despesas Totais</label>
        <p>R$ {reportData.total_expenses.toLocaleString('pt-BR')}</p>
      </div>
    </div>
  ];

  const consultoriaKpis = [
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--gold-500)' }}>
      <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><Briefcase size={28} /></div>
      <div className="indicator-data">
        <label>Projetos Ativos</label>
        <p>{reportData.customer_ranking?.length || 0}</p>
      </div>
    </div>,
    <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-700)' }}>
      <div className="indicator-icon-wrapper" style={{ background: '#f1f5f9', color: 'var(--navy-800)' }}><Activity size={28} /></div>
      <div className="indicator-data">
        <label>Performance Média</label>
        <p>88%</p>
      </div>
    </div>
  ];

  const cashFlowData = [
    { name: 'Receita', value: reportData.total_revenue, fill: 'var(--success)' },
    { name: 'Despesas', value: reportData.total_expenses, fill: 'var(--error)' }
  ];

  const dashboardTabs = [
    {
      label: 'Geral',
      content: (
        <div className="tab-fade-in">
          <KpiCarousel items={generalKpis} />
          <div className="grid-profile">
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Atividade Comercial</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} />
                      <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem' }} />
                      <Tooltip cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="leads" fill="var(--gold-500)" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Últimas Movimentações</h3>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.recent_leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="list-row-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                    <div className="indicator-icon-wrapper" style={{ width: 32, height: 32, background: 'var(--navy-900)', color: 'white', fontSize: '0.75rem' }}>
                      {lead.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{lead.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.email}</p>
                    </div>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '4px', background: lead.status === 'converted' ? '#dcfce7' : '#f1f5f9', color: lead.status === 'converted' ? '#166534' : '#64748b' }}>
                      {lead.status}
                    </span>
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
          <KpiCarousel items={financeKpis} />
          <div className="grid-profile">
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Fluxo de Caixa</h3>
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
            <div className="data-card-luxury">
              <div className="data-card-header">
                <h3>Ranking VIP</h3>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reportData.customer_ranking?.slice(0, 5).map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: idx === 0 ? 'var(--gold-50)' : '#f8fafc', borderRadius: '10px', border: idx === 0 ? '1px solid var(--gold-400)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === 0 ? 'var(--grad-gold)' : 'var(--navy-900)', color: idx === 0 ? 'var(--navy-950)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.customer_name}</p>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>R$ {c.total_revenue.toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      label: 'Consultoria',
      content: (
        <div className="tab-fade-in">
          <KpiCarousel items={consultoriaKpis} />
          <div className="data-card-luxury" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--grad-premium)', color: 'white' }}>
            <Briefcase size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.5, color: 'var(--gold-400)' }} />
            <h3>Insights de Consultoria</h3>
            <p style={{ opacity: 0.7, maxWidth: '500px', margin: '0 auto' }}>Acompanhe aqui a evolução estratégica dos seus projetos e métricas de entrega.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="tenant-page-container">
      <header className="page-header-row">
        <div className="page-title-group">
          <h1>{user?.nome_empresa || `Dashboard`}</h1>
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
              <button onClick={() => setShowLeadForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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
