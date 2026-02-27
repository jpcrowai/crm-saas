import React, { useEffect, useState } from 'react';
import { getMasterAmbientes, createAmbiente, selectTenant, updateAmbiente, getNiches, createNiche, deleteAmbiente, getMasterEnvironmentContract, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Briefcase, Settings, CheckCircle, XCircle, DollarSign, Activity, Layers, Trash2, Shield, Save, Target, Users, Calendar, Package, Truck, Zap, Receipt, CreditCard, History } from 'lucide-react';
import '../styles/master-admin.css';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: <Activity size={14} /> },
  { id: 'leads_pipeline', label: 'Pipeline / CRM', icon: <Target size={14} /> },
  { id: 'agenda', label: 'Agenda', icon: <Calendar size={14} /> },
  { id: 'clientes', label: 'Clientes', icon: <Users size={14} /> },
  { id: 'equipe', label: 'Profissionais + Comissões', icon: <Briefcase size={14} /> },
  { id: 'fornecedores', label: 'Fornecedores', icon: <Truck size={14} /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={14} /> },
  { id: 'produtos', label: 'Catálogo de Produtos', icon: <Package size={14} /> },
  { id: 'assinaturas', label: 'Planos + Assinaturas', icon: <Shield size={14} /> },
  { id: 'ai_agent', label: 'IA Copilot', icon: <Zap size={14} /> }
];

const MasterAmbientes = () => {
  const [ambientes, setAmbientes] = useState([]);
  const [niches, setNiches] = useState([]);
  const [newEnv, setNewEnv] = useState({
    nome_empresa: '', slug: '', cnpj: '', endereco: '', nicho_id: '', cor_principal: '#d4af37',
    admin_email: '', admin_password: '', plan: 'basic', payment_status: 'trial',
    plan_price: 199.90, billing_cycle: 'mensal', has_trial: true, payment_due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    modulos_habilitados: AVAILABLE_MODULES.map(m => m.id),
    logo: null
  });

  const [showForm, setShowForm] = useState(false);
  const [showNicheModal, setShowNicheModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('ambientes'); // 'ambientes' | 'planos' | 'faturamento'

  const [newNiche, setNewNiche] = useState({ id: null, name: '', description: '' });

  const [plans, setPlans] = useState([
    { id: 1, name: 'BASIC', price: 97.90, users_limit: 3, description: 'Plano inicial para pequenos negócios', modulos: ['financeiro', 'agenda', 'clientes', 'vendas'] },
    { id: 2, name: 'PRO', price: 197.90, users_limit: 10, description: 'O plano mais vendido para crescimento estruturado', modulos: ['financeiro', 'agenda', 'clientes', 'profissionais', 'produtos', 'vendas'] },
    { id: 3, name: 'ENTERPRISE', price: 497.90, users_limit: 999, description: 'Tudo liberado. Foco no escalonamento e BI', modulos: AVAILABLE_MODULES.map(m => m.id) }
  ]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, users_limit: 1, description: '', modulos: [] });

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [envRes, nicheRes] = await Promise.all([getMasterAmbientes(), getNiches()]);
      setAmbientes(envRes.data);
      setNiches(nicheRes.data);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newEnv).forEach(key => {
      if (key === 'modulos_habilitados') {
        formData.append(key, JSON.stringify(newEnv[key]));
      } else if (key === 'logo') {
        if (newEnv.logo) formData.append('logo', newEnv.logo);
      } else {
        formData.append(key, newEnv[key]);
      }
    });

    try {
      await createAmbiente(formData);
      setNewEnv({
        nome_empresa: '', slug: '', cnpj: '', endereco: '', nicho_id: '', cor_principal: '#d4af37',
        admin_email: '', admin_password: '', plan: 'basic', payment_status: 'trial',
        plan_price: 199.90, billing_cycle: 'mensal', has_trial: true, payment_due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        modulos_habilitados: AVAILABLE_MODULES.map(m => m.id),
        logo: null
      });
      setLogoPreview(null);
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error("Erro ao criar ambiente: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async (slug, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'modulos_habilitados') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'logo') {
        if (data.logo instanceof File) formData.append('logo', data.logo);
      } else if (key === 'contract_file') {
        if (data.contract_file instanceof File) formData.append('contract_file', data.contract_file);
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    try {
      await updateAmbiente(slug, formData);
      loadData();
      setEditingEnv(null);
      setLogoPreview(null);
    } catch (error) {
      toast.error("Erro ao atualizar ambiente: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleDownloadContract = async (slug) => {
    try {
      const response = await getMasterEnvironmentContract(slug);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrato_${slug}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Erro ao baixar contrato: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateNiche = async (e) => {
    e.preventDefault();
    try {
      if (newNiche.id) {
        const { updateNiche } = await import('../services/api');
        await updateNiche(newNiche.id, { name: newNiche.name, description: newNiche.description, ativo: true });
      } else {
        await createNiche({ name: newNiche.name, description: newNiche.description });
      }
      setNewNiche({ id: null, name: '', description: '' });
      loadData();
      toast.success("Nicho salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar nicho.");
    }
  };

  const handleFileChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem válida (PNG, JPG, etc).");
        e.target.value = ""; // Clear input
        return;
      }
      // Vercel limit is 4.5MB. We'll set 4MB to be safe.
      if (file.size > 4.5 * 1024 * 1024) {
        toast.error("A imagem é muito grande. O limite máximo é 4.5MB.");
        e.target.value = ""; // Clear input
        return;
      }
      if (isEditing) setEditingEnv({ ...editingEnv, logo: file });
      else setNewEnv({ ...newEnv, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    setPlans([...plans, { ...newPlan, id: Date.now() }]);
    setShowPlanForm(false);
    toast.success('Plano criado com sucesso!');
  };

  const handleUpdatePlan = (e) => {
    e.preventDefault();
    setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
    setEditingPlan(null);
    toast.success('Plano atualizado com sucesso!');
  };

  const getNicheName = (id) => niches.find(n => n.id === id)?.name || 'N/A';

  return (
    <div className="page-container">
      <header className="page-header-row" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Gestão Ecosystem</h1>
          <p className="text-muted" style={{ fontWeight: 500 }}>Controle de Ambientes, Faturamento e Planos</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => setShowNicheModal(true)}>
            <Layers size={18} /> Gerenciar Nichos
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Novo Cliente
          </button>
        </div>
      </header>

      {/* TABS NAVEGAÇÃO INTERNA */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-soft)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('ambientes')}
          style={{ background: 'none', border: 'none', padding: '1rem 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: activeTab === 'ambientes' ? 'var(--gold-600)' : 'var(--navy-600)', borderBottom: activeTab === 'ambientes' ? '3px solid var(--gold-600)' : '3px solid transparent' }}
        >
          <Briefcase size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} /> Ambientes Clients
        </button>
        <button
          onClick={() => setActiveTab('planos')}
          style={{ background: 'none', border: 'none', padding: '1rem 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: activeTab === 'planos' ? 'var(--gold-600)' : 'var(--navy-600)', borderBottom: activeTab === 'planos' ? '3px solid var(--gold-600)' : '3px solid transparent' }}
        >
          <Layers size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} /> Planos & Produtos
        </button>
        <button
          onClick={() => setActiveTab('faturamento')}
          style={{ background: 'none', border: 'none', padding: '1rem 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: activeTab === 'faturamento' ? 'var(--gold-600)' : 'var(--navy-600)', borderBottom: activeTab === 'faturamento' ? '3px solid var(--gold-600)' : '3px solid transparent' }}
        >
          <Receipt size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-3px' }} /> Faturamento e Histórico
        </button>
      </div>

      {/* NEW ENVIRONMENT MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="card modal-large">
            <div className="modal-header-luxury">
              <div>
                <h2>Ativar Novo Ambiente</h2>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Configure o acesso e permissões do novo parceiro.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-close-modal"><XCircle size={20} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body-grid">
                {/* Column 1: Core Data */}
                <div>
                  <h4 className="form-section-title">Dados da Empresa</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Nome Fantasia</label>
                      <input className="input-premium" placeholder="Ex: Barbearia Tadeu's" value={newEnv.nome_empresa} onChange={e => setNewEnv({ ...newEnv, nome_empresa: e.target.value })} required />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>CNPJ / Documento</label>
                        <input className="input-premium" placeholder="00.000.000/0000-00" value={newEnv.cnpj} onChange={e => setNewEnv({ ...newEnv, cnpj: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Endereço Completo</label>
                        <input className="input-premium" placeholder="Rua, Número, Cidade - UF" value={newEnv.endereco} onChange={e => setNewEnv({ ...newEnv, endereco: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Slug (URL)</label>
                        <input placeholder="tadeu-barber" value={newEnv.slug} onChange={e => setNewEnv({ ...newEnv, slug: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Nicho</label>
                        <select value={newEnv.nicho_id} onChange={e => setNewEnv({ ...newEnv, nicho_id: e.target.value })} required>
                          <option value="">Selecione...</option>
                          {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>E-mail Admin</label>
                        <input type="email" placeholder="admin@empresa.com" value={newEnv.admin_email} onChange={e => setNewEnv({ ...newEnv, admin_email: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Senha Inicial</label>
                        <input className="input-premium" type="password" placeholder="••••••••" value={newEnv.admin_password} onChange={e => setNewEnv({ ...newEnv, admin_password: e.target.value })} required />
                      </div>
                    </div>

                    <h4 className="form-section-title" style={{ marginTop: '0.5rem' }}>Configurações de Cobrança / Licença</h4>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>Plano</label>
                        <select value={newEnv.plan} onChange={e => setNewEnv({ ...newEnv, plan: e.target.value })}>
                          <option value="basic">BASIC</option>
                          <option value="pro">PRO</option>
                          <option value="enterprise">ENTERPRISE</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Ciclo de Cobrança</label>
                        <select value={newEnv.billing_cycle} onChange={e => setNewEnv({ ...newEnv, billing_cycle: e.target.value })}>
                          <option value="mensal">Mensal</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="semestral">Semestral</option>
                          <option value="anual">Anual</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Valor Recorrente (R$)</label>
                        <input type="number" step="0.01" className="input-premium" value={newEnv.plan_price} onChange={e => setNewEnv({ ...newEnv, plan_price: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className="form-group">
                        <label>Vencimento do Primeiro Pagamento</label>
                        <input type="date" className="input-premium" value={newEnv.payment_due_date} onChange={e => setNewEnv({ ...newEnv, payment_due_date: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Conceder Teste Grátis de Início (Trial)?</label>
                        <select value={newEnv.has_trial} onChange={e => setNewEnv({ ...newEnv, has_trial: e.target.value === 'true' })}>
                          <option value="true">Sim (Tem período grátis inicial)</option>
                          <option value="false">Não (Cobrar imediatamente)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Logotipo</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Briefcase size={24} color="var(--text-muted)" />}
                        </div>
                        <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.8rem', textTransform: 'none' }}>
                          Upload Logo
                          <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Modules Selection */}
                <div>
                  <h4 className="form-section-title">Módulos Habilitados</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Controle granular de acesso do tenant.</p>
                  <div className="modules-selector-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {AVAILABLE_MODULES.map(m => (
                      <label key={m.id} className={`selection-card ${newEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`} style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-soft)', background: newEnv.modulos_habilitados.includes(m.id) ? 'var(--gold-50)' : 'white' }}>
                        <input type="checkbox" hidden checked={newEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...newEnv.modulos_habilitados, m.id] : newEnv.modulos_habilitados.filter(x => x !== m.id);
                          setNewEnv({ ...newEnv, modulos_habilitados: mods });
                        }} />
                        <span style={{ color: newEnv.modulos_habilitados.includes(m.id) ? 'var(--gold-600)' : 'var(--text-muted)' }}>{m.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: newEnv.modulos_habilitados.includes(m.id) ? 'var(--navy-900)' : 'var(--text-muted)' }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <footer style={{ padding: '2rem 3rem', background: '#f8fafc', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Ativar Ambiente</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingEnv && (
        <div className="modal-overlay">
          <div className="card modal-large">
            <div className="modal-header-luxury">
              <div>
                <h2>Configurações do Cliente</h2>
                <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Ajustando: <strong>{editingEnv.nome_empresa}</strong></p>
              </div>
              <button onClick={() => { setEditingEnv(null); setLogoPreview(null); }} className="btn-close-modal"><XCircle size={20} /></button>
            </div>

            <div>
              <div className="modal-body-grid">
                <div>
                  <h4 className="form-section-title">Informações Gerais</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label>Nome Fantasia</label>
                      <input className="input-premium" value={editingEnv.nome_empresa} onChange={e => setEditingEnv({ ...editingEnv, nome_empresa: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>CNPJ</label>
                        <input className="input-premium" value={editingEnv.cnpj || ''} onChange={e => setEditingEnv({ ...editingEnv, cnpj: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Endereço</label>
                        <input className="input-premium" value={editingEnv.endereco || ''} onChange={e => setEditingEnv({ ...editingEnv, endereco: e.target.value })} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>Nicho</label>
                        <select className="input-premium" value={editingEnv.nicho_id} onChange={e => setEditingEnv({ ...editingEnv, nicho_id: e.target.value })}>
                          {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <h4 className="form-section-title" style={{ marginTop: '1.5rem' }}>Configurações de Cobrança / Licença</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>Ciclo de Cobrança</label>
                        <select className="input-premium" value={editingEnv.billing_cycle || 'mensal'} onChange={e => setEditingEnv({ ...editingEnv, billing_cycle: e.target.value })}>
                          <option value="mensal">Mensal</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="semestral">Semestral</option>
                          <option value="anual">Anual</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Plano</label>
                        <select className="input-premium" value={editingEnv.plan} onChange={e => setEditingEnv({ ...editingEnv, plan: e.target.value })}>
                          <option value="basic">BASIC</option>
                          <option value="pro">PRO</option>
                          <option value="enterprise">ENTERPRISE</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>Valor Recorrente (R$)</label>
                        <input type="number" step="0.01" className="input-premium" value={editingEnv.plan_price || 0} onChange={e => setEditingEnv({ ...editingEnv, plan_price: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className="form-group">
                        <label>Vencimento do Próximo Pagamento</label>
                        <input type="date" className="input-premium" value={(editingEnv.payment_due_date || '').split('T')[0]} onChange={e => setEditingEnv({ ...editingEnv, payment_due_date: e.target.value })} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem', alignItems: 'end' }}>
                      <div className="form-group">
                        <label>Status de Pagamento (Forçar Manualmente)</label>
                        <select className="input-premium" value={editingEnv.payment_status} onChange={e => setEditingEnv({ ...editingEnv, payment_status: e.target.value })}>
                          <option value="trial">Trial / Degustação</option>
                          <option value="active">Pagamento em Dia</option>
                          <option value="pending">Pagamento Pendente</option>
                          <option value="overdue">Atrasado (Inadimplente)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status do Ambiente (Trava de Uso)</label>
                        <select className="input-premium" value={editingEnv.ativo} onChange={e => setEditingEnv({ ...editingEnv, ativo: e.target.value === 'true' })}>
                          <option value="true">1. Ativo e Funcionando</option>
                          <option value="false">2. Bloqueado / Inativo</option>
                        </select>
                      </div>
                    </div>

                    <h4 className="form-section-title" style={{ marginTop: '1.5rem' }}>Logo</h4>
                    <div className="form-group">
                      <label>Identidade Visual</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'white', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                          <img src={logoPreview || (editingEnv.logo_url ? `${API_URL}${editingEnv.logo_url}` : '')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <label className="btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem 1.1rem', fontSize: '0.8rem', textTransform: 'none' }}>
                          Trocar Imagem
                          <input type="file" hidden onChange={e => handleFileChange(e, true)} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="form-section-title">Permissões de Acesso</h4>
                  <div className="modules-selector-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {AVAILABLE_MODULES.map(m => (
                      <label key={m.id} className={`selection-card ${editingEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`} style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: editingEnv.modulos_habilitados.includes(m.id) ? '1px solid var(--gold-500)' : '1px solid var(--border-soft)', background: editingEnv.modulos_habilitados.includes(m.id) ? 'var(--gold-50)' : 'white' }}>
                        <input type="checkbox" hidden checked={editingEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...editingEnv.modulos_habilitados, m.id] : editingEnv.modulos_habilitados.filter(x => x !== m.id);
                          setEditingEnv({ ...editingEnv, modulos_habilitados: mods });
                        }} />
                        <span style={{ color: editingEnv.modulos_habilitados.includes(m.id) ? 'var(--gold-600)' : 'var(--text-muted)' }}>{m.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: editingEnv.modulos_habilitados.includes(m.id) ? 'var(--navy-900)' : 'var(--text-muted)' }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="form-section-title">Contrato & Compliance</h4>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>Status do Contrato</span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: editingEnv.contract_status === 'signed' ? 'var(--success)' : 'var(--error)'
                        }}>
                          {editingEnv.contract_status === 'signed' ? '✍ ASSINADO E VÁLIDO' : '⚠ PENDENTE DE ASSINATURA'}
                        </span>
                      </div>
                      <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handleDownloadContract(editingEnv.slug)}>
                        <Shield size={14} /> Baixar PDF
                      </button>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>Upload do Contrato Assinado</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="file"
                          accept=".pdf"
                          className="input-premium"
                          style={{ padding: '0.5rem' }}
                          onChange={e => {
                            if (e.target.files[0]) {
                              setEditingEnv({ ...editingEnv, contract_file: e.target.files[0] });
                            }
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        * O ambiente só poderá ser ativado após o upload do contrato assinado.
                      </p>
                    </div>

                    {editingEnv.contract_signed_url && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={14} /> Contrato assinado em arquivo.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <footer style={{ padding: '2rem 3rem', background: '#f8fafc', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => { setEditingEnv(null); setLogoPreview(null); }}>Fechar</button>
                <button className="btn-primary" onClick={() => handleUpdate(editingEnv.slug, editingEnv)}>Salvar Mudanças</button>
              </footer>
            </div>
          </div >
        </div >
      )}

      {/* NICHE MODAL */}
      {
        showNicheModal && (
          <div className="modal-overlay">
            <div className="card" style={{ width: '600px', padding: '0', overflow: 'hidden' }}>
              <div className="modal-header-luxury">
                <h2>Nichos de Mercado</h2>
                <button onClick={() => setShowNicheModal(false)} className="btn-close-modal"><XCircle size={20} /></button>
              </div>
              <div style={{ padding: '2.5rem' }}>
                <form onSubmit={handleCreateNiche} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Título do Nicho</label>
                    <input className="input-premium" placeholder="Ex: Academia, Clínica..." value={newNiche.name} onChange={e => setNewNiche({ ...newNiche, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea className="input-premium" rows={3} placeholder="Descreva as características deste nicho..." value={newNiche.description} onChange={e => setNewNiche({ ...newNiche, description: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Salvar Nicho</button>
                </form>

                <div style={{ marginTop: '2rem', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-app)', padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configurações Ativas</div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--white)' }}>
                    {niches.map(n => (
                      <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-soft)', background: 'var(--white)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{n.name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => setNewNiche({ id: n.id, name: n.name, description: n.description || '' })}><Settings size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* ENVIRONMENTS LISTING */}
      {activeTab === 'ambientes' && (
        <div className="card-grid">
          {ambientes.map(env => {
            const tierClass = env.plan === 'enterprise' ? 'env-tier-enterprise' :
              env.plan === 'pro' ? 'env-tier-pro' : 'env-tier-trial';
            return (
              <div key={env.id} className="env-card-wrapper">
                {/* Contract Pending Badge - ON WRAPPER, outside card */}
                {env.contract_status !== 'signed' && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '-10px',
                    background: 'var(--error)', color: 'white',
                    borderRadius: '50%', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
                    border: '3px solid white', fontSize: '14px', fontWeight: '900',
                    zIndex: 10
                  }} title="Pendente de Contrato">!</div>
                )}

                <div className={`env-card ${env.ativo !== false ? 'active' : ''}`}>
                  {/* Tiered Plan Header */}
                  <div className={`env-plan-header ${tierClass}`}></div>

                  {/* Settings Button - Top Right */}
                  <button
                    className="btn-icon btn-icon-settings"
                    style={{ position: 'absolute', top: '20px', right: '16px', zIndex: 5 }}
                    onClick={() => { setEditingEnv(env); setLogoPreview(null); }}
                  >
                    <Settings size={18} />
                  </button>

                  {/* Card Body */}
                  <div className="env-card-body">
                    <div className="env-card-header">
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div className="env-logo-wrapper" style={{ background: 'white', position: 'relative' }}>
                          {env.logo_url ? <img src={`${API_URL}${env.logo_url}`} alt="" /> : <Shield size={28} color="var(--primary)" />}
                        </div>
                        <div className="env-info">
                          <h3>{env.nome_empresa}</h3>
                          <span style={{ fontWeight: 700, opacity: 0.7 }}>/{env.slug}</span>
                        </div>
                      </div>
                    </div>

                    <div className="env-stats-row" style={{ background: 'var(--bg-app)', border: '1px solid var(--border-soft)' }}>
                      <div className="env-stat-item">
                        <label>Setor</label>
                        <p style={{ fontWeight: 700, color: 'var(--navy-800)' }}>{getNicheName(env.nicho_id)}</p>
                      </div>
                      <div className="env-stat-item">
                        <label>Plano</label>
                        <p style={{ color: 'var(--gold-600)', fontWeight: 800 }}>{env.plan?.toUpperCase()}</p>
                      </div>
                      <div className="env-stat-item">
                        <label>Pagamento</label>
                        <p style={{
                          fontWeight: 800,
                          color: env.payment_status === 'active' ? 'var(--success)' :
                            env.payment_status === 'overdue' ? 'var(--error)' : 'var(--gold-500)'
                        }}>
                          {env.payment_status === 'active' ? 'EM DIA' :
                            env.payment_status === 'overdue' ? 'ATRASADO' :
                              env.payment_status === 'pending' ? 'PENDENTE' : 'TRIAL'}
                        </p>
                      </div>
                    </div>

                    <div className="env-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {env.modulos_habilitados.map(mId => {
                        const mod = AVAILABLE_MODULES.find(x => x.id === mId);
                        if (!mod) return null;
                        return (
                          <span key={mId} className="module-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.65rem' }}>
                            {mod.icon}
                            {mod.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="relationship-management" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gold-50)', borderRadius: '12px', border: '1px solid var(--gold-200)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-800)', textTransform: 'uppercase' }}>Faturamento & Relacionamento</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{env.billing_cycle?.toUpperCase() || 'MENSAL'}</span>
                          <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>R$ {(env.plan_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Próx. Vencimento:</span>
                          <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{env.payment_due_date ? new Date(env.payment_due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }} onClick={() => toast.info('Funcionalidade de cobrança em implementação')}>
                            <Receipt size={14} /> Cobrança
                          </button>
                          <button className="btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }} onClick={() => toast.info('Histórico financeiro em breve')}>
                            <History size={14} /> Histórico
                          </button>
                        </div>
                      </div>
                    </div>

                    <footer style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '1.5rem', alignItems: 'end', justifyContent: 'space-between' }}>
                      <button className="btn-primary" style={{ flex: 1, background: 'var(--gold-500)', border: '1px solid var(--gold-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => { setEditingEnv(env); setLogoPreview(null); }}>
                        <Settings size={16} /> CONFIGURAR CONTRATO
                      </button>
                      <button className="btn-icon btn-icon-danger" onClick={() => deleteAmbiente(env.slug).then(loadData)}>
                        <Trash2 size={18} />
                      </button>
                    </footer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PLANOS TAB */}
      {activeTab === 'planos' && (
        <div style={{ padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)' }}>Planos Master</h2>
              <p style={{ color: 'var(--text-muted)' }}>Controle e limite o tamanho das operações de seus locatários.</p>
            </div>
            <button className="btn-primary" onClick={() => { setNewPlan({ name: '', price: 0, users_limit: 1, description: '', modulos: [] }); setShowPlanForm(true); }}>
              <Plus size={20} /> Criar Novo Plano
            </button>
          </div>

          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {plans.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-app)', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--navy-900)', textTransform: 'uppercase' }}>{p.name}</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold-600)', marginTop: '0.25rem' }}>R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>/mês</span></div>
                  </div>
                  <button className="btn-icon" onClick={() => setEditingPlan(p)}>
                    <Settings size={18} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.description}</p>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Limites do Assinante</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Usuários Permitidos</span>
                      <span style={{ fontWeight: 800, color: 'var(--navy-900)' }}>{p.users_limit === 999 ? 'Ilimitado' : p.users_limit}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--navy-900)', margin: '1rem 0 0.5rem' }}>Módulos Inclusos ({p.modulos.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {p.modulos.map(mId => {
                        const mod = AVAILABLE_MODULES.find(x => x.id === mId);
                        if (!mod) return null;
                        return (
                          <span key={mId} className="module-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.65rem', background: 'var(--navy-50)', color: 'var(--navy-700)', border: '1px solid var(--navy-200)' }}>
                            {mod.icon} {mod.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PLANOS (CRIAR E EDITAR) */}
      {(showPlanForm || editingPlan) && (
        <div className="modal-overlay">
          <div className="card modal-large" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header-luxury">
              <h2>{editingPlan ? `Editar Plano ${editingPlan.name}` : 'Criar Novo Plano SaaS'}</h2>
              <button className="btn-close-modal" onClick={() => { setShowPlanForm(false); setEditingPlan(null); }}>
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} style={{ padding: '2rem 3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>Nome do Plano (Visão Pública)</label>
                    <input className="input-premium" placeholder="Ex: STARTER, LITE..." value={editingPlan ? editingPlan.name : newPlan.name} onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, name: e.target.value }) : setNewPlan({ ...newPlan, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Valor Recorrente (R$)</label>
                    <input type="number" step="0.01" className="input-premium" value={editingPlan ? editingPlan.price : newPlan.price} onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 }) : setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
                  <div className="form-group">
                    <label>Descrição Institucional</label>
                    <input className="input-premium" placeholder="Ex: Plano ideal de entrada para..." value={editingPlan ? editingPlan.description : newPlan.description} onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, description: e.target.value }) : setNewPlan({ ...newPlan, description: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Limite de Usuários (Staff)</label>
                    <input type="number" className="input-premium" placeholder="999 para infinito" value={editingPlan ? editingPlan.users_limit : newPlan.users_limit} onChange={e => editingPlan ? setEditingPlan({ ...editingPlan, users_limit: parseInt(e.target.value) || 1 }) : setNewPlan({ ...newPlan, users_limit: parseInt(e.target.value) || 1 })} required />
                  </div>
                </div>

                <div>
                  <h4 className="form-section-title" style={{ marginTop: '1rem' }}>Módulos Habilitados</h4>
                  <div className="modules-selector-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {AVAILABLE_MODULES.map(m => {
                      const isActive = editingPlan ? editingPlan.modulos.includes(m.id) : newPlan.modulos.includes(m.id);
                      return (
                        <label key={m.id} className={`selection-card ${isActive ? 'selected' : ''}`} style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', border: isActive ? '1px solid var(--gold-500)' : '1px solid var(--border-soft)', background: isActive ? 'var(--gold-50)' : 'white' }}>
                          <input type="checkbox" hidden checked={isActive} onChange={e => {
                            if (editingPlan) {
                              const mods = e.target.checked ? [...editingPlan.modulos, m.id] : editingPlan.modulos.filter(x => x !== m.id);
                              setEditingPlan({ ...editingPlan, modulos: mods });
                            } else {
                              const mods = e.target.checked ? [...newPlan.modulos, m.id] : newPlan.modulos.filter(x => x !== m.id);
                              setNewPlan({ ...newPlan, modulos: mods });
                            }
                          }} />
                          <span style={{ color: isActive ? 'var(--gold-600)' : 'var(--text-muted)' }}>{m.icon}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'var(--navy-900)' : 'var(--text-muted)' }}>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <footer style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-soft)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowPlanForm(false); setEditingPlan(null); }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ minWidth: '150px' }}>{editingPlan ? 'Salvar Edição' : 'Criar Plano'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* FATURAMENTO TAB */}
      {activeTab === 'faturamento' && (
        <div className="card" style={{ padding: '0', background: 'var(--white)', overflow: 'hidden' }}>
          <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-app)' }}>
            <h2>Faturamento e Histórico Consolidado</h2>
            <p style={{ color: 'var(--text-muted)' }}>Métricas gerais e controle da inatividade por falta de pagamento.</p>
          </div>

          <div style={{ padding: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-soft)', borderRadius: '12px', background: 'var(--white)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>MRR Total (Receita Recorrente Máxima)</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--navy-900)' }}>
                R$ {ambientes.reduce((acc, env) => acc + (env.plan_price || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid var(--border-soft)', borderRadius: '12px', background: 'var(--white)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Ambientes Ativos</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>
                {ambientes.filter(a => a.ativo).length}
              </div>
            </div>

            <div style={{ padding: '1.5rem', border: '1px solid var(--error)', borderRadius: '12px', background: '#fef2f2' }}>
              <div style={{ fontSize: '0.8rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 800 }}>Inadimplentes (Aviso Constante)</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#991b1b' }}>
                {ambientes.filter(a => a.payment_status === 'overdue').length}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 3rem 3rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--navy-900)' }}>Detalhes por Tenant</h4>
            <div style={{ border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-soft)' }}>
                  <tr>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ciclo</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Próx. Vencimento</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {ambientes.map(env => (
                    <tr key={env.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--navy-900)' }}>{env.nome_empresa}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{env.billing_cycle?.toUpperCase() || 'MENSAL'}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>R$ {(env.plan_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{env.payment_due_date ? new Date(env.payment_due_date).toLocaleDateString('pt-BR') : '---'}</td>
                      <td style={{ padding: '1rem' }}>
                        {env.payment_status === 'overdue' && <span style={{ color: '#991b1b', background: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Atrasado</span>}
                        {env.payment_status === 'active' && <span style={{ color: '#166534', background: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Em Dia</span>}
                        {env.payment_status === 'trial' && <span style={{ color: '#b45309', background: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Em Trial</span>}
                        {env.payment_status === 'pending' && <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Pendente</span>}
                        {(!env.payment_status) && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Indefinido</span>}
                      </td>
                    </tr>
                  ))}
                  {ambientes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum ambiente comercializado ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MasterAmbientes;
