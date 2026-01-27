import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, deleteCategory, getPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../services/api';
import { Plus, Tag, CreditCard, Trash2, XCircle, Settings, Layers, Wallet, MoreVertical } from 'lucide-react';
import '../styles/tenant-luxury.css';

const FinanceSettings = () => {
    const [categories, setCategories] = useState([]);
    const [methods, setMethods] = useState([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [cRes, mRes] = await Promise.all([getCategories(), getPaymentMethods()]);
            setCategories(cRes.data);
            setMethods(mRes.data);
        } catch (e) { console.error(e); }
    };

    const handleAddCategory = async () => {
        if (!newItem) return;
        await createCategory({ name: newItem });
        setNewItem('');
        loadData();
    };

    const handleAddMethod = async (name) => {
        await createPaymentMethod({ name });
        loadData();
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Configurações Financeiras</h1>
                    <p>Personalize categorias e métodos de pagamento do seu negócio</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                {/* CATEGORIES CARD */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Tag size={20} color="var(--gold-500)" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Categorias de Lançamento</h3>
                        </div>
                    </div>
                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <input className="input-premium" placeholder="Nova Categoria (ex: Marketing)" value={newItem} onChange={e => setNewItem(e.target.value)} />
                            <button className="btn-primary" onClick={handleAddCategory}><Plus size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {categories.map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{c.name}</span>
                                    <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => deleteCategory(c.id).then(loadData)}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PAYMENT METHODS CARD */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Wallet size={20} color="var(--gold-500)" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Métodos de Recebimento</h3>
                        </div>
                    </div>
                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Boleto'].map(m => (
                                <button key={m} className="btn-secondary" onClick={() => handleAddMethod(m)}>
                                    + {m}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {methods.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <CreditCard size={16} color="var(--gold-600)" />
                                        <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{m.name}</span>
                                    </div>
                                    <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => deletePaymentMethod(m.id).then(loadData)}><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceSettings;
