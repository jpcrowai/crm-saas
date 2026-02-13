import React, { useEffect, useState } from 'react';
import { getFinancialCashFlowReport } from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const CashFlowView = ({ dateRange }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getFinancialCashFlowReport(dateRange).then(res => setData(res.data)).catch(console.error);
    }, [dateRange]);

    const totalIncome = data.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
    const net = totalIncome - totalExpense;

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><ArrowUpCircle size={28} /></div>
            <div className="indicator-data">
                <label>Entradas</label>
                <p>R$ {totalIncome.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fef2f2', color: 'var(--error)' }}><ArrowDownCircle size={28} /></div>
            <div className="indicator-data">
                <label>Saídas</label>
                <p>R$ {totalExpense.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-900)', color: 'white' }}><TrendingUp size={28} /></div>
            <div className="indicator-data">
                <label>Saldo Líquido</label>
                <p style={{ color: net >= 0 ? 'var(--navy-950)' : 'var(--error)' }}>R$ {net.toLocaleString('pt-BR')}</p>
            </div>
        </div>
    ];

    return (
        <div className="tab-fade-in">
            <SmartKpiContainer kpiItems={kpis} />

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Evolução Diária</h3>
                </div>
                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tickFormatter={curr => new Date(curr).getDate()} style={{ fontSize: '0.8rem' }} />
                            <YAxis hide />
                            <Tooltip labelFormatter={curr => new Date(curr).toLocaleDateString('pt-BR')} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Area type="monotone" dataKey="income" stackId="1" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} name="Receita" />
                            <Area type="monotone" dataKey="expense" stackId="2" stroke="var(--error)" fill="var(--error)" fillOpacity={0.1} name="Despesa" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default CashFlowView;
