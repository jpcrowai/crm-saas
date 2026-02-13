import React, { useEffect, useState } from 'react';
import { getFinancialCustomerReport } from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertCircle, DollarSign, Target } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const CustomerView = ({ dateRange }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getFinancialCustomerReport(dateRange).then(res => setData(res.data)).catch(console.error);
    }, [dateRange]);

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success)' }}><DollarSign size={28} /></div>
            <div className="indicator-data">
                <label>Total Faturado</label>
                <p>R$ {data.reduce((acc, curr) => acc + curr.total_paid, 0).toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--warning)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fffbeb', color: 'var(--warning)' }}><Target size={28} /></div>
            <div className="indicator-data">
                <label>Em Aberto</label>
                <p>R$ {data.reduce((acc, curr) => acc + curr.total_open, 0).toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--error)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fef2f2', color: 'var(--error)' }}><AlertCircle size={28} /></div>
            <div className="indicator-data">
                <label>Vencido</label>
                <p>R$ {data.reduce((acc, curr) => acc + curr.total_overdue, 0).toLocaleString('pt-BR')}</p>
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
                            {data.map((client, idx) => (
                                <tr key={idx}>
                                    <td style={{ fontWeight: 600 }}>{client.customer_name}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>R$ {client.total_paid.toLocaleString('pt-BR')}</td>
                                    <td style={{ textAlign: 'right', color: client.total_overdue > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                                        R$ {(client.total_open + client.total_overdue).toLocaleString('pt-BR')}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>R$ {client.avg_ticket.toLocaleString('pt-BR')}</td>
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
