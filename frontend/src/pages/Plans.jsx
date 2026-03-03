import React, { useEffect, useState } from 'react';
import { getPlans, createPlan, updatePlan, getItems } from '../services/api';
import { Plus, Package, XCircle, CheckCircle2, Edit3, Save, Trash2, List } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
import '../styles/tenant-luxury.css';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_Plans') || 'grid');

    useEffect(() => {
        localStorage.setItem('viewMode_Plans', viewMode);
    }, [viewMode]);

    // State for the form (shared for create and edit)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        periodicity: 'monthly',
        items: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pRes, iRes] = await Promise.all([getPlans(), getItems()]);
            // Backend keeps fields in Portuguese but with camelCase/snake_case mix sometimes.
            // Our frontend expects 'name', 'price', etc. 
            // Let's normalize data from backend if needed.
            const normalizedPlans = pRes.data.map(p => ({
                id: p.id,
                name: p.nome || p.name,
                description: p.descricao || p.description,
                price: p.valor_base || p.price || 0,
                periodicity: p.periodicidade || p.periodicity || 'monthly',
                items: (p.itens || p.items || []).map(it => ({
                    product_id: it.product_id,
                    name: it.nome || it.name,
                    quantity: it.quantidade || it.quantity || 1,
                    frequency: it.frequency || 'monthly'
                }))
            }));
            setPlans(normalizedPlans);
            setItems(iRes.data);
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            alert("O nome do plano é obrigatório.");
            return false;
        }
        if (parseFloat(formData.price) < 0) {
            alert("O preço não pode ser negativo.");
            return false;
        }
        return true;
    };

    const transformPayload = (data) => {
        return {
            nome: data.name,
            descricao: data.description,
            periodicidade: data.periodicity,
            valor_base: parseFloat(data.price),
            itens: data.items.map(it => {
                const product = items.find(p => p.id === it.product_id);
                return {
                    product_id: it.product_id,
                    nome: it.name,
                    quantidade: parseFloat(it.quantity),
                    frequency: it.frequency,
                    preco_unitario: parseFloat(product?.price || 0),
                    total: parseFloat(product?.price || 0) * parseFloat(it.quantity)
                };
            }),
            ativo: true
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = transformPayload(formData);

            if (editingPlan) {
                console.log(`Updating plan ${editingPlan.id}...`, payload);
                const response = await updatePlan(editingPlan.id, payload);
                console.log("Update success:", response.data);
            } else {
                console.log("Creating new plan...", payload);
                await createPlan(payload);
            }

            setShowModal(false);
            setEditingPlan(null);
            resetForm();
            await loadData();

            // Temporary alert for feedback (ideally using a toast)
            alert(editingPlan ? "Plano atualizado com sucesso!" : "Plano criado com sucesso!");
        } catch (e) {
            console.error("Erro ao salvar:", e);
            alert("Erro ao salvar plano: " + (e.response?.data?.detail || "Erro de conexão com o servidor"));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            periodicity: 'monthly',
            items: []
        });
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            periodicity: plan.periodicity,
            items: [...plan.items]
        });
        setShowModal(true);
    };

    const handleToggleItem = (product) => {
        const isSelected = formData.items.find(it => it.product_id === product.id);
        if (isSelected) {
            setFormData({
                ...formData,
                items: formData.items.filter(it => it.product_id !== product.id)
            });
        } else {
            setFormData({
                ...formData,
                items: [...formData.items, {
                    product_id: product.id,
                    name: product.name,
                    quantity: 1,
                    frequency: 'monthly'
                }]
            });
        }
    };

    const updateItemDetail = (productId, field, value) => {
        const updatedItems = formData.items.map(it =>
            it.product_id === productId ? { ...it, [field]: value } : it
        );
        setFormData({ ...formData, items: updatedItems });
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Planos de Assinatura</h1>
                    <p>Configure pacotes de serviços e recorrência para seus clientes</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    <button className="btn-primary" onClick={() => { setEditingPlan(null); resetForm(); setShowModal(true); }}>
                        <Plus size={20} /> Criar Novo Plano
                    </button>
                </div>
            </header>

            {viewMode === 'list' ? (
                <div className="data-card-luxury" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table-luxury table-compact">
                            <thead>
                                <tr>
                                    <th>Nome do Plano</th>
                                    <th>Ciclo</th>
                                    <th style={{ textAlign: 'right' }}>Preço</th>
                                    <th>Serviços Inclusos</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(plan => (
                                    <tr key={plan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ fontWeight: 700, color: 'white' }}>{plan.name}</td>
                                        <td style={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.6)' }}>{plan.periodicity === 'monthly' ? 'Mensal' : 'Anual'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--gold-500)', fontSize: '1.1rem' }}>
                                            R$ {(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {plan.items.map((it, idx) => (
                                                    <span key={idx} style={{
                                                        fontSize: '0.65rem',
                                                        background: 'rgba(212, 175, 55, 0.1)',
                                                        color: 'var(--gold-400)',
                                                        border: '1px solid rgba(212, 175, 55, 0.2)',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontWeight: 700
                                                    }}>
                                                        {it.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(plan)}
                                                style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}
                                            >
                                                <Edit3 size={16} color="var(--gold-500)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="indicator-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {plans.map(plan => (
                        <div key={plan.id} className="data-card-item" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            position: 'relative',
                            padding: '2rem'
                        }}>
                            <div className="card-actions-dropdown" style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                zIndex: 10
                            }}>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleEdit(plan)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        padding: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    <Edit3 size={18} color="var(--gold-500)" />
                                </button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ pading: '0.5rem', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px' }}>
                                        <Package size={18} />
                                    </div>
                                    <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{plan.name}</h3>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', minHeight: '3em' }}>{plan.description || 'Sem descrição definida para este plano.'}</p>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold-500)', display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: 0 }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>R$</span>
                                    {(plan.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                        /{plan.periodicity === 'monthly' ? 'mês' : 'ano'}
                                    </span>
                                </p>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                flex: 1
                            }}>
                                <label style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    color: 'var(--gold-500)',
                                    display: 'block',
                                    marginBottom: '1rem',
                                    letterSpacing: '0.05em'
                                }}>Serviços Inclusos</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {plan.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                                            <CheckCircle2 size={16} color="var(--gold-500)" style={{ opacity: 0.8 }} />
                                            <span>{item.name}</span>
                                            <span style={{
                                                marginLeft: 'auto',
                                                fontSize: '0.7rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                color: 'white',
                                                fontWeight: 700
                                            }}>{item.quantity}x</span>
                                        </div>
                                    ))}
                                    {plan.items.length === 0 && (
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Nenhum serviço vinculado</div>
                                    )}
                                </div>
                            </div>

                            <button className="btn-primary-premium" style={{ width: '100%', padding: '1rem' }} onClick={() => handleEdit(plan)}>
                                <Edit3 size={18} /> Configurar Plano
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="card-dark" style={{ maxWidth: '640px', width: '90%', maxHeight: '90vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header-luxury">
                            <h2>{editingPlan ? 'Editar Plano' : 'Novo Pacote'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
                            <div className="form-group-luxury">
                                <label>Nome do Plano</label>
                                <input
                                    className="input-premium"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group-luxury">
                                <label>Descrição</label>
                                <textarea
                                    className="input-premium"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div className="form-group-luxury">
                                    <label>Preço Base (R$)</label>
                                    <input
                                        className="input-premium"
                                        type="number" step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-luxury">
                                    <label>Ciclo</label>
                                    <select
                                        className="input-premium"
                                        value={formData.periodicity}
                                        onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                                    >
                                        <option value="monthly">Mensal</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group-luxury">
                                <label>Selecione os Serviços Inclusos</label>
                                <div style={{
                                    display: 'grid',
                                    gap: '0.75rem',
                                    maxHeight: '250px',
                                    overflowY: 'auto',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {items.map(product => {
                                        const selected = formData.items.find(it => it.product_id === product.id);
                                        return (
                                            <div key={product.id} className={`selection-card ${selected ? 'selected' : ''}`} onClick={() => handleToggleItem(product)}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected}
                                                    onChange={() => { }} // Managed by parent click
                                                />
                                                <div className="selection-card-content">
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{product.name}</span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--gold-400)', fontWeight: 800 }}>
                                                            R$ {parseFloat(product.price).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>

                                                    {selected && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                            <div>
                                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-400)', marginBottom: '4px' }}>QTD</label>
                                                                <input
                                                                    type="number" min="1"
                                                                    className="input-premium"
                                                                    value={selected.quantity}
                                                                    onChange={(e) => updateItemDetail(product.id, 'quantity', e.target.value)}
                                                                    style={{ padding: '0.4rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-400)', marginBottom: '4px' }}>FREQUÊNCIA</label>
                                                                <select
                                                                    className="input-premium"
                                                                    value={selected.frequency}
                                                                    onChange={(e) => updateItemDetail(product.id, 'frequency', e.target.value)}
                                                                    style={{ padding: '0.4rem' }}
                                                                >
                                                                    <option value="monthly">Mensal</option>
                                                                    <option value="weekly">Semanal</option>
                                                                    <option value="once">Única</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <footer style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                                    {loading ? 'Processando...' : (
                                        <>
                                            <Save size={18} /> {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                                        </>
                                    )}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
