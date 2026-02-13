import React, { useEffect, useState } from 'react';
import { getReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Award, Target, FileBarChart, Calendar, ChevronRight, XCircle, CreditCard, Activity } from 'lucide-react';
import KpiCarousel from '../components/KpiCarousel';
import TabbedDashboard from '../components/TabbedDashboard';
import '../styles/tenant-luxury.css';
import '../components/KpiCarousel.css';
import '../components/TabbedDashboard.css';

const COLORS = ['#d4af37', '#0f172a', '#1e293b', '#b8860b', '#334155'];

const Reports = () => {
    const [data, setData] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadReports();
    }, [dateRange]);

    const loadReports = () => {
        const params = {};
        if (dateRange.start) params.start_date = dateRange.start;
        if (dateRange.end) params.end_date = dateRange.end;
        getReports(params).then(res => setData(res.data)).catch(console.error);
    };

    if (!data) return (
        <div className="tenant-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <div className="loading-container">
                <Activity className="animate-pulse" size={48} color="var(--gold-400)" />
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Gerando insights estratÃ©gicos...</p>
            </div>
        </div>
    );

    const kpiItems = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><Target size={28} /></div>
            <div className="indicator-data">
                <label>ROI Médio / Lead</label>
                <p>R$ {(data.total_revenue / (data.total_leads || 1)).toFixed(2)}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><TrendingUp size={28} /></div>
            <div className="indicator-data">
                <label>Receita Líquida</label>
                <p>R$ {(data.total_revenue - data.total_expenses).toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-900)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-950)', color: 'white' }}><Users size={28} /></div>
            <div className="indicator-data">
                <label>Clientes Ativos</label>
                <p>{data.customer_ranking?.length || 0}</p>
            </div>
        </div>
    ];

    const cashFlowData = [
        { name: 'Receita', value: data.total_revenue, fill: 'var(--success)' },
        { name: 'Despesas', value: data.total_expenses, fill: 'var(--error)' }
    ];

    const reportTabs = [
        {
            label: 'Visão Geral',
            content: (
                <div className="tab-fade-in">
                    <KpiCarousel items={kpiItems} />
                    <div className="data-card-luxury">
                        <div className="data-card-header">
                            <h3>Distribuição de Fluxo de Caixa</h3>
                        </div>
                        <div style={{ padding: '2rem', height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={cashFlowData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                        {cashFlowData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: 'Ranking VIP',
            content: (
                <div className="tab-fade-in">
                    <div className="data-card-luxury">
                        <div className="data-card-header">
                            <h3>Maiores Receitas por Cliente</h3>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {data.customer_ranking?.map((c, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: idx === 0 ? 'var(--gold-50)' : '#f8fafc', borderRadius: '16px', border: idx === 0 ? '1px solid var(--gold-400)' : '1px solid transparent' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: idx === 0 ? 'var(--grad-gold)' : 'var(--navy-900)', color: idx === 0 ? 'var(--navy-950)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900)' }}>{c.customer_name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Faturamento acumulado</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)' }}>R$ {c.total_revenue.toLocaleString('pt-BR')}</p>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>VER DETALHES <ChevronRight size={12} style={{ display: 'inline' }} /></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Relatórios & Insights</h1>
                    <p>Análise de performance e saúde financeira do negócio</p>
                </div>
                <div className="page-header-actions">
                    <button className={`btn-primary ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                        <Calendar size={18} /> {showFilters ? 'Ocultar Filtros' : 'Filtrar Período'}
                    </button>
                    {(dateRange.start || dateRange.end) && (
                        <button className="btn-secondary" onClick={() => setDateRange({ start: '', end: '' })} title="Limpar Filtros">
                            <XCircle size={18} color="var(--error)" />
                        </button>
                    )}
                </div>
            </header>

            {showFilters && (
                <div className="data-card-luxury tab-fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ color: 'white', opacity: 0.6, fontSize: '0.75rem' }}>DATA INICIAL</label>
                            <input type="date" className="input-premium" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ color: 'white', opacity: 0.6, fontSize: '0.75rem' }}>DATA FINAL</label>
                            <input type="date" className="input-premium" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                        </div>
                    </div>
                </div>
            )}

            <TabbedDashboard tabs={reportTabs} />
        </div>
    );
};

export default Reports;
