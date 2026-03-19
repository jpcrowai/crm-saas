import React, { useState } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, upgradeCustomer } from '../services/api';
import { useDataCache } from '../hooks/useDataCache';
import { useOptimistic } from '../hooks/useOptimistic';
import { Plus, Search, Trash2, FileText, Briefcase, XCircle, CheckCircle2, UserCheck } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import '../styles/tenant-luxury.css';

const Customers = () => {
    const { data: customers, loading, mutate } = useDataCache('customers', getCustomers);
    const optimistic = useOptimistic(mutate);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', document: '' });
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_Customers') || 'grid');

    React.useEffect(() => {
        localStorage.setItem('viewMode_Customers', viewMode);
    }, [viewMode]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (isEditing && selectedCustomer) {
            const updatedData = { ...newCustomer };
            const id = selectedCustomer.id;
            setShowForm(false);
            setNewCustomer({ name: '', email: '', phone: '', document: '' });
            setIsEditing(false);
            setSelectedCustomer(null);

            await optimistic(
                prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c),
                async () => {
                    await updateCustomer(id, updatedData);
                },
                { errorMessage: 'Erro ao atualizar cliente.' }
            );
            return;
        }

        const tempId = `temp_${Date.now()}`;
        const tempCustomer = { ...newCustomer, id: tempId, _pending: true };
        setShowForm(false);
        setNewCustomer({ name: '', email: '', phone: '', document: '' });

        await optimistic(
            prev => [...(prev || []), tempCustomer],
            async () => {
                const res = await createCustomer(newCustomer);
                // Replace temp with real
                mutate(prev => prev.map(c => c.id === tempId ? { ...res.data, _pending: false } : c));
            },
            { errorMessage: 'Erro ao criar cliente. Ação foi revertida.' }
        );
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remover "${name}"?`)) return;
        await optimistic(
            prev => prev.filter(c => c.id !== id),
            () => deleteCustomer(id),
            { errorMessage: `Erro ao remover "${name}". Ação foi revertida.` }
        );
    };

    const handleUpgrade = async (id, name) => {
        if (!window.confirm(`Tornar "${name}" um cliente efetivo?`)) return;
        await optimistic(
            prev => prev.map(c => c.id === id ? { ...c, customer_type: 'cliente' } : c),
            () => upgradeCustomer(id),
            { errorMessage: `Erro ao atualizar "${name}".` }
        );
    };

    const filtered = (customers || []).filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setNewCustomer({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            document: customer.document || ''
        });
        setIsEditing(true);
        setShowForm(true);
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedCustomer(null);
        setNewCustomer({ name: '', email: '', phone: '', document: '' });
        setShowForm(true);
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Base de Clientes</h1>
                    <p>Gerencie seus parceiros e histórico de relacionamento</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <Plus size={20} /> Novo Cliente
                    </button>
                </div>
            </header>

            <div className="data-card-luxury">
                <div className="luxury-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-500)' }} />
                        <input
                            className="input-premium filter-input"
                            placeholder="Buscar por nome ou e-mail..."
                            style={{ paddingLeft: '3rem', width: '100%' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                {loading && customers.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinner-subtle" />
                        <p style={{ marginTop: '1rem' }}>Carregando clientes...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        {viewMode === 'list' ? (
                            <table className="table-luxury table-compact">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Contato</th>
                                        <th>Documento</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.id} style={{ opacity: c._pending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="indicator-icon-wrapper" style={{ width: 36, height: 36, background: 'var(--navy-900)', color: 'white', fontSize: '0.8rem', fontWeight: 800 }}>
                                                        {(c.name || 'C').charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight: 700, color: 'var(--white)' }}>
                                                        {c.name}
                                                        {c._pending && <span style={{ fontSize: '0.65rem', marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>salvando...</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <p style={{ fontWeight: 600 }}>{c.email}</p>
                                                    <p style={{ color: 'var(--text-muted)' }}>{c.phone}</p>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--navy-700)' }}>{c.document || '---'}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '4px',
                                                        background: c.customer_type === 'lead' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        color: c.customer_type === 'lead' ? 'var(--gold-600)' : 'var(--success)',
                                                        width: 'fit-content'
                                                    }}>
                                                        {c.customer_type === 'lead' ? 'Prospecção (Lead)' : 'Cliente Ativo'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {c.customer_type === 'lead' && (
                                                        <button
                                                            className="btn-action-luxury"
                                                            style={{ color: 'var(--success)' }}
                                                            onClick={() => handleUpgrade(c.id, c.name)}
                                                            title="Tornar Cliente"
                                                            disabled={c._pending}
                                                        >
                                                            <UserCheck size={16} />
                                                        </button>
                                                    )}
                                                    <button className="btn-action-luxury" style={{ color: 'var(--primary)' }} onClick={() => openEditModal(c)} title="Editar" disabled={c._pending}>
                                                        <FileText size={16} />
                                                    </button>
                                                    <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c.id, c.name)} title="Remover" disabled={c._pending}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="data-grid-cards">
                                {filtered.map(c => (
                                    <div key={c.id} className="data-card-item" style={{ opacity: c._pending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                                        <div className="card-actions-dropdown" style={{ display: 'flex', gap: '0.2rem' }}>
                                            <button className="btn-icon" onClick={() => openEditModal(c)} title="Editar" disabled={c._pending}>
                                                <FileText size={16} color="var(--primary)" />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleDelete(c.id, c.name)} title="Remover" disabled={c._pending}>
                                                <Trash2 size={16} color="var(--error)" />
                                            </button>
                                        </div>
                                        <div className="data-card-header-flex">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="indicator-icon-wrapper" style={{ width: 48, height: 48, background: 'var(--navy-900)', color: 'white', fontSize: '1.2rem', fontWeight: 800 }}>
                                                    {(c.name || 'C').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="data-card-title">
                                                        {c.name}
                                                        {c._pending && <span style={{ fontSize: '0.65rem', marginLeft: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>salvando...</span>}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            textTransform: 'uppercase',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '4px',
                                                            background: c.customer_type === 'lead' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                            color: c.customer_type === 'lead' ? 'var(--gold-500)' : '#10b981'
                                                        }}>
                                                            {c.customer_type === 'lead' ? 'Lead' : 'Cliente'}
                                                        </span>
                                                        {c.customer_type === 'lead' && (
                                                            <button
                                                                className="btn-icon"
                                                                style={{ padding: '2px', color: 'var(--success)' }}
                                                                onClick={() => handleUpgrade(c.id, c.name)}
                                                                title="Tornar Cliente"
                                                            >
                                                                <UserCheck size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="data-card-body" style={{ marginTop: '1rem' }}>
                                            <p>
                                                <span className="label">E-mail</span>
                                                <span style={{ fontWeight: 600 }}>{c.email || 'Não informado'}</span>
                                            </p>
                                            <p>
                                                <span className="label">Telefone</span>
                                                <span style={{ fontWeight: 600 }}>{c.phone || 'Não informado'}</span>
                                            </p>
                                            <p>
                                                <span className="label">Documento</span>
                                                <span style={{ fontWeight: 600 }}>{c.document || 'Não informado'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {filtered.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Briefcase size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                                <p>Nenhum cliente encontrado nesta busca.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '90%', maxWidth: '480px', padding: '0', overflow: 'hidden', margin: 'auto' }}>
                        <div className="modal-header-luxury">
                            <h2>{isEditing ? 'Editar Cliente' : 'Novo Cadastro'}</h2>
                            <button onClick={() => setShowForm(false)} className="btn-close-modal"><XCircle size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Nome do Cliente / Razão Social</label>
                                <input className="input-premium" placeholder="Ex: João da Silva" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>E-mail Principal</label>
                                <input className="input-premium" type="email" placeholder="cliente@exemplo.com" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Telefone/WhatsApp</label>
                                    <input className="input-premium" placeholder="(11) 9..." value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>CPF / CNPJ</label>
                                    <input className="input-premium" placeholder="000.000.000-00" value={newCustomer.document} onChange={e => setNewCustomer({ ...newCustomer, document: e.target.value })} />
                                </div>
                            </div>
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1, minWidth: '120px' }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, minWidth: '120px' }}>{isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
