import React, { useState, useEffect } from 'react';
import { getSuppliers, getSupplierDebts, createSupplier, updateSupplier, deleteSupplier, uploadFile, API_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, User, Mail, Phone, Building, Trash2, Edit, X, Users, TrendingDown, DollarSign, FileText } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import '../styles/tenant-luxury.css';
import '../styles/professionals.css';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierDebts, setSupplierDebts] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const [loadingDebts, setLoadingDebts] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_Suppliers') || 'grid');

    useEffect(() => {
        localStorage.setItem('viewMode_Suppliers', viewMode);
    }, [viewMode]);

    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
        photo_url: '',
        notes: '',
        active: true
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const response = await getSuppliers();
            setSuppliers(response.data.filter(s => s.active));
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSupplierDebts = async (supplierId) => {
        try {
            setLoadingDebts(true);
            const response = await getSupplierDebts(supplierId);
            setSupplierDebts(response.data);
        } catch (error) {
            console.error('Erro ao carregar dívidas:', error);
        } finally {
            setLoadingDebts(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSupplier(formData);
            setShowCreateModal(false);
            resetForm();
            loadSuppliers();
        } catch (error) {
            toast.error('Erro ao criar fornecedor');
            console.error(error);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateSupplier(selectedSupplier.id, formData);
            setIsEditing(false);
            setShowDetailsModal(false);
            resetForm();
            loadSuppliers();
        } catch (error) {
            toast.error('Erro ao atualizar fornecedor');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deseja realmente remover este fornecedor?')) return;
        try {
            await deleteSupplier(id);
            setShowDetailsModal(false);
            loadSuppliers();
        } catch (error) {
            alert('Erro ao remover fornecedor');
            console.error(error);
        }
    };

    const openDetailsModal = async (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            company_name: supplier.company_name || '',
            document: supplier.document || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            photo_url: supplier.photo_url || '',
            notes: supplier.notes || '',
            active: supplier.active
        });
        setShowDetailsModal(true);
        setIsEditing(false);

        // Carrega as dívidas
        await loadSupplierDebts(supplier.id);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            company_name: '',
            document: '',
            email: '',
            phone: '',
            address: '',
            photo_url: '',
            notes: '',
            active: true
        });
        setSelectedSupplier(null);
        setSupplierDebts(null);
    };

    const getInitials = (name) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Fornecedores</h1>
                    <p>Gerencie seus fornecedores e acompanhe despesas</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Adicionar Fornecedor
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="professionals-loading">
                    <Building size={64} style={{ opacity: 0.2 }} />
                    <p>Carregando fornecedores...</p>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="professionals-empty">
                    <Building size={80} style={{ opacity: 0.1 }} />
                    <h3>Nenhum fornecedor cadastrado</h3>
                    <p>Adicione fornecedores para gerenciar suas despesas</p>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} /> Adicionar Primeiro Fornecedor
                    </button>
                </div>
            ) : (
                <div className="data-card-luxury">
                    {viewMode === 'list' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table-luxury table-compact">
                                <thead>
                                    <tr>
                                        <th>Fornecedor</th>
                                        <th>Razão Social</th>
                                        <th>E-mail</th>
                                        <th>Telefone</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.map(supplier => (
                                        <tr key={supplier.id} onClick={() => openDetailsModal(supplier)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {supplier.photo_url ? (
                                                        <img src={supplier.photo_url.startsWith('http') ? supplier.photo_url : `${API_URL}${supplier.photo_url}`} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                                    ) : (
                                                        <div className="indicator-icon-wrapper" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{getInitials(supplier.name)}</div>
                                                    )}
                                                    <span style={{ fontWeight: 700 }}>{supplier.name}</span>
                                                </div>
                                            </td>
                                            <td>{supplier.company_name || '---'}</td>
                                            <td>{supplier.email || '---'}</td>
                                            <td>{supplier.phone || '---'}</td>
                                            <td>{supplier.active ? <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.65rem' }}>ATIVO</span> : <span style={{ color: 'var(--text-muted)' }}>INATIVO</span>}</td>
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
                            {suppliers.map(supplier => (
                                <div key={supplier.id} className="data-card-item" onClick={() => openDetailsModal(supplier)}>
                                    <div className="card-actions-dropdown">
                                        <button className="btn-icon"><Edit size={14} color="var(--primary)" /></button>
                                    </div>
                                    <div className="data-card-header-flex">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {supplier.photo_url ? (
                                                <img
                                                    src={supplier.photo_url.startsWith('http') ? supplier.photo_url : `${API_URL}${supplier.photo_url}`}
                                                    alt={supplier.name}
                                                    style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="indicator-icon-wrapper" style={{ width: 48, height: 48, fontSize: '1.2rem', fontWeight: 800 }}>
                                                    {getInitials(supplier.name)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="data-card-title">{supplier.name}</h3>
                                                {supplier.company_name && <span className="label" style={{ display: 'block', marginTop: '0.25rem' }}>{supplier.company_name}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="data-card-body" style={{ marginTop: '1rem' }}>
                                        <p>
                                            <span className="label">E-mail</span>
                                            <span style={{ fontWeight: 600 }}>{supplier.email || '---'}</span>
                                        </p>
                                        <p>
                                            <span className="label">Telefone</span>
                                            <span style={{ fontWeight: 600 }}>{supplier.phone || '---'}</span>
                                        </p>
                                    </div>
                                    <div className="data-card-footer">
                                        <span className="label">CNPJ/CPF</span>
                                        <strong>{supplier.document || '---'}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }

            {/* CREATE MODAL */}
            {
                showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-luxury">
                                <h2>Novo Fornecedor</h2>
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
                                        <label>Nome *</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nome do fornecedor"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Razão Social</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            placeholder="Razão social da empresa"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>CNPJ/CPF</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.document}
                                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                                            placeholder="00.000.000/0000-00"
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
                                            placeholder="contato@fornecedor.com"
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
                                        <label>Endereço</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Rua, número, bairro, cidade"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Logo (Link ou Arquivo)</label>
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
                                                placeholder="https://exemplo.com/logo.jpg"
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
                                        <label>Observações</label>
                                        <textarea
                                            className="input-premium"
                                            rows="3"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Anotações sobre o fornecedor..."
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
                )
            }

            {/* DETAILS MODAL WITH DEBTS */}
            {
                showDetailsModal && selectedSupplier && (
                    <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                        <div className="modal-card modal-card-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header-luxury">
                                <h2>{isEditing ? 'Editar Fornecedor' : 'Detalhes do Fornecedor'}</h2>
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
                                        {selectedSupplier.photo_url ? (
                                            <img
                                                src={selectedSupplier.photo_url.startsWith('http') ? selectedSupplier.photo_url : `${API_URL}${selectedSupplier.photo_url}`}
                                                alt={selectedSupplier.name}
                                                className="details-photo"
                                            />
                                        ) : (
                                            <div className="details-photo-placeholder">
                                                {getInitials(selectedSupplier.name)}
                                            </div>
                                        )}
                                        <div className="details-title-group">
                                            <h3>{selectedSupplier.name}</h3>
                                            {selectedSupplier.company_name && (
                                                <span className="specialty-badge-large">{selectedSupplier.company_name}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="details-content">
                                        {/* RESUMO FINANCEIRO */}
                                        {supplierDebts && (
                                            <div className="details-section">
                                                <h4>Resumo Financeiro</h4>
                                                <div className="financial-summary">
                                                    <div className="summary-card">
                                                        <div className="summary-icon" style={{ background: '#ef4444' }}>
                                                            <TrendingDown size={24} color="white" />
                                                        </div>
                                                        <div className="summary-data">
                                                            <label>Total Pendente</label>
                                                            <p style={{ color: '#ef4444' }}>{formatCurrency(supplierDebts.pending_amount)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="summary-card">
                                                        <div className="summary-icon" style={{ background: '#10b981' }}>
                                                            <DollarSign size={24} color="white" />
                                                        </div>
                                                        <div className="summary-data">
                                                            <label>Total Pago</label>
                                                            <p style={{ color: '#10b981' }}>{formatCurrency(supplierDebts.paid_amount)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="summary-card">
                                                        <div className="summary-icon" style={{ background: 'var(--navy-700)' }}>
                                                            <FileText size={24} color="white" />
                                                        </div>
                                                        <div className="summary-data">
                                                            <label>Total de Despesas</label>
                                                            <p>{supplierDebts.total_debts}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* INFORMAÇÕES DE CONTATO */}
                                        <div className="details-section">
                                            <h4>Informações de Contato</h4>
                                            <div className="details-grid">
                                                {selectedSupplier.email && (
                                                    <div className="detail-item">
                                                        <Mail size={18} className="detail-icon" />
                                                        <div>
                                                            <label>E-mail</label>
                                                            <p>{selectedSupplier.email}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedSupplier.phone && (
                                                    <div className="detail-item">
                                                        <Phone size={18} className="detail-icon" />
                                                        <div>
                                                            <label>Telefone</label>
                                                            <p>{selectedSupplier.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedSupplier.document && (
                                                    <div className="detail-item">
                                                        <FileText size={18} className="detail-icon" />
                                                        <div>
                                                            <label>CNPJ/CPF</label>
                                                            <p>{selectedSupplier.document}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedSupplier.address && (
                                                    <div className="detail-item">
                                                        <Building size={18} className="detail-icon" />
                                                        <div>
                                                            <label>Endereço</label>
                                                            <p>{selectedSupplier.address}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* HISTÓRICO DE DESPESAS */}
                                        {supplierDebts && supplierDebts.debts && supplierDebts.debts.length > 0 && (
                                            <div className="details-section">
                                                <h4>Histórico de Despesas ({supplierDebts.debts.length})</h4>
                                                <div className="debts-list">
                                                    {supplierDebts.debts.map(debt => (
                                                        <div key={debt.id} className="debt-item">
                                                            <div className="debt-header">
                                                                <span className="debt-description">{debt.description}</span>
                                                                <span className={`debt-status ${debt.status}`}>
                                                                    {debt.status === 'pago' ? '✓ Pago' : 'Pendente'}
                                                                </span>
                                                            </div>
                                                            <div className="debt-details">
                                                                <span className="debt-amount">{formatCurrency(debt.amount)}</span>
                                                                <span className="debt-date">Vencimento: {formatDate(debt.due_date)}</span>
                                                                {debt.payment_method && (
                                                                    <span className="debt-method">{debt.payment_method}</span>
                                                                )}
                                                                {debt.total_installments > 1 && (
                                                                    <span className="debt-installment">
                                                                        {debt.installment_number}/{debt.total_installments}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedSupplier.notes && (
                                            <div className="details-section">
                                                <h4>Observações</h4>
                                                <p>{selectedSupplier.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            className="btn-icon-danger"
                                            onClick={() => handleDelete(selectedSupplier.id)}
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
                                            <label>Nome *</label>
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
                                            <label>Razão Social</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>CNPJ/CPF</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={formData.document}
                                                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
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
                                            <label>Endereço</label>
                                            <input
                                                type="text"
                                                className="input-premium"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Logo (Link ou Arquivo)</label>
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
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            if (file.size > 4.5 * 1024 * 1024) {
                                                                toast.error("A imagem é muito grande. O limite máximo é 4.5MB.");
                                                                e.target.value = "";
                                                                return;
                                                            }
                                                            try {
                                                                const res = await uploadFile(file);
                                                                setFormData({ ...formData, photo_url: res.data.url });
                                                                toast.success("Logo enviado!");
                                                            } catch (err) {
                                                                toast.error("Erro ao enviar imagem");
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                            {formData.photo_url && (
                                                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                                    <img src={formData.photo_url.startsWith('http') ? formData.photo_url : `${API_URL}${formData.photo_url}`} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--gold-500)' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Observações</label>
                                            <textarea
                                                className="input-premium"
                                                rows="3"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                )
            }
        </div >
    );
};

export default Suppliers;
