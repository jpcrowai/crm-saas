import React, { useEffect, useState } from 'react';
import { getFinancialCustomerReport } from '../../services/api';
import { Users, AlertCircle, DollarSign, Target } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const CustomerView = ({ dateRange }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getFinancialCustomerReport(dateRange).then(res => setData(res.data)).catch(console.error);
    }, [dateRange]);

    const fmt = (v) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><DollarSign size={28} /></div>
            <div className="indicator-data">
                <label>Total Faturado</label>
                <p>{fmt(data.reduce((acc, curr) => acc + curr.total_paid, 0))}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: '#f59e0b' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Target size={28} /></div>
            <div className="indicator-data">
                <label>Em Aberto</label>
                <p>{fmt(data.reduce((acc, curr) => acc + curr.total_open, 0))}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: '#ef4444' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><AlertCircle size={28} /></div>
            <div className="indicator-data">
                <label>Vencido</label>
                <p>{fmt(data.reduce((acc, curr) => acc + curr.total_overdue, 0))}</p>
            </div>
        </div>
    ];

    return (
        <div className="tab-fade-in">
            <SmartKpiContainer kpiItems={kpis} />

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Ranking de Clientes (Faturamento)</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table-luxury">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th style={{ textAlign: 'right' }}>Pago</th>
                                <th style={{ textAlign: 'right' }}>Aberto</th>
                                <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                        Nenhum dado encontrado para o período selecionado.
                                    </td>
                                </tr>
                            )}
                            {data.map((client, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{client.customer_name}</td>
                                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{fmt(client.total_paid)}</td>
                                    <td style={{ textAlign: 'right', color: client.total_overdue > 0 ? '#ef4444' : 'inherit' }}>
                                        {fmt(client.total_open + client.total_overdue)}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(client.avg_ticket)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerView;
