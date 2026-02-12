import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changePassword } from '../services/api';
import { User, Shield, Building, Mail, LogOut, Key, Save, Briefcase, Camera, XCircle, Eye, EyeOff } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);

    // Mock for demo
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Administrador CRMaster',
        email: user?.email || 'admin@crmaster.com',
        empresa: user?.nome_empresa || 'Sua Empresa Premium',
        nicho: user?.nicho_nome || 'Nicho de Atuação'
    });

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            toast.success('Senha alterada com sucesso!');
            setShowPasswordModal(false);
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message;
            if (errorMsg.includes('old password') || errorMsg.includes('Failed')) {
                toast.error('Senha atual incorreta. Verifique e tente novamente.');
            } else {
                toast.error('Erro ao alterar senha: ' + errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Meu Perfil</h1>
                    <p>Configurações de conta e identidade no ecossistema</p>
                </div>
                <button className="btn-primary" onClick={logout}>
                    <LogOut size={18} /> Encerrar Sessão
                </button>
            </header>

            <div className="grid-profile">
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
                    <div className="grid-fields" style={{ padding: '2.5rem' }}>
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

                    <div style={{ borderTop: '1px solid var(--border-soft)', padding: '0 2.5rem 2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h4 style={{ fontWeight: 800, color: 'var(--navy-900)' }}>Segurança</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mantenha sua conta protegida com uma senha forte.</p>
                            </div>
                            <button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>
                                <Key size={14} /> Redefinir Senha
                            </button>
                        </div>
                        <footer style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => toast.success('Perfil salvo com sucesso!')}>
                                <Save size={18} /> Salvar Alterações
                            </button>
                        </footer>
                    </div>
                </div>
            </div>

            {/* PASSWORD MODAL */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '480px', padding: 0, overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <div>
                                <h2>Alterar Senha</h2>
                                <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>Digite sua senha atual e a nova senha</p>
                            </div>
                            <button onClick={() => setShowPasswordModal(false)} className="btn-close-modal"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleChangePassword} style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Senha Atual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showOldPass ? 'text' : 'password'}
                                        className="input-premium"
                                        placeholder="Digite sua senha atual"
                                        value={passwordData.old_password}
                                        onChange={e => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowOldPass(!showOldPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNewPass ? 'text' : 'password'}
                                        className="input-premium"
                                        placeholder="Digite a nova senha"
                                        value={passwordData.new_password}
                                        onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label>Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    className="input-premium"
                                    placeholder="Confirme a nova senha"
                                    value={passwordData.confirm_password}
                                    onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Alterar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;

