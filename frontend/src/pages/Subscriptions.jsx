import React, { useEffect, useState } from 'react';
import { getSubscriptions, getPlans, getCustomers, createSubscription, updateSubscriptionStatus, uploadSubscriptionContract, API_URL, getProfessionals } from '../services/api';
import { Plus, Search, CreditCard, User, Package, Calendar, MoreVertical, XCircle, CheckCircle2, AlertCircle, FileText, Settings, Upload } from 'lucide-react';
import '../styles/tenant-luxury.css';

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newSub, setNewSub] = useState({ customer_id: '', plan_id: '', professional_id: '' });
    const [manageSub, setManageSub] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [sRes, pRes, cRes, proRes] = await Promise.all([getSubscriptions(), getPlans(), getCustomers(), getProfessionals()]);
            const sData = Array.isArray(sRes.data) ? sRes.data : [];
            const pData = Array.isArray(pRes.data) ? pRes.data : [];
            const cData = Array.isArray(cRes.data) ? cRes.data : [];
            const proData = Array.isArray(proRes.data) ? proRes.data : [];

            // Map names for the UI
            const mappedSubs = sData.map(s => {
                const customer = cData.find(c => c.id === s.customer_id);
                const plan = pData.find(p => p.id === s.plano_id);
                return {
                    ...s,
                    customer_name: customer?.name || customer?.nome || 'Cliente Desconhecido',
                    plan_name: plan?.nome || plan?.name || 'Plano Descontinuado',
                    price: s.valor_total || plan?.valor_base || plan?.price || 0
                };
            });

            setSubscriptions(mappedSubs);
            setPlans(pData);
            setCustomers(cData);
            setProfessionals(proData);
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
            setSubscriptions([]);
            setPlans([]);
            setCustomers([]);
        }
    };

    const handleDownloadContract = async (id) => {
        try {
            // Standard approach: open in new tab for direct Supabase URL or use our API stream
            const token = localStorage.getItem('token');
            const downloadUrl = `${API_URL}/tenant/subscriptions/${id}/contract?token=${token}`;
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error("Erro ao baixar contrato:", error);
            alert("Erro ao acessar contrato. Verifique se ele foi gerado corretamente.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const plan = plans.find(p => p.id === newSub.plan_id);
            if (!plan) throw new Error("Plano não selecionado");

            const startDate = new Date();
            const durationMonths = newSub.duration_months || 12;
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + durationMonths);

            const payload = {
                customer_id: newSub.customer_id,
                plano_id: newSub.plan_id,
                professional_id: newSub.professional_id,
                data_inicio: startDate.toISOString().split('T')[0],
                data_fim: endDate.toISOString().split('T')[0],
                periodicidade: plan.periodicity || plan.periodicidade || 'mensal',
                valor_total: parseFloat(plan.price || plan.valor_base || 0),
                status: 'Pendente Assinatura',
                itens: (plan.items || plan.itens || []).map(i => ({
                    product_id: i.product_id || i.id,
                    descricao: i.name || i.nome,
                    quantidade: parseFloat(i.quantity || i.quantidade || 1),
                    preco_unitario: parseFloat(i.preco_unitario || i.price || 0),
                    total: parseFloat(i.total || (i.price * i.quantidade) || 0)
                }))
            };

            await createSubscription(payload);
            setShowForm(false);
            setNewSub({ customer_id: '', plan_id: '', professional_id: '', duration_months: 12 });
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erro ao criar assinatura: " + (e.response?.data?.detail || e.message || "Erro desconhecido"));
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateSubscriptionStatus(id, status);
            setManageSub(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar status.");
        }
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
                <button className="btn-primary" onClick={() => setShowForm(true)}>
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
                                <th>Profissional</th>
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
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={14} color="var(--primary)" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.professional_name || 'Não definido'}</span>
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
                                            <button className="btn-action-luxury" title="Ver Contrato PDF" onClick={() => handleDownloadContract(s.id)}>
                                                <FileText size={16} />
                                            </button>
                                            <button className="btn-action-luxury" title="Configurações" onClick={() => setManageSub(s)}><Settings size={16} /></button>
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
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.nome || p.name} - R$ {p.valor_base || p.price}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Profissional Responsável</label>
                                <select className="input-premium" value={newSub.professional_id} onChange={e => setNewSub({ ...newSub, professional_id: e.target.value })}>
                                    <option value="">Nenhum (Venda Direta)</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Duração da Assinatura</label>
                                <select className="input-premium" value={newSub.duration_months || 12} onChange={e => setNewSub({ ...newSub, duration_months: parseInt(e.target.value) })} required>
                                    <option value="1">1 mês</option>
                                    <option value="3">3 meses (Trimestral)</option>
                                    <option value="6">6 meses (Semestral)</option>
                                    <option value="12">12 meses (Anual)</option>
                                    <option value="24">24 meses (2 Anos)</option>
                                </select>
                                <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                                    O sistema criará automaticamente as parcelas futuras
                                </small>
                            </div>

                            <div style={{ background: 'var(--gold-50)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gold-400)', display: 'flex', gap: '0.75rem' }}>
                                <AlertCircle size={20} color="var(--gold-600)" style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.75rem', color: 'var(--gold-600)', fontWeight: 600 }}>Ao ativar, o sistema gerará automaticamente o contrato PDF e o primeiro lançamento financeiro recorrente.</p>
                            </div>

                            <footer style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>Efetivar Assinatura</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {manageSub && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '400px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Gerenciar Assinatura</h2>
                            <button onClick={() => setManageSub(null)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)' }}>{manageSub.plan_name}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>{manageSub.customer_name}</p>
                            </div>

                            <h4 className="form-section-title">Alterar Status</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button className="btn-secondary" onClick={() => handleUpdateStatus(manageSub.id, 'active')} style={manageSub.status === 'active' ? { borderColor: 'var(--success)', color: 'var(--success)', background: '#f0fdf4' } : {}}>
                                    <CheckCircle2 size={16} /> Ativa
                                </button>
                                <button className="btn-secondary" onClick={() => handleUpdateStatus(manageSub.id, 'past_due')} style={manageSub.status === 'past_due' ? { borderColor: 'var(--error)', color: 'var(--error)', background: '#fef2f2' } : {}}>
                                    <AlertCircle size={16} /> Atrasada
                                </button>
                                <button className="btn-secondary" onClick={() => handleUpdateStatus(manageSub.id, 'canceled')} style={{ gridColumn: 'span 2', borderColor: manageSub.status === 'canceled' ? 'var(--text-muted)' : '', opacity: manageSub.status === 'canceled' ? 0.7 : 1 }}>
                                    <XCircle size={16} /> Cancelar Assinatura
                                </button>
                            </div>
                        </div>

                        <h4 className="form-section-title" style={{ marginTop: '1.5rem' }}>Contrato Assinado</h4>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center', padding: '0.5rem', border: '1px dashed var(--primary)', borderRadius: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                                <Upload size={16} /> Fazer Upload do PDF
                                <input type="file" hidden accept=".pdf" onChange={(e) => {
                                    if (e.target.files[0]) handleUploadContract(manageSub.id, e.target.files[0]);
                                }} />
                            </label>
                            {manageSub.contrato_assinado_url && (
                                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)', textAlign: 'center', fontWeight: 600 }}>
                                    ✓ Contrato assinado em arquivo
                                </p>
                            )}
                        </div>

                        <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setManageSub(null)}>Fechar</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
