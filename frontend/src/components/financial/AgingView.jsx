import React, { useEffect, useState } from 'react';
import { getFinancialAgingReport } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AlertTriangle, Clock } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const AgingView = () => {
    const [data, setData] = useState({ "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 });

    useEffect(() => {
        getFinancialAgingReport().then(res => setData(res.data)).catch(console.error);
    }, []);

    const chartData = [
        { name: '0-30 dias', value: data["0-30"], fill: '#fbbf24' },
        { name: '31-60 dias', value: data["31-60"], fill: '#f59e0b' },
        { name: '61-90 dias', value: data["61-90"], fill: '#ea580c' },
        { name: '+90 dias', value: data["90+"], fill: '#dc2626' }
    ];

    const totalOverdue = Object.values(data).reduce((a, b) => a + b, 0);

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fef2f2', color: 'var(--error)' }}><AlertTriangle size={28} /></div>
            <div className="indicator-data">
                <label>Total Em Atraso</label>
                <p>R$ {totalOverdue.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--warning)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fffbeb', color: 'var(--warning)' }}><Clock size={28} /></div>
            <div className="indicator-data">
                <label>Risco Médio</label>
                <p>---</p>
            </div>
        </div>
    ];

    return (
        <div className="tab-fade-in">
            <SmartKpiContainer kpiItems={kpis} />

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Aging List (Inadimplência por Faixa de Atraso)</h3>
                </div>
                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '0.8rem' }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Valor em Atraso">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AgingView;
