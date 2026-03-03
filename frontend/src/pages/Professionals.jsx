import React, { useState } from 'react';
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional, uploadFile, API_URL } from '../services/api';
import { useDataCache } from '../hooks/useDataCache';
import { useOptimistic } from '../hooks/useOptimistic';
import { showToast } from '../components/Toast';
import { Plus, User, Mail, Phone, Briefcase, Trash2, Edit, X, Users, Percent, Calendar, TrendingUp } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import '../styles/tenant-luxury.css';
import '../styles/professionals.css';

const Professionals = () => {
    const { data: professionals, loading, mutate } = useDataCache('professionals', getProfessionals);
    const optimistic = useOptimistic(mutate);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_Professionals') || 'grid');

    React.useEffect(() => {
        localStorage.setItem('viewMode_Professionals', viewMode);
    }, [viewMode]);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', specialty: '', photo_url: '', bio: '',
        active: true, commission_percentage: 0, commission_type: 'gross',
        commission_start_date: new Date().toISOString().split('T')[0], uploadMode: false
    });

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const tempId = `temp_${Date.now()}`;
        const tempProf = { ...formData, id: tempId, active: true, _pending: true };
        setShowCreateModal(false);
        resetForm();

        await optimistic(
            prev => [...(prev || []).filter(p => p.active), tempProf],
            async () => {
                const res = await createProfessional(formData);
                mutate(prev => prev.map(p => p.id === tempId ? { ...res.data, _pending: false } : p));
                showToast('Profissional cadastrado com sucesso!', 'success');
            },
            { errorMessage: 'Erro ao cadastrar profissional. Ação revertida.' }
        );
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const id = selectedProfessional.id;
        const updatedData = { ...formData };
        setIsEditing(false);
        setShowDetailsModal(false);
        resetForm();

        await optimistic(
            prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p),
            async () => {
                await updateProfessional(id, updatedData);
                showToast('Profissional atualizado!', 'success');
            },
            { errorMessage: 'Erro ao atualizar profissional. Ação revertida.' }
        );
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente remover este profissional?')) return;
        setShowDetailsModal(false);

        await optimistic(
            prev => prev.filter(p => p.id !== id),
            async () => {
                await deleteProfessional(id);
                showToast('Profissional removido.', 'success');
            },
            { errorMessage: 'Erro ao remover profissional. Ação revertida.' }
        );
    };

    const openDetailsModal = (professional) => {
        setSelectedProfessional(professional);
        setFormData({
            name: professional.name,
            email: professional.email || '',
            phone: professional.phone || '',
            specialty: professional.specialty || '',
            photo_url: professional.photo_url || '',
            bio: professional.bio || '',
            active: professional.active,
            commission_percentage: professional.commission_percentage || 0,
            commission_type: professional.commission_type || 'gross',
            commission_start_date: professional.commission_start_date || new Date().toISOString().split('T')[0],
            uploadMode: false
        });
        setShowDetailsModal(true);
        setIsEditing(false);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            specialty: '',
            photo_url: '',
            bio: '',
            active: true,
            commission_percentage: 0,
            commission_type: 'gross',
            commission_start_date: new Date().toISOString().split('T')[0],
            uploadMode: false
        });
        setSelectedProfessional(null);
    };

    const getInitials = (name) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Equipe & Especialistas</h1>
                    <p>Gerencie sua equipe, comissões e disponibilidade</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Adicionar Profissional
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '10rem 0', textAlign: 'center' }}>
                    <Users size={64} style={{ opacity: 0.1, margin: '0 auto 1rem' }} />
                    <p style={{ fontWeight: 600, opacity: 0.5 }}>Buscando membros da equipe...</p>
                </div>
            ) : professionals.length === 0 ? (
                <div style={{ padding: '8rem 0', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                    <Users size={80} style={{ opacity: 0.05, margin: '0 auto 2rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--white)', marginBottom: '1rem' }}>Sua Equipe ainda está vazia</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Comece adicionando seu primeiro especialista para gerenciar atendimentos.</p>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Adicionar Primeiro Profissional
                    </button>
                </div>
            ) : (
                <div className="data-card-luxury">
                    {viewMode === 'list' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-luxury table-compact">
                                <thead>
                                    <tr>
                                        <th>Profissional</th>
                                        <th>Especialidade</th>
                                        <th>E-mail</th>
                                        <th>Comissão</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {professionals.map(prof => (
                                        <tr key={prof.id} onClick={() => openDetailsModal(prof)}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {prof.photo_url ? (
                                                        <img src={prof.photo_url.startsWith('http') ? prof.photo_url : `${API_URL}${prof.photo_url}`} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                                    ) : (
                                                        <div className="indicator-icon-wrapper" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{getInitials(prof.name)}</div>
                                                    )}
                                                    <span style={{ fontWeight: 700 }}>{prof.name}</span>
                                                </div>
                                            </td>
                                            <td>{prof.specialty || '---'}</td>
                                            <td>{prof.email || '---'}</td>
                                            <td>{prof.commission_percentage}%</td>
                                            <td>{prof.active ? <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.65rem' }}>ATIVO</span> : <span style={{ color: 'var(--text-muted)' }}>INATIVO</span>}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn-action-luxury"><Edit size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="data-grid-cards">
                            {professionals.map(prof => (
                                <div key={prof.id} className="data-card-item" onClick={() => openDetailsModal(prof)}>
                                    <div className="card-actions-dropdown">
                                        <button className="btn-icon"><Edit size={14} color="var(--primary)" /></button>
                                    </div>
                                    <div className="data-card-header-flex">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {prof.photo_url ? (
                                                <img
                                                    src={prof.photo_url.startsWith('http') ? prof.photo_url : `${API_URL}${prof.photo_url}`}
                                                    alt={prof.name}
                                                    style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="indicator-icon-wrapper" style={{ width: 48, height: 48, fontSize: '1.2rem', fontWeight: 800 }}>
                                                    {getInitials(prof.name)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="data-card-title">{prof.name}</h3>
                                                {prof.specialty && <span className="label" style={{ display: 'block', marginTop: '0.25rem' }}>{prof.specialty}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="data-card-body" style={{ marginTop: '1rem' }}>
                                        <p>
                                            <span className="label">Comissão</span>
                                            <span style={{ fontWeight: 600, color: 'var(--gold-500)' }}>{prof.commission_percentage}% ({prof.commission_type === 'gross' ? 'Bruto' : 'Líquido'})</span>
                                        </p>
                                        <p>
                                            <span className="label">E-mail</span>
                                            <span style={{ fontWeight: 600 }}>{prof.email || '---'}</span>
                                        </p>
                                    </div>
                                    <div className="data-card-footer">
                                        <span className="label">Telefone</span>
                                        <strong>{prof.phone || '---'}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-luxury">
                            <h2>Novo Profissional</h2>
                            <button className="btn-close-modal" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nome completo *</label>
                                    <input
                                        type="text"
                                        className="input-premium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: João Silva"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        className="input-premium"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input
                                        type="tel"
                                        className="input-premium"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Especialidade</label>
                                    <input
                                        type="text"
                                        className="input-premium"
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-divider">Configuração de Comissão</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Comissão (%)</label>
                                    <input
                                        type="number"
                                        className="input-premium"
                                        value={formData.commission_percentage}
                                        onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                                        min="0" max="100" step="0.1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select
                                        className="input-premium"
                                        value={formData.commission_type}
                                        onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                                    >
                                        <option value="gross">Sobre Valor Bruto</option>
                                        <option value="net">Sobre Valor Líquido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-divider">Mais Informações</div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Foto do Profissional</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <button type="button" className={`btn-secondary ${!formData.uploadMode ? 'active' : ''}`} style={{ flex: 1, background: !formData.uploadMode ? 'var(--gold-500)' : '', color: !formData.uploadMode ? '#000' : '' }} onClick={() => setFormData({ ...formData, uploadMode: false })}>Link</button>
                                        <button type="button" className={`btn-secondary ${formData.uploadMode ? 'active' : ''}`} style={{ flex: 1, background: formData.uploadMode ? 'var(--gold-500)' : '', color: formData.uploadMode ? '#000' : '' }} onClick={() => setFormData({ ...formData, uploadMode: true })}>Arquivo</button>
                                    </div>
                                    {!formData.uploadMode ? (
                                        <input
                                            type="url"
                                            className="input-premium"
                                            value={formData.photo_url}
                                            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        <input
                                            type="file" accept="image/*" className="input-premium"
                                            onChange={async (e) => {
                                                if (e.target.files[0]) {
                                                    try {
                                                        const res = await uploadFile(e.target.files[0]);
                                                        setFormData({ ...formData, photo_url: res.data.url });
                                                    } catch (err) { toast.error("Erro ao enviar imagem"); }
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Biografia</label>
                                    <textarea
                                        className="input-premium"
                                        rows="3"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Cadastrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {showDetailsModal && selectedProfessional && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-card modal-card-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-luxury">
                            <h2>{isEditing ? 'Editar Profissional' : 'Detalhes do Profissional'}</h2>
                            <button className="btn-close-modal" onClick={() => setShowDetailsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        {!isEditing ? (
                            <div className="modal-details">
                                <div className="details-header">
                                    {selectedProfessional.photo_url ? (
                                        <img
                                            src={selectedProfessional.photo_url.startsWith('http') ? selectedProfessional.photo_url : `${API_URL}${selectedProfessional.photo_url}`}
                                            alt={selectedProfessional.name}
                                            className="details-photo"
                                        />
                                    ) : (
                                        <div className="details-photo-placeholder">{getInitials(selectedProfessional.name)}</div>
                                    )}
                                    <div className="details-title-group">
                                        <h3>{selectedProfessional.name}</h3>
                                        <span className="specialty-badge-large">{selectedProfessional.specialty || 'Especialista'}</span>
                                    </div>
                                </div>
                                <div className="details-content">
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <Percent size={18} className="detail-icon" />
                                            <div>
                                                <label>Comissão</label>
                                                <p>{selectedProfessional.commission_percentage}% ({selectedProfessional.commission_type === 'gross' ? 'Bruto' : 'Líquido'})</p>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <Mail size={18} className="detail-icon" />
                                            <div>
                                                <label>E-mail</label>
                                                <p>{selectedProfessional.email || 'Não informado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedProfessional.bio && (
                                        <div className="details-section">
                                            <h4>Sobre</h4>
                                            <p>{selectedProfessional.bio}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-icon-danger" onClick={() => handleDelete(selectedProfessional.id)}><Trash2 size={18} /> Remover</button>
                                    <div style={{ flex: 1 }}></div>
                                    <button className="btn-secondary" onClick={() => setIsEditing(true)}><Edit size={18} /> Editar</button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateSubmit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nome completo *</label>
                                        <input
                                            type="text" className="input-premium"
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Comissão (%)</label>
                                        <input
                                            type="number" className="input-premium"
                                            value={formData.commission_percentage}
                                            onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tipo</label>
                                        <select
                                            className="input-premium"
                                            value={formData.commission_type}
                                            onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                                        >
                                            <option value="gross">Sobre Valor Bruto</option>
                                            <option value="net">Sobre Valor Líquido</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Salvar Alterações</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Professionals;
