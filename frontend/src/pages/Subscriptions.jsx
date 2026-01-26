import React, { useEffect, useState } from 'react';
import { getSubscriptions, getPlans, getCustomers, createSubscription, updateSubscriptionStatus } from '../services/api';
import { Plus, Search, CreditCard, User, Package, Calendar, MoreVertical, XCircle, CheckCircle2, AlertCircle, FileText, Settings } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newSub, setNewSub] = useState({ customer_id: '', plan_id: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [sRes, pRes, cRes] = await Promise.all([getSubscriptions(), getPlans(), getCustomers()]);
            setSubscriptions(sRes.data);
            setPlans(pRes.data);
            setCustomers(cRes.data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSubscription(newSub);
            setShowForm(false);
            setNewSub({ customer_id: '', plan_id: '' });
            loadData();
        } catch (e) { alert("Erro ao criar assinatura"); }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: { bg: '#dcfce7', color: '#166534', icon: <CheckCircle2 size={12} /> },
            past_due: { bg: '#fee2e2', color: '#991b1b', icon: <AlertCircle size={12} /> },
            canceled: { bg: '#f1f5f9', color: '#64748b', icon: <XCircle size={12} /> }
        };
        const s = styles[status] || styles.canceled;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                padding: '0.35rem 0.65rem', borderRadius: '6px', background: s.bg, color: s.color
            }}>
                {s.icon} {status}
            </span>
        );
    };

    const filtered = subscriptions.filter(s =>
        s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Gestão de Assinaturas</h1>
                    <p>Controle de recorrência, contratos e status de faturamento</p>
                </div>
                <button className="btn-luxury-gold" onClick={() => setShowForm(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
                    <Plus size={20} /> Nova Assinatura
                </button>
            </header>

            <div className="data-card-luxury">
                <div className="luxury-filter-bar">
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-500)' }} />
                        <input
                            className="input-premium filter-input"
                            placeholder="Buscar por cliente ou plano..."
                            style={{ paddingLeft: '3rem', width: '100%' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table-luxury">
                        <thead>
                            <tr>
                                <th>Titular da Conta</th>
                                <th>Plano Contratado</th>
                                <th>Status</th>
                                <th>Vencimento</th>
                                <th style={{ textAlign: 'right' }}>Valor Mensal</th>
                                <th style={{ textAlign: 'right' }}>Gestão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="indicator-icon-wrapper" style={{ width: 32, height: 32, background: 'var(--navy-900)', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>
                                                {s.customer_name?.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{s.customer_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Package size={14} color="var(--gold-600)" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.plan_name}</span>
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(s.status)}</td>
                                    <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                                        {s.next_billing ? new Date(s.next_billing).toLocaleDateString('pt-BR') : '---'}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--navy-950)' }}>
                                        R$ {(s.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-action-luxury" title="Ver Contrato PDF" onClick={() => window.open(`http://localhost:8000/api/v1/tenant/subscriptions/${s.id}/contract`, '_blank')}>
                                                <FileText size={16} />
                                            </button>
                                            <button className="btn-action-luxury" title="Configurações"><Settings size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <CreditCard size={64} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                            <p style={{ fontWeight: 600 }}>Nenhuma assinatura ativa encontrada.</p>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '480px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Ativar Assinatura</h2>
                            <button onClick={() => setShowForm(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Selecionar Cliente</label>
                                <select className="input-premium" value={newSub.customer_id} onChange={e => setNewSub({ ...newSub, customer_id: e.target.value })} required>
                                    <option value="">Escolha um titular...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pacote de Destino</label>
                                <select className="input-premium" value={newSub.plan_id} onChange={e => setNewSub({ ...newSub, plan_id: e.target.value })} required>
                                    <option value="">Escolha um plano...</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                                </select>
                            </div>

                            <div style={{ background: 'var(--gold-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gold-400)', display: 'flex', gap: '0.75rem' }}>
                                <AlertCircle size={20} color="var(--gold-600)" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.75rem', color: 'var(--gold-600)', fontWeight: 600 }}>Ao ativar, o sistema gerará automaticamente o contrato PDF e o primeiro lançamento financeiro recorrente.</p>
                            </div>

                            <footer style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary-premium" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary-premium" style={{ flex: 1.5 }}>Efetivar Assinatura</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
