import React, { useEffect, useState } from 'react';
import { getTeam, createTeamMember, deleteTeamMember } from '../services/api';
import { Plus, User, Shield, Mail, Trash2, XCircle, Users, Settings, Briefcase } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Team = () => {
    const [team, setTeam] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'vendedor', password: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await getTeam();
            setTeam(res.data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createTeamMember(newMember);
            setShowForm(false);
            setNewMember({ name: '', email: '', role: 'vendedor', password: '' });
            loadData();
        } catch (e) { alert("Erro ao cadastrar membro"); }
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Sua Equipe</h1>
                    <p>Gerencie acessos e permissões dos seus colaboradores</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
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
                                    <td>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                                            padding: '0.35rem 0.65rem', borderRadius: '4px',
                                            background: member.role === 'admin' ? 'var(--gold-50)' : '#f1f5f9',
                                            color: member.role === 'admin' ? 'var(--gold-600)' : '#64748b',
                                            border: member.role === 'admin' ? '1px solid var(--gold-400)' : 'none'
                                        }}>
                                            {member.role === 'admin' ? 'Administrador' : 'Colaborador'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => deleteTeamMember(member.id).then(loadData)}><Trash2 size={16} /></button>
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

            {/* CREATE MODAL */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '480px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Novo Acesso</h2>
                            <button onClick={() => setShowForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Nome do Colaborador</label>
                                <input className="input-premium" placeholder="Ex: Roberto Mendes" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>E-mail de Login</label>
                                <input className="input-premium" type="email" placeholder="roberto@suaempresa.com" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Acesso</label>
                                    <select className="input-premium" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}>
                                        <option value="vendedor">Colaborador</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Senha Provisória</label>
                                    <input className="input-premium" type="password" value={newMember.password} onChange={e => setNewMember({ ...newMember, password: e.target.value })} required />
                                </div>
                            </div>
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>Liberar Acesso</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
