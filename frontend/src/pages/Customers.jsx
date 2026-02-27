import React, { useState } from 'react';
import { getCustomers, createCustomer, deleteCustomer } from '../services/api';
import { useDataCache } from '../hooks/useDataCache';
import { useOptimistic } from '../hooks/useOptimistic';
import { Plus, Search, Trash2, FileText, Briefcase, XCircle } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Customers = () => {
    const { data: customers, loading, mutate } = useDataCache('customers', getCustomers);
    const optimistic = useOptimistic(mutate);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', document: '' });

    const handleCreate = async (e) => {
        e.preventDefault();
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

    const filtered = (customers || []).filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Base de Clientes</h1>
                    <p>Gerencie seus parceiros e histórico de relacionamento</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={20} /> Novo Cliente
                    </button>
                </div>
            </header>

            <div className="data-card-luxury">
                <div className="luxury-filter-bar">
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
                </div>

                {loading && customers.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinner-subtle" />
                        <p style={{ marginTop: '1rem' }}>Carregando clientes...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-luxury">
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
                                                <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
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
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.3rem 0.6rem', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>Ativo</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => handleDelete(c.id, c.name)} title="Remover" disabled={c._pending}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                    <div className="card" style={{ width: '480px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Novo Cadastro</h2>
                            <button onClick={() => setShowForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar Cliente</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
