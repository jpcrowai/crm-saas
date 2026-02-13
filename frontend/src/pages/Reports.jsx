import React, { useState } from 'react';
import { Calendar, XCircle, Activity } from 'lucide-react';
import TabbedDashboard from '../components/TabbedDashboard';
import CustomerView from '../components/financial/CustomerView';
import SupplierView from '../components/financial/SupplierView';
import CashFlowView from '../components/financial/CashFlowView';
import PnLView from '../components/financial/PnLView';
import AgingView from '../components/financial/AgingView';
import '../styles/tenant-luxury.css';
import '../components/TabbedDashboard.css';

const COLORS = ['#d4af37', '#0f172a', '#1e293b', '#b8860b', '#334155'];

const Reports = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const reportTabs = [
        {
            label: 'Fluxo de Caixa',
            content: <CashFlowView dateRange={dateRange} />
        },
        {
            label: 'Resultados (DRE)',
            content: <PnLView dateRange={dateRange} />
        },
        {
            label: 'Clientes',
            content: <CustomerView dateRange={dateRange} />
        },
        {
            label: 'Fornecedores',
            content: <SupplierView dateRange={dateRange} />
        },
        {
            label: 'Inadimplência',
            content: <AgingView />
        }
    ];

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Relatórios Financeiros</h1>
                    <p>Visão estratégica e detalhada da saúde financeira</p>
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
