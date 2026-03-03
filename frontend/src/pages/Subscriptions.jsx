import React, { useEffect, useState } from 'react';
import { getSubscriptions, getPlans, getCustomers, createSubscription, updateSubscription, updateSubscriptionStatus, uploadSubscriptionContract, API_URL, getProfessionals } from '../services/api';
import { Plus, Search, CreditCard, User, Package, Calendar, MoreVertical, XCircle, CheckCircle2, AlertCircle, FileText, Settings, Upload } from 'lucide-react';
import ViewToggle from '../components/ViewToggle';
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
    const [editData, setEditData] = useState({ plano_id: '', professional_id: '', valor_total: 0, status: '', data_fim: '' });
    const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode_Subscriptions') || 'grid');

    useEffect(() => {
        localStorage.setItem('viewMode_Subscriptions', viewMode);
    }, [viewMode]);

    useEffect(() => { loadData(); }, []);

    const handleManage = (sub) => {
        setManageSub(sub);
        setEditData({
            plano_id: sub.plano_id,
            professional_id: sub.professional_id || '',
            valor_total: sub.price || 0,
            status: sub.status,
            data_fim: sub.next_billing ? sub.next_billing.split('T')[0] : ''
        });
    };

    const loadData = async () => {
        try {
            const [sRes, pRes, cRes, proRes] = await Promise.all([getSubscriptions(), getPlans(), getCustomers(), getProfessionals()]);
            const sData = Array.isArray(sRes.data) ? sRes.data : [];
            const pData = Array.isArray(pRes.data) ? pRes.data : [];
            const cData = Array.isArray(cRes.data) ? cRes.data : [];
            const proData = Array.isArray(proRes.data) ? proRes.data : [];

            const mappedSubs = sData.map(s => {
                const customer = cData.find(c => c.id === s.customer_id);
                const plan = pData.find(p => p.id === s.plano_id);
                return {
                    ...s,
                    customer_name: customer?.name || customer?.nome || 'Cliente Desconhecido',
                    plan_name: plan?.nome || plan?.name || 'Plano Descontinuado',
                    price: s.valor_total || plan?.valor_base || plan?.price || 0,
                    contract_url: s.contrato_pdf || s.contract_url || s.contrato_url || null
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

    const handleDownloadContract = async (sub) => {
        try {
            if (sub.contract_url && sub.contract_url.startsWith('http')) {
                window.open(sub.contract_url, '_blank');
                return;
            }
            const token = localStorage.getItem('token');
            const downloadUrl = `${API_URL}/tenant/subscriptions/${sub.id}/contract?token=${token}`;
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error("Erro ao baixar contrato:", error);
            alert("Erro ao acessar contrato.");
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

    const handleUpdateSubscription = async () => {
        try {
            await updateSubscription(manageSub.id, editData);
            setManageSub(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar assinatura.");
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

    const handleUploadContract = async (id, file) => {
        try {
            await uploadSubscriptionContract(id, file);
            alert("Contrato enviado com sucesso!");
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erro ao enviar contrato.");
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Ativa': { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', icon: <CheckCircle2 size={12} /> },
            'active': { bg: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', icon: <CheckCircle2 size={12} /> },
            'Atrasada': { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', icon: <AlertCircle size={12} /> },
            'past_due': { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171', icon: <AlertCircle size={12} /> },
            'Cancelada': { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)', icon: <XCircle size={12} /> },
            'canceled': { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)', icon: <XCircle size={12} /> },
            'Pendente Assinatura': { bg: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-400)', icon: <FileText size={12} /> }
        };
        const s = styles[status] || { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)', icon: <AlertCircle size={12} /> };
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                padding: '0.35rem 0.65rem', borderRadius: '6px', background: s.bg, color: s.color,
                border: `1px solid ${s.color}20`
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
                <div className="luxury-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {viewMode === 'list' ? (
                        <table className="table-luxury table-compact">
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
                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="indicator-icon-wrapper" style={{
                                                    width: 38,
                                                    height: 38,
                                                    background: 'rgba(212, 175, 55, 0.1)',
                                                    color: 'var(--gold-500)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    border: '1px solid rgba(212, 175, 55, 0.2)',
                                                    borderRadius: '10px'
                                                }}>
                                                    {s.customer_name?.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'white' }}>{s.customer_name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{ padding: '4px', borderRadius: '4px', background: 'rgba(212, 175, 55, 0.1)' }}>
                                                    <Package size={14} color="var(--gold-400)" />
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{s.plan_name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{ padding: '4px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)' }}>
                                                    <User size={14} color="#60a5fa" />
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{s.professional_name || 'Não definido'}</span>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(s.status)}</td>
                                        <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                                            {s.next_billing ? new Date(s.next_billing).toLocaleDateString('pt-BR') : '---'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--gold-500)', fontSize: '1.1rem' }}>
                                            R$ {(s.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-icon"
                                                    title="Ver Contrato PDF"
                                                    onClick={() => handleDownloadContract(s)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}
                                                >
                                                    <FileText size={16} color="var(--gold-500)" />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    title="Configurações"
                                                    onClick={() => handleManage(s)}
                                                    style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px' }}
                                                >
                                                    <Settings size={16} color="var(--gold-500)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="data-grid-cards">
                            {filtered.map(s => (
                                <div key={s.id} className="data-card-item" style={{ padding: '2rem', position: 'relative' }}>
                                    <div className="card-actions-dropdown" style={{
                                        position: 'absolute',
                                        top: '1.25rem',
                                        right: '1.25rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        zIndex: 10
                                    }}>
                                        <button
                                            className="btn-icon"
                                            title="Ver Contrato PDF"
                                            onClick={() => handleDownloadContract(s)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            <FileText size={16} color="var(--gold-500)" />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            title="Configurações"
                                            onClick={() => handleManage(s)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                        >
                                            <Settings size={16} color="var(--gold-500)" />
                                        </button>
                                    </div>
                                    <div className="data-card-header-flex">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div className="indicator-icon-wrapper" style={{
                                                width: 54,
                                                height: 54,
                                                background: 'rgba(212, 175, 55, 0.1)',
                                                color: 'var(--gold-500)',
                                                fontSize: '1.3rem',
                                                fontWeight: 800,
                                                border: '1px solid rgba(212, 175, 55, 0.2)',
                                                borderRadius: '14px'
                                            }}>
                                                {s.customer_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="data-card-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.customer_name}</h3>
                                                <div>
                                                    {getStatusBadge(s.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="label" style={{ opacity: 0.5, fontSize: '0.75rem' }}>Plano Contratado</span>
                                            <span style={{ fontWeight: 700, color: 'white' }}>{s.plan_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="label" style={{ opacity: 0.5, fontSize: '0.75rem' }}>Profissional</span>
                                            <span style={{ fontWeight: 700, color: '#60a5fa' }}>{s.professional_name || 'Venda Direta'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="label" style={{ opacity: 0.5, fontSize: '0.75rem' }}>Próximo Faturamento</span>
                                            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                                                {s.next_billing ? new Date(s.next_billing).toLocaleDateString('pt-BR') : '---'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="data-card-footer" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span className="label" style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', color: 'var(--gold-500)' }}>Valor da Recorrência</span>
                                        <strong style={{ fontSize: '1.5rem', color: 'var(--gold-500)', fontWeight: 900 }}>
                                            R$ {(s.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    <div className="card" style={{ width: '480px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Editar Assinatura</h2>
                            <button onClick={() => setManageSub(null)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>{manageSub.customer_name}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Mantenha os dados da assinatura sempre atualizados</p>
                            </div>

                            <div className="form-grid-luxury" style={{ gap: '1rem' }}>
                                <div className="form-group-luxury">
                                    <label>Plano Associado</label>
                                    <select
                                        value={editData.plano_id}
                                        onChange={(e) => setEditData({ ...editData, plano_id: e.target.value })}
                                    >
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>

                                <div className="form-group-luxury">
                                    <label>Profissional Responsável</label>
                                    <select
                                        value={editData.professional_id}
                                        onChange={(e) => setEditData({ ...editData, professional_id: e.target.value })}
                                    >
                                        <option value="">Nenhum</option>
                                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group-luxury">
                                    <label>Valor da Mensalidade (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.valor_total}
                                        onChange={(e) => setEditData({ ...editData, valor_total: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="form-group-luxury">
                                    <label>Próxima Cobrança</label>
                                    <input
                                        type="date"
                                        value={editData.data_fim}
                                        onChange={(e) => setEditData({ ...editData, data_fim: e.target.value })}
                                    />
                                </div>

                                <div className="form-group-luxury" style={{ gridColumn: 'span 2' }}>
                                    <label>Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    >
                                        <option value="active">Ativa</option>
                                        <option value="past_due">Atrasada</option>
                                        <option value="canceled">Cancelada</option>
                                        <option value="Pendente Assinatura">Pendente Assinatura</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setManageSub(null)}>Cancelar</button>
                                <button className="btn-primary" style={{ flex: 1.5 }} onClick={handleUpdateSubscription}>Salvar Alterações</button>
                            </div>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                <h4 className="form-section-title" style={{ marginBottom: '1rem' }}>Documentação</h4>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center', padding: '0.5rem', border: '1px dashed var(--gold-500)', borderRadius: '8px', color: 'var(--gold-500)', fontWeight: 600 }}>
                                        <Upload size={16} /> Fazer Upload do Contrato Assinado
                                        <input type="file" hidden accept=".pdf" onChange={(e) => {
                                            if (e.target.files[0]) handleUploadContract(manageSub.id, e.target.files[0]);
                                        }} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
