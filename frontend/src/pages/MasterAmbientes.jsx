import React, { useEffect, useState } from 'react';
import { getMasterAmbientes, createAmbiente, selectTenant, updateAmbiente, getNiches, createNiche, deleteAmbiente, getMasterEnvironmentContract, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Briefcase, Settings, CheckCircle, XCircle, DollarSign, Activity, Layers, Trash2, Shield, Save } from 'lucide-react';
import '../styles/master-admin.css';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'leads_pipeline', label: 'Leads / Pipeline' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'ai_agent', label: 'Agente de IA (Módulo Adicional)' }
];

const MasterAmbientes = () => {
  const [ambientes, setAmbientes] = useState([]);
  const [niches, setNiches] = useState([]);
  const [newEnv, setNewEnv] = useState({
    nome_empresa: '', slug: '', cnpj: '', endereco: '', nicho_id: '', cor_principal: '#d4af37',
    admin_email: '', admin_password: '', plan: 'basic', payment_status: 'trial',
    modulos_habilitados: AVAILABLE_MODULES.map(m => m.id),
    logo: null
  });

  const [showForm, setShowForm] = useState(false);
  const [showNicheModal, setShowNicheModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [newNiche, setNewNiche] = useState({ id: null, name: '', description: '' });

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

  const getNicheName = (id) => niches.find(n => n.id === id)?.name || 'N/A';

  return (
    <div className="page-container">
      <header className="page-header-row" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2rem', fontWeight: 800 }}>Gestão de Ambientes</h1>
          <p className="text-muted" style={{ fontWeight: 500 }}>Ecosystem Management & Control</p>
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

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>E-mail Admin</label>
                        <input type="email" placeholder="admin@empresa.com" value={newEnv.admin_email} onChange={e => setNewEnv({ ...newEnv, admin_email: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Plano</label>
                        <select value={newEnv.plan} onChange={e => setNewEnv({ ...newEnv, plan: e.target.value })}>
                          <option value="basic">BASIC</option>
                          <option value="pro">PRO</option>
                          <option value="enterprise">ENTERPRISE</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                      <div className="form-group">
                        <label>Status de Pagamento</label>
                        <select value={newEnv.payment_status} onChange={e => setNewEnv({ ...newEnv, payment_status: e.target.value })}>
                          <option value="trial">Trial / Degustação</option>
                          <option value="active">Pagamento em Dia</option>
                          <option value="pending">Pagamento Pendente</option>
                          <option value="overdue">Atrasado</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Senha Inicial</label>
                        <input className="input-premium" type="password" placeholder="••••••••" value={newEnv.admin_password} onChange={e => setNewEnv({ ...newEnv, admin_password: e.target.value })} required />
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
                  <div className="modules-selector-grid">
                    {AVAILABLE_MODULES.map(m => (
                      <label key={m.id} className={`selection-card ${newEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={newEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...newEnv.modulos_habilitados, m.id] : newEnv.modulos_habilitados.filter(x => x !== m.id);
                          setNewEnv({ ...newEnv, modulos_habilitados: mods });
                        }} />
                        <div className="selection-card-content">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.label}</span>
                        </div>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>CNPJ</label>
                        <input className="input-premium" value={editingEnv.cnpj || ''} onChange={e => setEditingEnv({ ...editingEnv, cnpj: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Endereço</label>
                        <input className="input-premium" value={editingEnv.endereco || ''} onChange={e => setEditingEnv({ ...editingEnv, endereco: e.target.value })} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Nicho</label>
                        <select className="input-premium" value={editingEnv.nicho_id} onChange={e => setEditingEnv({ ...editingEnv, nicho_id: e.target.value })}>
                          {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                      <div className="form-group">
                        <label>Status de Pagamento</label>
                        <select className="input-premium" value={editingEnv.payment_status} onChange={e => setEditingEnv({ ...editingEnv, payment_status: e.target.value })}>
                          <option value="trial">Trial / Degustação</option>
                          <option value="active">Pagamento em Dia</option>
                          <option value="pending">Pagamento Pendente</option>
                          <option value="overdue">Atrasado</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status do Ambiente</label>
                        <select className="input-premium" value={editingEnv.ativo} onChange={e => setEditingEnv({ ...editingEnv, ativo: e.target.value === 'true' })}>
                          <option value="true">Ativo</option>
                          <option value="false">Bloqueado / Inativo</option>
                        </select>
                      </div>
                    </div>

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
                  <div className="modules-selector-grid">
                    {AVAILABLE_MODULES.map(m => (
                      <label key={m.id} className={`selection-card ${editingEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={editingEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...editingEnv.modulos_habilitados, m.id] : editingEnv.modulos_habilitados.filter(x => x !== m.id);
                          setEditingEnv({ ...editingEnv, modulos_habilitados: mods });
                        }} />
                        <div className="selection-card-content">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.label}</span>
                        </div>
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

                  <div className="env-badges">
                    {env.modulos_habilitados.slice(0, 3).map(m => (
                      <span key={m} className="module-badge">
                        {AVAILABLE_MODULES.find(x => x.id === m)?.label}
                      </span>
                    ))}
                    {env.modulos_habilitados.length > 3 && (
                      <span className="module-badge" style={{ background: 'var(--navy-900)', color: 'white', borderColor: 'var(--navy-900)' }}>
                        +{env.modulos_habilitados.length - 3}
                      </span>
                    )}
                  </div>

                  <footer style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-soft)' }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
                      try {
                        const r = await selectTenant(env.slug);
                        login(r.data.access_token);
                        navigate('/');
                      } catch (error) {
                        console.error('Erro ao acessar ambiente:', error);
                        const errorMsg = error.response?.data?.detail || error.message;
                        if (errorMsg.includes('credentials') || errorMsg.includes('Unauthorized') || error.response?.status === 401) {
                          toast.error('Sua sessão expirou. Faça login novamente.');
                          logout();
                          navigate('/login');
                        } else {
                          toast.error('Erro ao acessar ambiente: ' + errorMsg);
                        }
                      }
                    }}>
                      ACESSAR AMBIENTE <ArrowRight size={16} />
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
    </div>
  );
};

export default MasterAmbientes;
