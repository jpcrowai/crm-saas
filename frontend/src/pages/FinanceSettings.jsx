import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, deleteCategory, getPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../services/api';
import { Plus, Tag, CreditCard, Trash2, XCircle, Settings, Layers, Wallet, MoreVertical, ShieldCheck, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import '../styles/tenant-luxury.css';

const FinanceSettings = () => {
    const [categories, setCategories] = useState([]);
    const [methods, setMethods] = useState([]);
    const [newCategory, setNewCategory] = useState({ nome: '', tipo: 'ambos' });
    const [newMethod, setNewMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cRes, mRes] = await Promise.all([getCategories(), getPaymentMethods()]);
            setCategories(cRes.data);
            setMethods(mRes.data);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar configurações");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.nome) return;
        try {
            await createCategory(newCategory);
            setNewCategory({ nome: '', tipo: 'ambos' });
            toast.success("Categoria adicionada!");
            loadData();
        } catch (e) {
            toast.error("Erro ao adicionar categoria");
        }
    };

    const handleAddMethod = async (e) => {
        if (e) e.preventDefault();
        if (!newMethod) return;
        try {
            await createPaymentMethod({ nome: newMethod });
            setNewMethod('');
            toast.success("Método de pagamento adicionado!");
            loadData();
        } catch (e) {
            toast.error("Erro ao adicionar método");
        }
    };

    const handleQuickAddMethod = async (name) => {
        setNewMethod(name);
        // We'll let the user click the button or we can auto-submit
        try {
            await createPaymentMethod({ nome: name });
            toast.success(`${name} adicionado!`);
            loadData();
        } catch (e) {
            toast.error("Erro ao adicionar método");
        }
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{ pading: '8px', background: 'var(--gold-500)', borderRadius: '8px', color: 'var(--navy-950)' }}>
                            <Settings size={20} style={{ margin: '8px' }} />
                        </div>
                        <h1 style={{ margin: 0 }}>Configurações Financeiras</h1>
                    </div>
                    <p>Personalize as categorias de fluxo de caixa e métodos de recebimento</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
                {/* CATEGORIES CARD */}
                <div className="card-dark" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={22} color="var(--gold-500)" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gold-400)' }}>Categorias de Lançamento</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-400)' }}>Organize suas receitas e despesas</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddCategory} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.5fr', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div className="form-group">
                            <label className="label-premium" style={{ color: 'var(--gold-400)' }}>Nome da Categoria</label>
                            <input className="input-premium" placeholder="ex: Marketing Digital" value={newCategory.nome} onChange={e => setNewCategory({ ...newCategory, nome: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label-premium" style={{ color: 'var(--gold-400)' }}>Tipo</label>
                            <select className="input-premium" value={newCategory.tipo} onChange={e => setNewCategory({ ...newCategory, tipo: e.target.value })}>
                                <option value="ambos">Ambos (E/S)</option>
                                <option value="entrada">Apenas Receita</option>
                                <option value="saida">Apenas Despesa</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ height: '45px', width: '100%', marginBottom: '4px' }}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {categories.map(c => (
                            <div key={c.id} className="selection-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.tipo === 'entrada' ? 'var(--success)' : c.tipo === 'saida' ? 'var(--error)' : 'var(--gold-500)' }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: 'white' }}>{c.nome}</p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                                                {c.tipo === 'entrada' ? 'Foco em Receitas' : c.tipo === 'saida' ? 'Foco em Despesas' : 'Misto'}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="btn-icon-danger" onClick={() => deleteCategory(c.id).then(loadData)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                                <Layers size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--gray-400)' }}>Nenhuma categoria cadastrada.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PAYMENT METHODS CARD */}
                <div className="card-dark" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={22} color="var(--gold-500)" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--gold-400)' }}>Métodos de Pagamento</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-400)' }}>Como você recebe de seus clientes</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label className="label-premium" style={{ color: 'var(--gold-400)', marginBottom: '1rem' }}>Sugestões Rápidas</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Boleto Bancário'].map(m => (
                                <button
                                    key={m}
                                    className="btn-secondary"
                                    style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', padding: '0.6rem' }}
                                    onClick={() => handleQuickAddMethod(m)}
                                    disabled={methods.some(existing => existing.nome === m)}
                                >
                                    <Plus size={14} style={{ marginRight: '6px' }} /> {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleAddMethod} style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="label-premium" style={{ color: 'var(--gold-400)' }}>Outro Método</label>
                            <input className="input-premium" placeholder="ex: Permuta" value={newMethod} onChange={e => setNewMethod(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ height: '45px', marginBottom: '4px' }}>
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {methods.map(m => (
                            <div key={m.id} className="selection-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CreditCard size={18} color="var(--gold-500)" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: 'white' }}>{m.nome}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldCheck size={12} color="var(--success)" />
                                                <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>Ativo</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn-icon-danger" onClick={() => deletePaymentMethod(m.id).then(loadData)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceSettings;
