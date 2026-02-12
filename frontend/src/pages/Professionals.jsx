import React, { useState, useEffect } from 'react';
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional, uploadFile } from '../services/api';
import { Plus, User, Mail, Phone, Briefcase, Trash2, Edit, X, Users } from 'lucide-react';
import '../styles/tenant-luxury.css';
import '../styles/professionals.css';

const Professionals = () => {
    const [professionals, setProfessionals] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        photo_url: '',
        bio: '',
        active: true
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
        } catch (error) {
            alert('Erro ao criar profissional');
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
        } catch (error) {
            alert('Erro ao atualizar profissional');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente remover este profissional?')) return;
        try {
            await deleteProfessional(id);
            setShowDetailsModal(false);
            loadProfessionals();
        } catch (error) {
            alert('Erro ao remover profissional');
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
            active: professional.active
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
            active: true
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
                    <p>Gerencie sua equipe de especialistas</p>
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
                                        src={professional.photo_url}
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
                                    {professional.email && (
                                        <div className="info-row">
                                            <Mail size={14} />
                                            <span>{professional.email}</span>
                                        </div>
                                    )}
                                    {professional.phone && (
                                        <div className="info-row">
                                            <Phone size={14} />
                                            <span>{professional.phone}</span>
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
                            <button
                                className="btn-close-modal"
                                onClick={() => setShowCreateModal(false)}
                            >
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
                                        placeholder="Ex: Dr. João Silva"
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
                                        placeholder="profissional@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input
                                        type="tel"
                                        className="input-premium"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
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
                                        placeholder="Ex: Cardiologista, Designer, etc."
                                    />
                                </div>
                            </div>

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
                                            placeholder="https://exemplo.com/foto.jpg"
                                        />
                                    ) : (
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="input-premium"
                                            onChange={async (e) => {
                                                if (e.target.files[0]) {
                                                    try {
                                                        const res = await uploadFile(e.target.files[0]);
                                                        setFormData({ ...formData, photo_url: res.data.url });
                                                    } catch (err) {
                                                        alert("Erro ao enviar imagem");
                                                    }
                                                }
                                            }}
                                        />
                                    )}
                                    {formData.photo_url && (
                                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                            <img src={formData.photo_url} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--gold-500)' }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Biografia</label>
                                    <textarea
                                        className="input-premium"
                                        rows="4"
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Breve descrição sobre o profissional..."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    <Plus size={18} /> Cadastrar
                                </button>
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
                            <button
                                className="btn-close-modal"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {!isEditing ? (
                            <div className="modal-details">
                                <div className="details-header">
                                    {selectedProfessional.photo_url ? (
                                        <img
                                            src={selectedProfessional.photo_url}
                                            alt={selectedProfessional.name}
                                            className="details-photo"
                                        />
                                    ) : (
                                        <div className="details-photo-placeholder">
                                            {getInitials(selectedProfessional.name)}
                                        </div>
                                    )}
                                    <div className="details-title-group">
                                        <h3>{selectedProfessional.name}</h3>
                                        {selectedProfessional.specialty && (
                                            <span className="specialty-badge-large">{selectedProfessional.specialty}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="details-content">
                                    {selectedProfessional.bio && (
                                        <div className="details-section">
                                            <h4>Sobre</h4>
                                            <p>{selectedProfessional.bio}</p>
                                        </div>
                                    )}

                                    <div className="details-section">
                                        <h4>Informações de Contato</h4>
                                        <div className="details-grid">
                                            {selectedProfessional.email && (
                                                <div className="detail-item">
                                                    <Mail size={18} className="detail-icon" />
                                                    <div>
                                                        <label>E-mail</label>
                                                        <p>{selectedProfessional.email}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {selectedProfessional.phone && (
                                                <div className="detail-item">
                                                    <Phone size={18} className="detail-icon" />
                                                    <div>
                                                        <label>Telefone</label>
                                                        <p>{selectedProfessional.phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        className="btn-icon-danger"
                                        onClick={() => handleDelete(selectedProfessional.id)}
                                    >
                                        <Trash2 size={18} /> Remover
                                    </button>
                                    <div style={{ flex: 1 }}></div>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit size={18} /> Editar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateSubmit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Nome completo *</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                            />
                                        ) : (
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="input-premium"
                                                onChange={async (e) => {
                                                    if (e.target.files[0]) {
                                                        try {
                                                            const res = await uploadFile(e.target.files[0]);
                                                            setFormData({ ...formData, photo_url: res.data.url });
                                                        } catch (err) {
                                                            alert("Erro ao enviar imagem");
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                        {formData.photo_url && (
                                            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                                <img src={formData.photo_url} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--gold-500)' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Biografia</label>
                                        <textarea
                                            className="input-premium"
                                            rows="4"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Salvar Alterações
                                    </button>
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
