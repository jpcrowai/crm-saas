import React, { useEffect, useState } from 'react';
import { getFinanceEntries, deleteFinanceEntry, updateFinanceEntryStatus, exportFinanceEntries } from '../services/api';
import { Search, Filter, Download, Plus, ArrowUpCircle, ArrowDownCircle, MoreVertical, Trash2, CheckCircle2, AlertCircle, Clock, XCircle, DollarSign, Wallet, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import FinanceWizard from '../components/FinanceWizard';
import KpiCarousel from '../components/KpiCarousel';
import '../styles/tenant-luxury.css';
import '../components/KpiCarousel.css';

const FinanceExtrato = () => {
    const [entries, setEntries] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [showWizard, setShowWizard] = useState(false);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        search: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await getFinanceEntries();
            setEntries(res.data);
            setFiltered(res.data);
        } catch (e) { console.error(e); }
    };

    const handleExport = async () => {
        try {
            const res = await exportFinanceEntries();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Erro ao exportar");
        }
    };

    useEffect(() => {
        let result = entries;
        if (filters.type !== 'all') result = result.filter(e => e.tipo === filters.type);
        if (filters.status !== 'all') result = result.filter(e => e.status === filters.status);
        if (filters.search) {
            result = result.filter(e => e.descricao?.toLowerCase().includes(filters.search.toLowerCase()) || e.origem?.toLowerCase().includes(filters.search.toLowerCase()));
        }
        if (filters.startDate) result = result.filter(e => e.data_vencimento >= filters.startDate);
        if (filters.endDate) result = result.filter(e => e.data_vencimento <= filters.endDate);
        setFiltered(result);
    }, [filters, entries]);

    const stats = {
        balance: filtered.reduce((acc, current) => acc + (current.tipo === 'receita' ? current.valor : -current.valor), 0),
        income: filtered.filter(e => e.tipo === 'receita').reduce((acc, e) => acc + e.valor, 0),
        expense: filtered.filter(e => e.tipo === 'despesa').reduce((acc, e) => acc + e.valor, 0)
    };

    const getStatusBadge = (status) => {
        const s = {
            pago: { bg: '#dcfce7', color: '#166534', label: '🟢 Pago' },
            pendente: { bg: '#fef3c7', color: '#92400e', label: '🟡 Pendente' },
            atrasado: { bg: '#fee2e2', color: '#991b1b', label: '🔴 Atrasado' }
        }[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
        return <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.35rem 0.65rem', borderRadius: '6px', background: s.bg, color: s.color }}>{s.label}</span>;
    };

    const kpis = [
        <div className="indicator-card-luxury" key="entradas" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><ArrowUpCircle size={28} /></div>
            <div className="indicator-data">
                <label>Entradas</label>
                <p>R$ {stats.income.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" key="saidas" style={{ borderTopColor: 'var(--error)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fef2f2', color: 'var(--error)' }}><ArrowDownCircle size={28} /></div>
            <div className="indicator-data">
                <label>Saídas</label>
                <p>R$ {stats.expense.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" key="saldo" style={{ borderTopColor: 'var(--navy-900)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-900)', color: 'white' }}><Wallet size={28} /></div>
            <div className="indicator-data">
                <label>Saldo Líquido</label>
                <p style={{ color: stats.balance >= 0 ? 'var(--navy-950)' : 'var(--error)' }}>
                    R$ {stats.balance.toLocaleString('pt-BR')}
                </p>
            </div>
        </div>
    ];

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Extrato Financeiro</h1>
                    <p>Gestão de fluxo de caixa e conciliação bancária</p>
                </div>
                <div className="page-header-actions">
                    <Link to="/finances/settings">
                        <button className="btn-secondary" style={{ width: '100%', height: '100%', minHeight: '42px' }}>
                            <Settings size={20} />
                        </button>
                    </Link>
                    <button className="btn-primary" onClick={handleExport}>
                        <Download size={18} /> Exportar
                    </button>
                    <button className="btn-primary" onClick={() => setShowWizard(true)}>
                        <Plus size={20} /> Novo
                    </button>
                </div>
            </header>

            <KpiCarousel items={kpis} />

            <div className="data-card-luxury">
                <div className="luxury-filter-bar" style={{ background: '#f8fafc' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-500)' }} />
                        <input className="input-premium filter-input" value={filters.search} placeholder="O que você procura?..." style={{ paddingLeft: '3rem', width: '100%' }} onChange={e => setFilters({ ...filters, search: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="input-premium filter-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                            <input
                                type="date"
                                style={{ border: 'none', padding: 0, width: 'auto', fontSize: '0.85rem', outline: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>até</span>
                            <input
                                type="date"
                                style={{ border: 'none', padding: 0, width: 'auto', fontSize: '0.85rem', outline: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit' }}
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                        <select className="input-premium filter-input" value={filters.type} style={{ width: 'auto' }} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                            <option value="all">Tipos: Todos</option>
                            <option value="receita">Apenas Receitas</option>
                            <option value="despesa">Apenas Despesas</option>
                        </select>
                        <select className="input-premium filter-input" value={filters.status} style={{ width: 'auto' }} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                            <option value="all">Status: Todos</option>
                            <option value="pago">Conciliado (Pago)</option>
                            <option value="pendente">Aguardando</option>
                            <option value="atrasado">Em Atraso</option>
                        </select>
                        {(filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate) && (
                            <button
                                onClick={() => setFilters({ type: 'all', status: 'all', search: '', startDate: '', endDate: '' })}
                                className="btn-secondary"
                                style={{ padding: '0.5rem', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Limpar Filtros"
                            >
                                <XCircle size={18} color="var(--error)" />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table-luxury">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th>Vencimento</th>
                                <th>Descrição / Origem</th>
                                <th>Categoria</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(entry => (
                                <tr key={entry.id}>
                                    <td>
                                        {entry.tipo === 'receita' ? <ArrowUpCircle size={18} color="var(--success)" /> : <ArrowDownCircle size={18} color="var(--error)" />}
                                    </td>
                                    <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-700)' }}>
                                        {new Date(entry.data_vencimento).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.9rem' }}>{entry.descricao}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>via {entry.origem}</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>{entry.categoria_nome || 'Livre'}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: entry.tipo === 'receita' ? 'var(--navy-900)' : 'var(--error)' }}>
                                        {entry.tipo === 'despesa' ? '-' : ''} R$ {entry.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>{getStatusBadge(entry.status)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {(entry.status === 'pendente' || entry.status === 'atrasado') && (
                                                <button className="btn-action-luxury" title="Marcar como Pago" onClick={() => updateFinanceEntryStatus(entry.id, 'pago').then(loadData)}><CheckCircle2 size={16} color="var(--success)" /></button>
                                            )}
                                            <button className="btn-action-luxury" style={{ color: 'var(--error)' }} onClick={() => deleteFinanceEntry(entry.id).then(loadData)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <DollarSign size={64} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                            <p style={{ fontWeight: 600 }}>Nenhum lançamento financeiro para os filtros atuais.</p>
                        </div>
                    )}
                </div>
            </div>

            {showWizard && (
                <FinanceWizard
                    onClose={() => setShowWizard(false)}
                    onSuccess={() => { setShowWizard(false); loadData(); }}
                />
            )}
        </div>
    );
};

export default FinanceExtrato;
