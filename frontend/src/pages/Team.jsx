import React, { useEffect, useState } from 'react';
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../services/api';
import { Plus, User, Shield, Mail, Trash2, XCircle, Users, Settings, Briefcase, Edit, Lock } from 'lucide-react';
import '../styles/tenant-luxury.css';

const AVAILABLE_MODULES = [
    { id: 'leads_pipeline', name: 'Pipeline de Vendas', icon: '🎯' },
    { id: 'clientes', name: 'Clientes', icon: '👥' },
    { id: 'financeiro', name: 'Financeiro', icon: '💰' },
    { id: 'produtos', name: 'Catálogo de Produtos', icon: '📦' },
    { id: 'agenda', name: 'Agenda & Eventos', icon: '📅' },
    { id: 'dashboard', name: 'Relatórios & Insights', icon: '📊' },
    { id: 'equipe', name: 'Gestão de Equipe & Fornecedores', icon: '👨‍💼' },
    { id: 'assinaturas', name: 'Assinaturas & Planos', icon: '🔄' }
];

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Administrador Total', description: 'Acesso completo a todos os módulos' },
    { value: 'financeiro', label: 'Financeiro', description: 'Acesso a finanças e relatórios' },
    { value: 'vendedor', label: 'Vendedor', description: 'Acesso a pipeline e clientes' },
    { value: 'operacional', label: 'Operacional', description: 'Acesso a agenda e produtos' },
    { value: 'custom', label: 'Personalizado', description: 'Selecione módulos específicos' }
];

const Team = () => {
    const [team, setTeam] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'vendedor',
        password: '',
        modules_allowed: []
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await getTeam();
            setTeam(res.data);
        } catch (e) { console.error(e); }
    };

    const openCreateForm = () => {
        setEditingMember(null);
        setFormData({ name: '', email: '', role: 'vendedor', password: '', modules_allowed: [] });
        setShowForm(true);
    };

    const openEditForm = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            role: member.role,
            password: '',
            modules_allowed: member.modules_allowed || []
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Auto-assign modules based on role if not custom
            let finalModules = formData.modules_allowed;

            if (formData.role === 'admin') {
                finalModules = AVAILABLE_MODULES.map(m => m.id);
            } else if (formData.role === 'financeiro') {
                finalModules = ['financeiro', 'dashboard', 'clientes'];
            } else if (formData.role === 'vendedor') {
                finalModules = ['leads_pipeline', 'clientes', 'agenda'];
            } else if (formData.role === 'operacional') {
                finalModules = ['agenda', 'produtos', 'clientes'];
            }

            const payload = { ...formData, modules_allowed: finalModules };

            if (editingMember) {
                await updateTeamMember(editingMember.id, payload);
            } else {
                await createTeamMember(payload);
            }

            setShowForm(false);
            setFormData({ name: '', email: '', role: 'vendedor', password: '', modules_allowed: [] });
            loadData();
        } catch (e) {
            alert(editingMember ? "Erro ao atualizar membro" : "Erro ao cadastrar membro");
        }
    };

    const toggleModule = (moduleId) => {
        const current = formData.modules_allowed || [];
        if (current.includes(moduleId)) {
            setFormData({ ...formData, modules_allowed: current.filter(m => m !== moduleId) });
        } else {
            setFormData({ ...formData, modules_allowed: [...current, moduleId] });
        }
    };

    const getRoleBadge = (role) => {
        const config = {
            admin: { color: 'var(--gold-600)', bg: 'var(--gold-50)', border: 'var(--gold-400)', label: 'Admin Total' },
            financeiro: { color: '#10b981', bg: '#ecfdf5', border: '#10b981', label: 'Financeiro' },
            vendedor: { color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6', label: 'Vendedor' },
            operacional: { color: '#8b5cf6', bg: '#f5f3ff', border: '#8b5cf6', label: 'Operacional' },
            custom: { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', label: 'Personalizado' }
        };
        const c = config[role] || config.custom;
        return (
            <span style={{
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                padding: '0.35rem 0.65rem', borderRadius: '4px',
                background: c.bg, color: c.color, border: `1px solid ${c.border}`
            }}>
                {c.label}
            </span>
        );
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Controle de Acesso</h1>
                    <p>Gerencie permissões e módulos da sua equipe</p>
                </div>
                <button className="btn-primary" onClick={openCreateForm}>
                    <Plus size={20} /> Adicionar Colaborador
                </button>
            </header>

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Membros Ativos ({team.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table-luxury">
                        <thead>
                            <tr>
                                <th>Nome e Perfil</th>
                                <th>E-mail Corporativo</th>
                                <th>Nível de Acesso</th>
                                <th>Módulos Permitidos</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="indicator-icon-wrapper" style={{ width: 36, height: 36, background: 'var(--navy-900)', color: 'white', fontSize: '0.8rem', fontWeight: 800 }}>
                                                {(member.name || 'U').charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{member.name}</span>
                                        </div>
                                    </td>
                                    <td><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{member.email}</span></td>
                                    <td>{getRoleBadge(member.role)}</td>
                                    <td>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {member.role === 'admin'
                                                ? 'Todos os módulos'
                                                : `${(member.modules_allowed || []).length} módulo(s)`}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-action-luxury" onClick={() => openEditForm(member)} title="Editar Permissões">
                                                <Edit size={16} color="var(--primary)" />
                                            </button>
                                            <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => deleteTeamMember(member.id).then(loadData)} title="Remover Acesso">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {team.length === 0 && (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Users size={64} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                            <p style={{ fontWeight: 600 }}>Nenhum membro cadastrado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE/EDIT MODAL */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '580px', padding: '0', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header-luxury">
                            <h2>{editingMember ? 'Editar Permissões' : 'Novo Acesso'}</h2>
                            <button onClick={() => setShowForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
                            <div className="form-group">
                                <label>Nome do Colaborador</label>
                                <input className="input-premium" placeholder="Ex: Roberto Mendes" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>E-mail de Login</label>
                                <input className="input-premium" type="email" placeholder="roberto@suaempresa.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingMember} />
                                {editingMember && <small style={{ color: '#64748b', fontSize: '0.75rem' }}>O e-mail não pode ser alterado</small>}
                            </div>

                            <div className="form-group">
                                <label>Nível de Acesso</label>
                                <div style={{ display: 'grid', gap: '0.65rem' }}>
                                    {ROLE_OPTIONS.map(roleOpt => (
                                        <div
                                            key={roleOpt.value}
                                            className={`selection-card ${formData.role === roleOpt.value ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, role: roleOpt.value })}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                checked={formData.role === roleOpt.value}
                                                onChange={() => setFormData({ ...formData, role: roleOpt.value })}
                                            />
                                            <div className="selection-card-content">
                                                <strong style={{ fontSize: '0.95rem', color: 'var(--navy-950)', fontWeight: 700 }}>{roleOpt.label}</strong>
                                                <small style={{ fontSize: '0.8rem', color: '#64748b' }}>{roleOpt.description}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {formData.role === 'custom' && (
                                <div className="form-group">
                                    <label>Módulos Permitidos</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.25rem' }}>
                                        {AVAILABLE_MODULES.map(module => (
                                            <div
                                                key={module.id}
                                                className={`selection-card ${(formData.modules_allowed || []).includes(module.id) ? 'selected' : ''}`}
                                                onClick={() => toggleModule(module.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.modules_allowed || []).includes(module.id)}
                                                    onChange={() => toggleModule(module.id)}
                                                />
                                                <div className="selection-card-content">
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>{module.icon} {module.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    {editingMember ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Provisória'}
                                </label>
                                <input
                                    className="input-premium"
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingMember}
                                    placeholder={editingMember ? 'Digite apenas se quiser alterar' : 'Senha inicial'}
                                />
                            </div>

                            <footer style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
                                    {editingMember ? 'Salvar Alterações' : 'Liberar Acesso'}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
