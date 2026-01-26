import React, { useEffect, useState } from 'react';
import { getMasterAmbientes, createAmbiente, selectTenant, updateAmbiente, getNiches, createNiche, deleteAmbiente } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  { id: 'assinaturas', label: 'Assinaturas' }
];

const MasterAmbientes = () => {
  const [ambientes, setAmbientes] = useState([]);
  const [niches, setNiches] = useState([]);
  const [newEnv, setNewEnv] = useState({
    nome_empresa: '', slug: '', nicho_id: '', cor_principal: '#d4af37',
    admin_email: '', admin_password: '', plan: 'basic',
    modulos_habilitados: AVAILABLE_MODULES.map(m => m.id),
    logo: null
  });

  const [showForm, setShowForm] = useState(false);
  const [showNicheModal, setShowNicheModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [newNiche, setNewNiche] = useState({ id: null, name: '', columns_json: '', pipeline_stages_json: '' });

  const { login } = useAuth();
  const navigate = useNavigate();

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
        nome_empresa: '', slug: '', nicho_id: '', cor_principal: '#d4af37',
        admin_email: '', admin_password: '', plan: 'basic',
        modulos_habilitados: AVAILABLE_MODULES.map(m => m.id),
        logo: null
      });
      setLogoPreview(null);
      setShowForm(false);
      loadData();
    } catch (error) {
      alert("Erro ao criar ambiente: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async (slug, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'modulos_habilitados') {
        formData.append(key, JSON.stringify(data[key]));
      } else if (key === 'logo') {
        if (data.logo instanceof File) formData.append('logo', data.logo);
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
      alert("Erro ao atualizar ambiente: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateNiche = async (e) => {
    e.preventDefault();
    try {
      const columns = newNiche.columns_json.split(',').map(s => s.trim()).filter(s => s);
      const pipeline_stages = newNiche.pipeline_stages_json
        ? newNiche.pipeline_stages_json.split(',').map(s => s.trim()).filter(s => s)
        : ["Novo", "Em Contato", "Agendado"];

      if (newNiche.id) {
        const { updateNiche } = await import('../services/api');
        await updateNiche(newNiche.id, { name: newNiche.name, columns, pipeline_stages, ativo: true });
      } else {
        await createNiche({ name: newNiche.name, columns, pipeline_stages });
      }
      setNewNiche({ id: null, name: '', columns_json: '', pipeline_stages_json: '' });
      loadData();
    } catch (error) {
      alert("Erro ao salvar nicho.");
    }
  };

  const handleFileChange = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEditing) setEditingEnv({ ...editingEnv, logo: file });
      else setNewEnv({ ...newEnv, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const getNicheName = (id) => niches.find(n => n.id === id)?.name || 'N/A';

  return (
    <div className="page-container" style={{ padding: 'var(--container-padding)' }}>
      <header className="page-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.25rem', fontWeight: 800 }}>Gestão de Ambientes</h1>
          <p className="text-muted" style={{ fontWeight: 500 }}>Ecosystem Management & Control</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-luxury" onClick={() => setShowNicheModal(true)} style={{ borderRadius: '12px' }}>
            <Layers size={18} /> Gerenciar Nichos
          </button>
          <button className="btn-luxury-gold" onClick={() => setShowForm(true)} style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
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
              <button onClick={() => setShowForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Slug (URL)</label>
                        <input className="input-premium" placeholder="tadeu-barber" value={newEnv.slug} onChange={e => setNewEnv({ ...newEnv, slug: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Nicho</label>
                        <select className="input-premium" value={newEnv.nicho_id} onChange={e => setNewEnv({ ...newEnv, nicho_id: e.target.value })} required>
                          <option value="">Selecione...</option>
                          {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>E-mail Admin</label>
                        <input className="input-premium" type="email" placeholder="admin@empresa.com" value={newEnv.admin_email} onChange={e => setNewEnv({ ...newEnv, admin_email: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Plano</label>
                        <select className="input-premium" value={newEnv.plan} onChange={e => setNewEnv({ ...newEnv, plan: e.target.value })}>
                          <option value="basic">BASIC</option>
                          <option value="pro">PRO</option>
                          <option value="enterprise">ENTERPRISE</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Senha Inicial</label>
                      <input className="input-premium" type="password" placeholder="••••••••" value={newEnv.admin_password} onChange={e => setNewEnv({ ...newEnv, admin_password: e.target.value })} required />
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label>Logotipo</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {logoPreview ? <img src={logoPreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Briefcase size={24} color="var(--text-muted)" />}
                        </div>
                        <label className="btn-luxury" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.8rem', textTransform: 'none' }}>
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
                      <label key={m.id} className={`module-option ${newEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={newEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...newEnv.modulos_habilitados, m.id] : newEnv.modulos_habilitados.filter(x => x !== m.id);
                          setNewEnv({ ...newEnv, modulos_habilitados: mods });
                        }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <footer style={{ padding: '2rem 3rem', background: '#f8fafc', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary-premium" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-premium">Ativar Ambiente</button>
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
              <button onClick={() => { setEditingEnv(null); setLogoPreview(null); }} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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

                    <div className="form-group">
                      <label>Identidade Visual</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'white', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                          <img src={logoPreview || (editingEnv.logo_url ? `http://localhost:8000${editingEnv.logo_url}` : '')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <label className="btn-luxury" style={{ cursor: 'pointer', padding: '0.5rem 1.1rem', fontSize: '0.8rem', textTransform: 'none' }}>
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
                      <label key={m.id} className={`module-option ${editingEnv.modulos_habilitados.includes(m.id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={editingEnv.modulos_habilitados.includes(m.id)} onChange={e => {
                          const mods = e.target.checked ? [...editingEnv.modulos_habilitados, m.id] : editingEnv.modulos_habilitados.filter(x => x !== m.id);
                          setEditingEnv({ ...editingEnv, modulos_habilitados: mods });
                        }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <footer style={{ padding: '2rem 3rem', background: '#f8fafc', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn-secondary-premium" onClick={() => { setEditingEnv(null); setLogoPreview(null); }}>Fechar</button>
                <button className="btn-primary-premium" onClick={() => handleUpdate(editingEnv.slug, editingEnv)}>Salvar Mudanças</button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* NICHE MODAL */}
      {showNicheModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '600px', padding: '0', overflow: 'hidden' }}>
            <div className="modal-header-luxury">
              <h2>Nichos de Mercado</h2>
              <button onClick={() => setShowNicheModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
            </div>
            <div style={{ padding: '2.5rem' }}>
              <form onSubmit={handleCreateNiche} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>Título do Nicho</label>
                  <input className="input-premium" placeholder="Ex: Academia, Clínica..." value={newNiche.name} onChange={e => setNewNiche({ ...newNiche, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Campos Dinâmicos (CSV)</label>
                  <textarea className="input-premium" rows={2} placeholder="registro, data_expiracao..." value={newNiche.columns_json} onChange={e => setNewNiche({ ...newNiche, columns_json: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary-premium" style={{ width: '100%' }}>Salvar Nicho</button>
              </form>

              <div style={{ marginTop: '2rem', border: '1px solid var(--border-soft)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--bg-app)', padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configurações Ativas</div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {niches.map(n => (
                    <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-soft)' }}>
                      <span style={{ fontWeight: 600 }}>{n.name}</span>
                      <button className="btn-icon" onClick={() => setNewNiche({ id: n.id, name: n.name, columns_json: n.columns.join(','), pipeline_stages_json: (n.pipeline_stages || []).join(',') })}><Settings size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENVIRONMENTS LISTING */}
      <div className="card-grid">
        {ambientes.map(env => (
          <div key={env.id} className={`env-card ${env.ativo !== false ? 'active' : ''}`}>
            <div className="env-card-header">
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div className="env-logo-wrapper" style={{ background: 'white' }}>
                  {env.logo_url ? <img src={`http://localhost:8000${env.logo_url}`} alt="" /> : <Shield size={28} color="var(--primary)" />}
                </div>
                <div className="env-info">
                  <h3>{env.nome_empresa}</h3>
                  <span style={{ fontWeight: 700, opacity: 0.7 }}>/{env.slug}</span>
                </div>
              </div>
              <button className="btn-icon" style={{ color: 'var(--text-muted)' }} onClick={() => { setEditingEnv(env); setLogoPreview(null); }}><Settings size={20} /></button>
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
              <button className="btn-luxury" style={{ flex: 1, borderRadius: '12px', fontSize: '0.8rem', padding: '0.8rem' }} onClick={() => selectTenant(env.slug).then(r => { login(r.data.access_token); navigate('/'); })}>
                ACESSAR AMBIENTE <ArrowRight size={16} />
              </button>
              <button className="btn-icon" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.05)' }} onClick={() => deleteAmbiente(env.slug).then(loadData)}>
                <Trash2 size={18} />
              </button>
            </footer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasterAmbientes;
