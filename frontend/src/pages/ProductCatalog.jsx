import React, { useState } from 'react';
import { getItems, createItem, deleteItem, updateItem, exportItems, importItems } from '../services/api';
import { useDataCache } from '../hooks/useDataCache';
import { useOptimistic } from '../hooks/useOptimistic';
import { showToast } from '../components/Toast';
import { Plus, Search, ShoppingBag, Package, Trash2, DollarSign, XCircle, Settings, Upload, Download, Tag, Edit3, MoreVertical } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import '../styles/tenant-luxury.css';

const generateSku = () => 'ITEM-' + Math.random().toString(36).substr(2, 6).toUpperCase();

const ProductCatalog = () => {
    const { data: items, loading, mutate } = useDataCache('products', getItems);
    const optimistic = useOptimistic(mutate);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newItem, setNewItem] = useState({ sku: '', name: '', description: '', price: 0, category: 'Service' });
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_ProductCatalog') || 'grid');

    // Persist view mode
    React.useEffect(() => {
        localStorage.setItem('viewMode_ProductCatalog', viewMode);
    }, [viewMode]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (editingItem) {
            // Update — optimistic
            const id = editingItem.id;
            const updated = { ...newItem };
            setShowForm(false); setEditingItem(null);
            setNewItem({ sku: '', name: '', description: '', price: 0, category: 'Service' });
            await optimistic(
                prev => prev.map(i => i.id === id ? { ...i, ...updated } : i),
                async () => { await updateItem(id, updated); showToast('Item atualizado!', 'success'); },
                { errorMessage: 'Erro ao atualizar item. Ação revertida.' }
            );
        } else {
            // Create — optimistic
            const tempId = `temp_${Date.now()}`;
            const tempItem = { ...newItem, id: tempId, _pending: true };
            setShowForm(false);
            setNewItem({ sku: '', name: '', description: '', price: 0, category: 'Service' });
            await optimistic(
                prev => [...(prev || []), tempItem],
                async () => {
                    const res = await createItem(newItem);
                    mutate(prev => prev.map(i => i.id === tempId ? { ...res.data, _pending: false } : i));
                    showToast('Item adicionado ao catálogo!', 'success');
                },
                { errorMessage: 'Erro ao criar item. Ação revertida.' }
            );
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setNewItem({ sku: item.sku || generateSku(), name: item.name, description: item.description, price: item.price, category: item.category });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        await optimistic(
            prev => prev.filter(i => i.id !== id),
            () => deleteItem(id),
            { errorMessage: 'Erro ao remover item. Ação revertida.' }
        );
    };

    const handleExport = async () => {
        try {
            const res = await exportItems();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'catalogo_produtos.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (e) { showToast('Erro ao exportar', 'error'); }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await importItems(formData);
            showToast('Catálogo atualizado via Excel!', 'success');
            // Force full refetch from server
            mutate(null);
        } catch (e) { showToast('Erro na importação: Verifique as colunas do arquivo.', 'error'); }
    };

    const filtered = items.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Catálogo de Produtos & Serviços</h1>
                    <p>Gerencie sua oferta comercial e sincronize via Excel</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleExport}>
                        <Download size={18} /> Exportar Excel
                    </button>
                    <label className="btn-primary" style={{ cursor: 'pointer' }}>
                        <Upload size={18} /> Importar Excel
                        <input type="file" hidden onChange={handleImport} accept=".xlsx, .xls" />
                    </label>
                    <button className="btn-primary" onClick={() => { setEditingItem(null); setShowForm(true); }}>
                        <Plus size={20} /> Novo Item
                    </button>
                </div>
            </header>

            <div className="data-card-luxury">
                <div className="luxury-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-500)' }} />
                        <input
                            className="input-premium filter-input"
                            placeholder="Localizar no catálogo..."
                            style={{ paddingLeft: '3rem', width: '100%' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {viewMode === 'list' ? (
                        <table className="table-luxury table-compact">
                            <thead>
                                <tr>
                                    <th>Código/Nome</th>
                                    <th style={{ width: '40%' }}>Descrição do Item</th>
                                    <th>Categoria</th>
                                    <th style={{ textAlign: 'right' }}>Valor Unitário</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(i => (
                                    <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="indicator-icon-wrapper" style={{
                                                    width: 38,
                                                    height: 38,
                                                    background: 'rgba(212, 175, 55, 0.1)',
                                                    color: 'var(--gold-500)',
                                                    fontSize: '0.65rem',
                                                    border: '1px solid rgba(212, 175, 55, 0.2)',
                                                    borderRadius: '8px'
                                                }}>
                                                    {i.sku || 'N/A'}
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'white' }}>{i.name}</span>
                                            </div>
                                        </td>
                                        <td><p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>{i.description || 'Sem descrição'}</p></td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'rgba(255,255,255,0.6)',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>{i.category}</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--gold-500)', fontSize: '1.1rem' }}>
                                            R$ {(i.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(i)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}
                                                >
                                                    <Edit3 size={16} color="var(--gold-500)" />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    style={{ background: 'rgba(220, 38, 38, 0.1)', borderRadius: '8px', padding: '8px' }}
                                                    onClick={() => handleDelete(i.id)}
                                                >
                                                    <Trash2 size={16} color="#ef4444" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="data-grid-cards">
                            {filtered.map(i => (
                                <div key={i.id} className="data-card-item">
                                    <div className="card-actions-dropdown" style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        zIndex: 10
                                    }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEdit(i)}
                                            title="Editar"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            <Edit3 size={16} color="var(--gold-500)" />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDelete(i.id)}
                                            title="Excluir"
                                            style={{
                                                background: 'rgba(220, 38, 38, 0.1)',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                border: '1px solid rgba(220, 38, 38, 0.2)',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                    <div className="data-card-header-flex">
                                        <div>
                                            <div style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.65rem', marginBottom: '0.5rem' }}>
                                                {i.sku || 'N/A'}
                                            </div>
                                            <h3 className="data-card-title">{i.name}</h3>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-500)', display: 'inline-block', marginTop: '0.5rem' }}>
                                                {i.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="data-card-body">
                                        <p style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                            {i.description || 'Sem descrição'}
                                        </p>
                                    </div>
                                    <div className="data-card-footer">
                                        <span className="label">Valor Nominal</span>
                                        <strong style={{ fontSize: '1.2rem', color: 'var(--gold-500)' }}>
                                            R$ {(i.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {filtered.length === 0 && (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', width: '100%' }}>
                            <Package size={64} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                            <p style={{ fontWeight: 600 }}>Nenhum item disponível no seu catálogo para esta visualização.</p>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '480px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>{editingItem ? 'Editar Cadastro' : 'Novo Recurso'}</h2>
                            <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Código (SKU)</label>
                                <input className="input-premium" placeholder="Ex: SERV-001" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nome do Produto ou Serviço</label>
                                <input className="input-premium" placeholder="Ex: Consultoria Mensal" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Descrição Detalhada</label>
                                <textarea className="input-premium" rows={3} placeholder="Descreva os benefícios e entregas deste item..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Preço Base (R$)</label>
                                    <input className="input-premium" type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select className="input-premium" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                        <option value="Service">Serviço</option>
                                        <option value="Product">Produto</option>
                                        <option value="Subscription">Recorrência</option>
                                    </select>
                                </div>
                            </div>
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary-premium" style={{ flex: 1, padding: '0.85rem' }} onClick={() => { setShowForm(false); setEditingItem(null); }}>Cancelar</button>
                                <button type="submit" className="btn-primary-premium" style={{ flex: 1.5, padding: '0.85rem' }}>{editingItem ? 'Atualizar Item' : 'Cadastrar no Catálogo'}</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
