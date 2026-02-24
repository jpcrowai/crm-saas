import React, { useState, useEffect } from 'react';
import { getCommissionDashboard, getProfessionals } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    Percent,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    Award,
    Clock
} from 'lucide-react';
import '../styles/tenant-luxury.css';
import '../styles/finances.css'; // Reuse some layout styles

const Commissions = () => {
    const [summary, setSummary] = useState({
        total_services: 0,
        total_revenue: 0,
        total_commission: 0,
        avg_commission: 0
    });
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getCommissionDashboard(period);
            setSummary(response.data.summary);
            setRanking(response.data.ranking);
        } catch (error) {
            console.error('Erro ao carregar comissões:', error);
            toast.error('Erro ao carregar dashboard de comissões');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Gestão de Comissões</h1>
                    <p>Métricas de performance e repasses para sua equipe</p>
                </div>
                <div className="header-actions">
                    <div className="input-with-icon" style={{ width: '200px' }}>
                        <Calendar size={18} />
                        <input
                            type="month"
                            className="input-premium"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="loading-state">Carregando métricas...</div>
            ) : (
                <>
                    {/* SUMMARY CARDS */}
                    <div className="finances-summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
                        <div className="finance-card revenue-card">
                            <div className="card-icon"><TrendingUp size={24} /></div>
                            <div className="card-info">
                                <label>Faturamento Total</label>
                                <h3>{formatCurrency(summary.total_revenue)}</h3>
                            </div>
                        </div>
                        <div className="finance-card expense-card">
                            <div className="card-icon"><Percent size={24} /></div>
                            <div className="card-info">
                                <label>Comissões Totais</label>
                                <h3>{formatCurrency(summary.total_commission)}</h3>
                            </div>
                        </div>
                        <div className="finance-card balance-card">
                            <div className="card-icon"><Users size={24} /></div>
                            <div className="card-info">
                                <label>Serviços Realizados</label>
                                <h3>{summary.total_services}</h3>
                            </div>
                        </div>
                        <div className="finance-card" style={{ borderColor: 'var(--gold-400)' }}>
                            <div className="card-icon" style={{ color: 'var(--gold-500)' }}><Award size={24} /></div>
                            <div className="card-info">
                                <label>Média por Repasse</label>
                                <h3>{formatCurrency(summary.avg_commission)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-content-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                        {/* RANKING TABLE */}
                        <div className="content-card">
                            <div className="card-header-simple">
                                <h3>Ranking de Performance</h3>
                                <Award size={20} color="var(--gold-500)" />
                            </div>
                            <div className="table-container">
                                <table className="leads-table">
                                    <thead>
                                        <tr>
                                            <th>Profissional</th>
                                            <th>Serviços</th>
                                            <th>Total Comissão</th>
                                            <th>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((row, idx) => (
                                            <tr key={row.professional_id}>
                                                <td>
                                                    <div className="flex-center" style={{ gap: '0.5rem' }}>
                                                        <span className="rank-badge">{idx + 1}º</span>
                                                        <strong>{row.professional_name}</strong>
                                                    </div>
                                                </td>
                                                <td>{row.services_count}</td>
                                                <td className="amount-positive">{formatCurrency(row.total_commission)}</td>
                                                <td>
                                                    <button className="btn-icon-simple">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {ranking.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                                    Nenhum dado de comissão para este período.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* INFO CARD */}
                        <div className="content-card" style={{ background: 'linear-gradient(135deg, rgba(14, 25, 45, 0.9), rgba(1, 11, 28, 0.9))' }}>
                            <div className="card-header-simple">
                                <h3>Informações Importantes</h3>
                            </div>
                            <div className="info-box-luxury">
                                <div className="info-item">
                                    <Clock size={18} />
                                    <p>As comissões são calculadas automaticamente ao <strong>finalizar</strong> um agendamento.</p>
                                </div>
                                <div className="info-item">
                                    <Filter size={18} />
                                    <p>Os valores mostrados refletem o percentual configurado no cadastro de cada profissional.</p>
                                </div>
                                <div className="info-item">
                                    <DollarSign size={18} />
                                    <p>Você pode acompanhar o Ticket Médio de cada profissional clicando no ícone de detalhes.</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                <button className="btn-primary w-full" onClick={() => window.location.href = '/professionals'}>
                                    Gerenciar Equipe
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .rank-badge {
                    background: var(--gold-500);
                    color: #000;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                }
                .info-box-luxury {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .info-item {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-start;
                    color: rgba(255,255,255,0.7);
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                .info-item svg {
                    color: var(--gold-500);
                    flex-shrink: 0;
                }
                .w-full { width: 100%; }
            `}} />
        </div>
    );
};

export default Commissions;
