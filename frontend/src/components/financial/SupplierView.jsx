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
            <div className="indicator-icon-wrapper" style={{ background: 'var(--navy-900)', color: 'white' }}><DollarSign size={28} /></div>
            <div className="indicator-data">
                <label>Total Pago</label>
                <p>R$ {totalPaid.toLocaleString('pt-BR')}</p>
            </div>
        </div>,
        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--warning)' }}>
            <div className="indicator-icon-wrapper" style={{ background: '#fffbeb', color: 'var(--warning)' }}><CreditCard size={28} /></div>
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
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer>
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
