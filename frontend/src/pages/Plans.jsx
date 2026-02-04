import React, { useEffect, useState } from 'react';
import { getPlans, createPlan, updatePlan, getItems } from '../services/api';
import { Plus, Package, XCircle, CheckCircle2, Edit3, Save, Trash2 } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [loading, setLoading] = useState(false);

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
                <button className="btn-primary" onClick={() => { setEditingPlan(null); resetForm(); setShowModal(true); }}>
                    <Plus size={20} /> Criar Novo Plano
                </button>
            </header>

            <div className="indicator-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {plans.map(plan => (
                    <div key={plan.id} className="data-card-luxury" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div className="modal-header-luxury" style={{ padding: '1.5rem', borderBottom: 'none' }}>
                            <h3 style={{ color: 'var(--text-gold)', margin: 0, fontSize: '1.1rem' }}>{plan.name}</h3>
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--navy-900)', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>R$</span> {(plan.price || 0).toLocaleString('pt-BR')}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{plan.periodicity === 'monthly' ? 'mês' : 'ano'}</span>
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{plan.description}</p>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>Incluso no Pacote</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {plan.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                                            <CheckCircle2 size={14} color="var(--success)" /> {item.name} ({item.quantity}x)
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => handleEdit(plan)}>
                                <Edit3 size={16} /> Detalhes do Plano
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
