import React, { useState, useEffect } from 'react';
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional, uploadFile, API_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, User, Mail, Phone, Briefcase, Trash2, Edit, X, Users, Percent, Calendar, TrendingUp } from 'lucide-react';
import '../styles/tenant-luxury.css';
import '../styles/professionals.css';

const Professionals = () => {
    const [professionals, setProfessionals] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const [formData, setFormData] = useState({
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

    useEffect(() => {
        loadProfessionals();
    }, []);

    const loadProfessionals = async () => {
        try {
            setLoading(true);
            const response = await getProfessionals();
            setProfessionals(response.data.filter(p => p.active));
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await createProfessional(formData);
            setShowCreateModal(false);
            resetForm();
            loadProfessionals();
            toast.success('Profissional cadastrado com sucesso!');
        } catch (error) {
            toast.error('Erro ao cadastrar profissional');
            console.error(error);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateProfessional(selectedProfessional.id, formData);
            setIsEditing(false);
            setShowDetailsModal(false);
            resetForm();
            loadProfessionals();
            toast.success('Profissional atualizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar profissional');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente remover este profissional?')) return;
        try {
            await deleteProfessional(id);
            setShowDetailsModal(false);
            loadProfessionals();
            toast.success('Profissional removido com sucesso!');
        } catch (error) {
            toast.error('Erro ao remover profissional');
            console.error(error);
        }
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
                    <h1>Profissionais</h1>
                    <p>Gerencie sua equipe de especialistas e comissões</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} /> Adicionar Profissional
                </button>
            </header>

            {loading ? (
                <div className="professionals-loading">
                    <Users size={64} style={{ opacity: 0.2 }} />
                    <p>Carregando profissionais...</p>
                </div>
            ) : professionals.length === 0 ? (
                <div className="professionals-empty">
                    <Users size={80} style={{ opacity: 0.1 }} />
                    <h3>Nenhum profissional cadastrado</h3>
                    <p>Adicione profissionais à sua equipe para começar</p>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Adicionar Primeiro Profissional
                    </button>
                </div>
            ) : (
                <div className="professionals-grid">
                    {professionals.map(professional => (
                        <div
                            key={professional.id}
                            className="professional-card"
                            onClick={() => openDetailsModal(professional)}
                        >
                            <div className="professional-card-header">
                                {professional.photo_url ? (
                                    <img
                                        src={professional.photo_url.startsWith('http') ? professional.photo_url : `${API_URL}${professional.photo_url}`}
                                        alt={professional.name}
                                        className="professional-photo"
                                    />
                                ) : (
                                    <div className="professional-photo-placeholder">
                                        {getInitials(professional.name)}
                                    </div>
                                )}
                            </div>
                            <div className="professional-card-body">
                                <h3>{professional.name}</h3>
                                {professional.specialty && (
                                    <span className="specialty-badge">{professional.specialty}</span>
                                )}
                                <div className="professional-info">
                                    <div className="info-row">
                                        <Percent size={14} color="var(--gold-500)" />
                                        <span>Comissão: {professional.commission_percentage}%</span>
                                    </div>
                                    {professional.email && (
                                        <div className="info-row">
                                            <Mail size={14} />
                                            <span>{professional.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
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
