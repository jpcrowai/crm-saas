import React, { useEffect, useState } from 'react';
import { getPlans, createPlan, updatePlan, getItems } from '../services/api';
import { Plus, Package, DollarSign, Settings, XCircle, CheckCircle2, ShoppingBag, Edit3 } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [newPlan, setNewPlan] = useState({
        name: '', description: '', price: 0, periodicity: 'monthly', items: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pRes, iRes] = await Promise.all([getPlans(), getItems()]);
            setPlans(pRes.data);
            setItems(iRes.data);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await updatePlan(editingPlan.id, newPlan);
            } else {
                await createPlan(newPlan);
            }
            setShowModal(false);
            setEditingPlan(null);
            setNewPlan({ name: '', description: '', price: 0, periodicity: 'monthly', items: [] });
            loadData();
        } catch (e) { alert("Erro ao salvar plano"); }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setNewPlan({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            periodicity: plan.periodicity,
            items: (plan.items || []).map(i => ({
                id: i.product_id || i.id, // Handle both backend structures if needed
                product_id: i.product_id || i.id,
                name: i.name || i.nome,
                frequency: i.frequency || 'monthly',
                quantity: i.quantidade || 1
            }))
        });
        setShowModal(true);
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Planos de Assinatura</h1>
                    <p>Configure pacotes de serviços e recorrência para seus clientes</p>
                </div>
                <button className="btn-luxury-gold" onClick={() => { setEditingPlan(null); setShowModal(true); }} style={{ borderRadius: '12px' }}>
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
                                    {(plan.items || []).map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                                            <CheckCircle2 size={14} color="var(--success)" /> {item.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-luxury" style={{ width: '100%', marginTop: 'auto', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem' }} onClick={() => handleEdit(plan)}>
                                <Edit3 size={16} /> Detalhes do Plano
                            </button>
                        </div>
                    </div>
                ))}
                {plans.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                        <Package size={48} color="white" style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                        <p style={{ color: 'white' }}>Nenhum plano cadastrado ainda.</p>
                    </div>
                )}
            </div>

            {/* FORM MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '600px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>{editingPlan ? 'Ajustar Plano' : 'Novo Pacote Premium'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Título Comercial do Plano</label>
                                <input className="input-premium" placeholder="Ex: Upgrade Plus, Plano Master..." value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label>Valor da Assinatura (R$)</label>
                                    <input className="input-premium" type="number" step="0.01" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Ciclo de Faturamento</label>
                                    <select className="input-premium" value={newPlan.periodicity} onChange={e => setNewPlan({ ...newPlan, periodicity: e.target.value })}>
                                        <option value="monthly">Mensal</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Composição do Plano (Selecione os Itens)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: '#f1f5f9', borderRadius: '12px' }}>
                                    {items.map(item => {
                                        const isSelected = newPlan.items.find(i => i.product_id === item.id);
                                        return (
                                            <div key={item.id} className={`module-option ${isSelected ? 'selected' : ''}`} style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setNewPlan({ ...newPlan, items: [...newPlan.items, { product_id: item.id, name: item.name, frequency: 'monthly', quantity: 1 }] });
                                                                } else {
                                                                    setNewPlan({ ...newPlan, items: newPlan.items.filter(i => i.product_id !== item.id) });
                                                                }
                                                            }}
                                                        />
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</span>
                                                    </label>
                                                    {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Selecionado</span>}
                                                </div>

                                                {isSelected && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.5rem', marginLeft: '1.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', fontWeight: 600, display: 'block' }}>Qtd.</label>
                                                            <input
                                                                type="number" min="1"
                                                                style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                                value={isSelected.quantity}
                                                                onChange={(e) => {
                                                                    const updated = newPlan.items.map(i => i.product_id === item.id ? { ...i, quantity: parseFloat(e.target.value) } : i);
                                                                    setNewPlan({ ...newPlan, items: updated });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.65rem', fontWeight: 600, display: 'block' }}>Frequência</label>
                                                            <select
                                                                style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                                                value={isSelected.frequency}
                                                                onChange={(e) => {
                                                                    const updated = newPlan.items.map(i => i.product_id === item.id ? { ...i, frequency: e.target.value } : i);
                                                                    setNewPlan({ ...newPlan, items: updated });
                                                                }}
                                                            >
                                                                <option value="monthly">Mensal / Recorrente</option>
                                                                <option value="weekly">Semanal (4x/mês)</option>
                                                                <option value="once">Única vez</option>
                                                                <option value="unlimited">Ilimitado</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem' }}>
                                <button type="button" className="btn-secondary-premium" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Descartar</button>
                                <button type="submit" className="btn-primary-premium" style={{ flex: 1.5 }}>{editingPlan ? 'Salvar Alterações' : 'Publicar Plano'}</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
