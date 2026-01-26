import React, { useEffect, useState } from 'react';
import { getTenantStats, createLead, getTenantAdminStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, DollarSign, TrendingUp, Users, Plus, Activity, CreditCard, Shield, Upload, ArrowRight, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../styles/tenant-luxury.css';

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
        <button className="btn-luxury" onClick={() => window.location.href = '/import-leads'}>
          <Upload size={18} /> Importar Base de Leads
        </button>
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
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', value: 0 });
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getTenantStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats", error);
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setShowLeadForm(false);
      setNewLead({ name: '', email: '', phone: '', value: 0 });
      loadStats();
    } catch (error) {
      alert('Erro ao criar lead');
    }
  };

  const chartData = [
    { name: 'Seg', leads: 4 }, { name: 'Ter', leads: 3 }, { name: 'Qua', leads: 7 },
    { name: 'Qui', leads: 2 }, { name: 'Sex', leads: 6 }, { name: 'Sab', leads: 5 }, { name: 'Dom', leads: 4 },
  ];

  if (!stats) return <div className="tenant-page-container" style={{ color: 'white' }}>Sincronizando dados...</div>;

  return (
    <div className="tenant-page-container">
      <header className="page-header-row">
        <div className="page-title-group">
          <h1>{user?.nome_empresa || `Dashboard`}</h1>
          <p>Visão estratégica do seu ecossistema de {user?.nicho_nome || 'negócio'}</p>
        </div>
        <button className="btn-luxury-gold" onClick={() => setShowLeadForm(true)} style={{ borderRadius: '12px' }}>
          <Plus size={20} /> Capturar Novo Lead
        </button>
      </header>

      <div className="indicator-grid">
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-900)' }}>
          <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-950)', color: 'white' }}><Users size={28} /></div>
          <div className="indicator-data">
            <label>Total de Leads</label>
            <p>{stats.total_leads}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
          <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><DollarSign size={28} /></div>
          <div className="indicator-data">
            <label>Receita Projetada</label>
            <p>R$ {stats.total_revenue.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
          <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><TrendingUp size={28} /></div>
          <div className="indicator-data">
            <label>Taxa de Conversão</label>
            <p>{stats.conversion_rate}%</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        {/* CHART DATA CARD */}
        <div className="data-card-luxury">
          <div className="data-card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Atividade Comercial (7 Dias)</h3>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.8rem', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.8rem', fontWeight: 600 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  />
                  <Bar dataKey="leads" fill="var(--gold-500)" radius={[6, 6, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RECENT LEADS DATA CARD */}
        <div className="data-card-luxury">
          <div className="data-card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Últimas Movimentações</h3>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recent_leads.map((lead) => (
              <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', transition: 'var(--transition)' }} className="list-row-hover">
                <div className="indicator-icon-wrapper" style={{ width: 36, height: 36, background: 'var(--navy-900)', color: 'white', fontSize: '0.85rem', fontWeight: 800 }}>
                  {lead.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>{lead.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</p>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.35rem 0.65rem', borderRadius: '6px', background: lead.status === 'converted' ? '#dcfce7' : '#f1f5f9', color: lead.status === 'converted' ? '#166534' : '#64748b' }}>
                  {lead.status}
                </span>
              </div>
            ))}
            {stats.recent_leads.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>Nenhuma atividade recente.</p>}
          </div>
        </div>
      </div>

      {/* NEW LEAD MODAL - LUXURY VERSION */}
      {showLeadForm && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '440px', padding: '0', overflow: 'hidden' }}>
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
                <button type="button" className="btn-secondary-premium" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowLeadForm(false)}>Descartar</button>
                <button type="submit" className="btn-primary-premium" style={{ flex: 2, padding: '0.85rem' }}>Salvar Lead</button>
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
