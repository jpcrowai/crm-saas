import React, { useEffect, useState } from 'react';
import { getFinancialPnLReport } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { FileBarChart, ArrowRight } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const PnLView = ({ dateRange }) => {
    const [data, setData] = useState({ revenue: 0, expenses: 0, net_profit: 0, expense_breakdown: [] });

    useEffect(() => {
        getFinancialPnLReport(dateRange).then(res => setData(res.data)).catch(console.error);
    }, [dateRange]);

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><FileBarChart size={28} /></div>
            <div className="indicator-data">
                <label>Receita Bruta</label>
                <p>R$ {data.revenue.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}><ArrowRight size={28} /></div>
            <div className="indicator-data">
                <label>Despesas Operacionais</label>
                <p>R$ {data.expenses.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)' }}><FileBarChart size={28} /></div>
            <div className="indicator-data">
                <label>Lucro Líquido</label>
                <p style={{ color: data.net_profit >= 0 ? 'var(--success)' : 'var(--error)' }}>R$ {data.net_profit.toLocaleString('pt-BR')}</p>
            </div>
        </div>
    ];

    return (
        <div className="tab-fade-in">
            <SmartKpiContainer kpiItems={kpis} />

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Detalhamento de Despesas</h3>
                </div>
                <div style={{ padding: '2rem', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart data={data.expense_breakdown} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="amount" fill="#f87171" radius={[0, 4, 4, 0]} barSize={20} name="Valor" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PnLView;
