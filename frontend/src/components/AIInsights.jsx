import React from 'react';
import useSWR from 'swr';
import { getAIInsights } from '../services/api';
import { Sparkles, TrendingUp, AlertCircle, MessageCircle, ArrowUpRight } from 'lucide-react';
import Skeleton from './Skeleton';

const AIInsights = () => {
    const { data: insights, error, isLoading } = useSWR('ai-insights', getAIInsights);

    if (isLoading) return <div className="skeleton" style={{ height: '200px', borderRadius: '20px' }}></div>;
    if (error) return null;

    const { churn_alerts, revenue_forecast, sales_insights } = insights.data;

    return (
        <div className="ai-insights-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ background: 'var(--grad-gold)', padding: '0.5rem', borderRadius: '12px', color: 'var(--navy-950)' }}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--white)' }}>Insights da Inteligência Artificial</h3>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Análise proativa do seu ambiente de negócios</p>
                </div>
            </div>

            <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* CHURN ALERTS */}
                <div className="data-card-luxury" style={{ border: '1px solid rgba(212, 175, 55, 0.2)', background: 'rgba(212, 175, 55, 0.03)' }}>
                    <div className="data-card-header" style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} color="var(--gold-500)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-500)', letterSpacing: '1px' }}>RISCO DE CHURN</span>
                        </div>
                    </div>
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {churn_alerts?.length > 0 ? churn_alerts.map((alert, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{alert.customer_name}</p>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{alert.message}</p>
                                </div>
                                <a
                                    href={`https://wa.me/${alert.phone?.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-secondary"
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <MessageCircle size={14} /> Reativar
                                </a>
                            </div>
                        )) : (
                            <p style={{ fontSize: '0.85rem', opacity: 0.5, textAlign: 'center' }}>Nenhum risco crítico detectado.</p>
                        )}
                    </div>
                </div>

                {/* REVENUE FORECAST */}
                <div className="data-card-luxury" style={{ border: '1px solid rgba(52, 211, 153, 0.2)', background: 'rgba(52, 211, 153, 0.03)' }}>
                    <div className="data-card-header" style={{ borderBottom: '1px solid rgba(52, 211, 153, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={18} color="#34d399" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '1px' }}>PREVISÃO DE RECEITA</span>
                        </div>
                    </div>
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {revenue_forecast?.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{item.month}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>R$ {item.forecast.toLocaleString()}</span>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                        <ArrowUpRight size={10} /> Projeção v1
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
