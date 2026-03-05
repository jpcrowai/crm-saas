import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '../services/api';
import { Cpu, Activity, Zap, MessageSquare, CheckCircle2, AlertTriangle, Clock, Play, Pause, RefreshCw } from 'lucide-react';
import '../styles/tenant-luxury.css';

const BotMonitor = () => {
    const { data: health, mutate: mutateHealth } = useSWR('/tenant/bot/health', fetcher, { refreshInterval: 10000 });
    const { data: sessions, mutate: mutateSessions } = useSWR('/tenant/bot/sessions', fetcher, { refreshInterval: 5000 });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'online': return { color: 'var(--success)', icon: <Activity size={16} className="animate-pulse" /> };
            case 'idle': return { color: 'var(--gold-500)', icon: <Clock size={16} /> };
            default: return { color: 'var(--error)', icon: <Zap size={16} /> };
        }
    };

    const healthStatus = getStatusStyle(health?.status || 'offline');

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>Monitor do Agente Digital</h1>
                        <span className="badge-syncing" style={{ border: `1px solid ${healthStatus.color}`, color: healthStatus.color }}>
                            {healthStatus.icon} {health?.status === 'online' ? 'Operacional' : 'Inativo / Aguardando'}
                        </span>
                    </div>
                    <p>Visão em tempo real do processamento de atendimentos via n8n</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={() => { mutateHealth(); mutateSessions(); }}>
                        <RefreshCw size={18} /> Sincronizar
                    </button>
                </div>
            </header>

            <div className="indicator-grid" style={{ marginBottom: '2rem' }}>
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--primary)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}><Cpu size={28} /></div>
                    <div className="indicator-data">
                        <label>Sessões Ativas</label>
                        <p>{health?.active_sessions || 0}</p>
                    </div>
                </div>
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--gold-500)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-500)' }}><Zap size={28} /></div>
                    <div className="indicator-data">
                        <label>Status do n8n</label>
                        <p style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>{health?.status || '...'}</p>
                    </div>
                </div>
                <div className="indicator-card-luxury" style={{ borderTopColor: 'var(--success)' }}>
                    <div className="indicator-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><CheckCircle2 size={28} /></div>
                    <div className="indicator-data">
                        <label>Lead Tracking</label>
                        <p>Ativo</p>
                    </div>
                </div>
            </div>

            <div className="data-card-luxury">
                <div className="data-card-header">
                    <h3>Monitor de Execução em Tempo Real</h3>
                </div>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {(!sessions || sessions.length === 0) ? (
                        <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                            <MessageSquare size={48} style={{ margin: '0 auto 1.5rem' }} />
                            <p>Nenhuma atividade do robô detectada recentemente.</p>
                            <small>O robô do n8n deve disparar eventos para /tenant/bot/telemetry para aparecer aqui.</small>
                        </div>
                    ) : (
                        <div className="session-monitor-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            {sessions.map(session => (
                                <div key={session.id} className="indicator-card-luxury" style={{
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    gap: '1rem',
                                    padding: '1.5rem',
                                    borderLeft: `4px solid ${session.status === 'active' ? 'var(--primary)' : 'var(--border-soft)'}`,
                                    borderTop: 'none',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div className="indicator-icon-wrapper" style={{ width: 40, height: 40, background: 'var(--navy-900)', color: 'var(--gold-400)', fontSize: '0.9rem' }}>
                                                {session.customer_name?.[0].toUpperCase() || 'L'}
                                            </div>
                                            <div>
                                                <h4 style={{ fontWeight: 800, color: 'white' }}>{session.customer_name || 'Prospect Desconhecido'}</h4>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID Sessão: {session.id.slice(0, 8)}... • Iniciado em {new Date(session.started_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <div className="badge-syncing" style={{
                                            background: session.status === 'active' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                                            color: session.status === 'active' ? 'var(--primary)' : 'var(--text-muted)'
                                        }}>
                                            {session.status === 'active' ? 'Em curso' : 'Finalizado'}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--gold-500)' }}>Etapa: {session.current_step || 'Iniciando...'}</span>
                                            <span>{session.step_progress}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${session.step_progress}%`,
                                                background: 'var(--grad-gold)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        {session.last_message && (
                                            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.7, color: 'white' }}>
                                                " {session.last_message} "
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BotMonitor;
