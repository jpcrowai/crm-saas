import React, { useEffect, useState } from 'react';
import { getFinancialSupplierReport } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Truck, CreditCard, DollarSign } from 'lucide-react';
import SmartKpiContainer from '../SmartKpiContainer';

const SupplierView = ({ dateRange }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        getFinancialSupplierReport(dateRange).then(res => setData(res.data)).catch(console.error);
    }, [dateRange]);

    const totalPaid = data.reduce((acc, curr) => acc + curr.total_paid, 0);
    const totalOpen = data.reduce((acc, curr) => acc + curr.total_open, 0);

    const kpis = [
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--primary)' }}><DollarSign size={28} /></div>
            <div className="indicator-data">
                <label>Total Pago</label>
                <p>R$ {totalPaid.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: '#f59e0b' }}>
            <div className="indicator-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><CreditCard size={28} /></div>
            <div className="indicator-data">
                <label>A Pagar</label>
                <p>R$ {totalOpen.toLocaleString('pt-BR')}</p>
            </div>
        </div>
    ];

    return (
        <div className="tab-fade-in">
            <SmartKpiContainer kpiItems={kpis} />

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Concentração de Compras (Top Fornecedores)</h3>
                </div>
                <div style={{ padding: '2rem', height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart data={data.slice(0, 10)} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="supplier_name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="total_paid" fill="var(--primary)" radius={[0, 4, 4, 0]} name="Pago" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SupplierView;
