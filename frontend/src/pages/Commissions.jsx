import React, { useState, useEffect } from 'react';
import { getCommissionDashboard, getProfessionalStats } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
    Percent,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    ChevronRight,
    Award,
    Clock,
    User,
    ArrowUpRight,
    Activity,
    X,
    FileText,
    CheckCircle2
} from 'lucide-react';
import '../styles/tenant-luxury.css';

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
    const [showModal, setShowModal] = useState(false);
    const [selectedPerf, setSelectedPerf] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [professionalDetails, setProfessionalDetails] = useState(null);
    const toast = useToast();

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getCommissionDashboard(period);
            setSummary(response.data.summary || summary);
            setRanking(response.data.ranking || []);
        } catch (error) {
            console.error('Erro ao carregar comissões:', error);
            // Dont show error toast if it's just empty data
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (prof) => {
        setSelectedPerf(prof);
        setShowModal(true);
        setDetailsLoading(true);
        try {
            const response = await getProfessionalStats(prof.professional_id);
            setProfessionalDetails(response.data);
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            toast.error('Erro ao carregar detalhes do profissional');
        } finally {
            setDetailsLoading(false);
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
                    <h1>Métricas de Comissões</h1>
                    <p>Performance do time e fechamento de repasses</p>
                </div>
                <div className="page-header-actions">
                    <div style={{ position: 'relative', width: '220px' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold-500)', zIndex: 10 }} />
                        <input
                            type="month"
                            className="input-premium"
                            style={{ paddingLeft: '3rem' }}
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ padding: '10rem 0', textAlign: 'center' }}>
                    <div className="skeleton-circle" style={{ margin: '0 auto 1rem' }}></div>
                    <p style={{ fontWeight: 700, opacity: 0.5 }}>Calculando resultados...</p>
                </div>
            ) : (
                <>
                    {/* INDICATOR GRID (Report Style) */}
                    <div className="indicator-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '3rem' }}>
                        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
                            <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div className="indicator-data">
                                <label>Faturamento Bruto</label>
                                <p>{formatCurrency(summary.total_revenue)}</p>
                            </div>
                        </div>

                        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--gold-500)' }}>
                            <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-500)' }}>
                                <Percent size={24} />
                            </div>
                            <div className="indicator-data">
                                <label>Total em Comissões</label>
                                <p>{formatCurrency(summary.total_commission)}</p>
                            </div>
                        </div>

                        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--navy-900)' }}>
                            <div className="indicator-icon-wrapper" style={{ background: 'rgba(30, 41, 59, 0.1)', color: 'var(--navy-900)' }}>
                                <Users size={24} />
                            </div>
                            <div className="indicator-data">
                                <label>Serviços Concluídos</label>
                                <p>{summary.total_services}</p>
                            </div>
                        </div>

                        <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--gold-400)' }}>
                            <div className="indicator-icon-wrapper" style={{ background: 'var(--gold-50)', color: 'var(--gold-600)' }}>
                                <Award size={24} />
                            </div>
                            <div className="indicator-data">
                                <label>Ticket Médio Repasse</label>
                                <p>{formatCurrency(summary.avg_commission)}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={20} color="var(--gold-500)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--white)' }}>Resumo por Profissional</h2>
                    </div>

                    {/* PROFESSIONAL CARDS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                        {ranking.map((row) => (
                            <div
                                key={row.professional_id}
                                className="data-card-luxury list-row-hover"
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'var(--navy-800)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleViewDetails(row)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="indicator-icon-wrapper" style={{ width: 48, height: 48, background: 'var(--grad-gold)', color: 'var(--navy-950)' }}>
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)', margin: 0 }}>{row.professional_name}</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--gold-400)', fontWeight: 600 }}>Especialista</span>
                                        </div>
                                    </div>
                                    <button className="btn-action-luxury" style={{ background: 'rgba(255,255,255,0.05)', border: 'none' }}>
                                        <ArrowUpRight size={18} color="var(--gold-400)" />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Serviços</label>
                                        <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--white)', margin: 0 }}>{row.services_count}</p>
                                    </div>
                                    <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--gold-400)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>A Receber</label>
                                        <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-500)', margin: 0 }}>{formatCurrency(row.total_commission)}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                        <Clock size={14} />
                                        <span>Atualizado agora</span>
                                    </div>
                                    <button
                                        style={{ color: 'var(--gold-400)', fontSize: '0.85rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(row);
                                        }}
                                    >
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))}

                        {ranking.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <Users size={48} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Nenhum dado de comissão encontrado para este período.</p>
                            </div>
                        )}
                    </div>

                    {/* INFO FOOTER */}
                    <div className="data-card-luxury" style={{ background: 'var(--grad-navy)', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h4 style={{ color: 'var(--gold-400)', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={18} /> Regras de Cálculo
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <li style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--gold-500)', borderRadius: '50%', marginTop: '6px' }}></div>
                                        As comissões são processadas automaticamente ao finalizar agendamentos.
                                    </li>
                                    <li style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--gold-500)', borderRadius: '50%', marginTop: '6px' }}></div>
                                        O percentual é baseado no valor bruto do serviço, conforme definido no perfil.
                                    </li>
                                </ul>
                            </div>
                            <div style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => window.location.href = '/professionals'}>
                                    Ajustar Percentuais da Equipe
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card modal-card-large" onClick={e => e.stopPropagation()} style={{ background: 'var(--navy-950)', border: '1px solid var(--gold-500)', boxShadow: '0 0 50px rgba(212, 175, 55, 0.15)' }}>
                        <div className="modal-header-luxury" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Detalhes de Produção</h2>
                                <p style={{ color: 'var(--white)', opacity: 0.7, fontSize: '0.9rem', marginTop: '0.25rem' }}>Profissional: <span style={{ color: 'var(--gold-400)', fontWeight: 800 }}>{selectedPerf?.professional_name}</span></p>
                            </div>
                            <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: '70vh' }}>
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="skeleton-text" style={{ width: '200px', margin: '0 auto' }}></div>
                                    <p>Carregando extrato detalhado...</p>
                                </div>
                            ) : professionalDetails ? (
                                <>
                                    <div className="indicator-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mão de Obra</label>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--white)' }}>{formatCurrency(professionalDetails.metrics.total_revenue)}</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ticket Médio</label>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--white)' }}>{formatCurrency(professionalDetails.metrics.avg_ticket)}</p>
                                        </div>
                                        <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--gold-500)' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--gold-400)' }}>Sua Comissão ({professionalDetails.professional.commission_percentage}%)</label>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--gold-500)' }}>{formatCurrency(professionalDetails.metrics.total_commission)}</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total Agendamentos</label>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--white)' }}>{professionalDetails.metrics.total_services}</p>
                                        </div>
                                    </div>

                                    <h4 style={{ color: 'var(--white)', fontSize: '0.9rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={16} color="var(--gold-500)" /> Lançamentos Recentes
                                    </h4>

                                    <div className="table-responsive" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <table className="table-luxury" style={{ width: '100%', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                    <th style={{ padding: '1rem', color: 'var(--gold-400)' }}>Data</th>
                                                    <th style={{ padding: '1rem', color: 'var(--gold-400)' }}>Valor Serviço</th>
                                                    <th style={{ padding: '1rem', color: 'var(--gold-400)' }}>Comissão</th>
                                                    <th style={{ padding: '1rem', color: 'var(--gold-400)' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {professionalDetails.recent_commissions.map(c => (
                                                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)' }}>{new Date(c.date).toLocaleDateString('pt-BR')}</td>
                                                        <td style={{ padding: '1rem', color: 'var(--white)', fontWeight: 600 }}>{formatCurrency(c.service_value)}</td>
                                                        <td style={{ padding: '1rem', color: 'var(--gold-400)', fontWeight: 700 }}>{formatCurrency(c.commission_value)}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{
                                                                background: c.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                                color: c.status === 'paid' ? '#10b981' : 'rgba(255,255,255,0.5)',
                                                                padding: '0.3rem 0.6rem',
                                                                borderRadius: '20px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {c.status === 'paid' ? 'Pago' : 'Pendente'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <p>Nenhum dado detalhado disponível.</p>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Fechar Detalhes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commissions;
