import React, { useEffect, useState } from 'react';
import { getReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Award, Target, FileBarChart, Calendar, ChevronRight } from 'lucide-react';
import '../styles/tenant-luxury.css';

const COLORS = ['#d4af37', '#0f172a', '#1e293b', '#b8860b', '#334155'];

const Reports = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        getReports().then(res => setData(res.data)).catch(console.error);
    }, []);

    if (!data) return <div className="tenant-page-container" style={{ color: 'white' }}>Gerando inteligência de dados...</div>;

    const cashFlowData = [
        { name: 'Receita', value: data.total_revenue, fill: 'var(--success)' },
        { name: 'Despesas', value: data.total_expenses, fill: 'var(--error)' }
    ];

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Relatórios & Insights</h1>
                    <p>Análise de performance e saúde financeira do negócio</p>
                </div>
                <button className="btn-primary">
                    <Calendar size={18} /> Filtrar Período
                </button>
            </header>

            <div className="indicator-grid">
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}><Target size={28} /></div>
                    <div className="indicator-data">
                        <label>ROI Médio / Lead</label>
                        <p>R$ {(data.total_revenue / (data.total_leads || 1)).toFixed(2)}</p>
                    </div>
                </div>
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><TrendingUp size={28} /></div>
                    <div className="indicator-data">
                        <label>Receita Líquida</label>
                        <p>R$ {(data.total_revenue - data.total_expenses).toLocaleString('pt-BR')}</p>
                    </div>
                </div>
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-900)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-950)', color: 'white' }}><Users size={28} /></div>
                    <div className="indicator-data">
                        <label>Clientes Ativos</label>
                        <p>{data.customer_ranking?.length || 0}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {/* CASH FLOW CHART */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Distribuição de Fluxo de Caixa</h3>
                    </div>
                    <div style={{ padding: '2rem', height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={cashFlowData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                    {cashFlowData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* VIP CUSTOMERS LIST */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Ranking VIP (Maiores Receitas)</h3>
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.customer_ranking?.map((c, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: idx === 0 ? 'var(--gold-50)' : '#f8fafc', borderRadius: '12px', border: idx === 0 ? '1px solid var(--gold-400)' : '1px solid transparent' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx === 0 ? 'var(--grad-gold)' : 'var(--navy-900)', color: idx === 0 ? 'var(--navy-950)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>{c.customer_name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faturamento acumulado</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-950)' }}>R$ {c.total_revenue.toLocaleString('pt-BR')}</p>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>VER DETALHES <ChevronRight size={10} style={{ display: 'inline' }} /></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
