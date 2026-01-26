import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Building, Mail, LogOut, Key, Save, Briefcase, Camera } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    // Mock for demo
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Administrador CRMaster',
        email: user?.email || 'admin@crmaster.com',
        empresa: user?.nome_empresa || 'Sua Empresa Premium',
        nicho: user?.nicho_nome || 'Nicho de Atuação'
    });

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Meu Perfil</h1>
                    <p>Configurações de conta e identidade no ecossistema</p>
                </div>
                <button className="btn-luxury" onClick={logout} style={{ borderRadius: '12px', border: '1px solid var(--error)', color: 'var(--error)' }}>
                    <LogOut size={18} /> Encerrar Sessão
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', alignItems: 'start' }}>
                {/* LEFT: AVATAR CARD */}
                <div className="data-card-luxury" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2rem' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--grad-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, border: '4px solid var(--gold-50)' }}>
                            {profileData.name.charAt(0)}
                        </div>
                        <button style={{ position: 'absolute', bottom: 0, right: 0, width: '36px', height: '36px', borderRadius: '50%', background: 'var(--grad-gold)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Camera size={14} color="var(--navy-950)" />
                        </button>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>{profileData.name}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--gold-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem' }}>{user?.role || 'Administrador'}</p>

                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-soft)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Building size={16} /> {profileData.empresa}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <Briefcase size={16} /> {profileData.nicho}
                        </div>
                    </div>
                </div>

                {/* RIGHT: SETTINGS CARD */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Informações da Conta</h3>
                    </div>
                    <div style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div className="form-group">
                                <label>Nome de Exibição</label>
                                <input className="input-premium" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Endereço de E-mail</label>
                                <input className="input-premium" value={profileData.email} disabled style={{ background: '#f8fafc', opacity: 0.7 }} />
                            </div>
                            <div className="form-group">
                                <label>Organização / Tenant</label>
                                <input className="input-premium" value={profileData.empresa} disabled style={{ background: '#f8fafc', opacity: 0.7 }} />
                            </div>
                            <div className="form-group">
                                <label>Nicho de atuação</label>
                                <input className="input-premium" value={profileData.nicho} disabled style={{ background: '#f8fafc', opacity: 0.7 }} />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h4 style={{ fontWeight: 800, color: 'var(--navy-900)' }}>Segurança</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenha sua conta protegida com uma senha forte.</p>
                                </div>
                                <button className="btn-luxury" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                    <Key size={14} /> Redefinir Senha
                                </button>
                            </div>
                        </div>

                        <footer style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-luxury-gold" style={{ padding: '0.85rem 2rem', borderRadius: '12px' }}>
                                <Save size={18} /> Salvar Alterações
                            </button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
