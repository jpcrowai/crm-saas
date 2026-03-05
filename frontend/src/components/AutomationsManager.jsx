import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Sparkles, Zap, Trash2, Plus, Globe, Bell, ListTodo } from 'lucide-react';
import api from '../services/api';

const AutomationsManager = () => {
    const { data: automations, isLoading } = useSWR('/tenant/automations', (url) => api.get(url).then(res => res.data));
    const [showForm, setShowForm] = useState(false);
    const [newAuto, setNewAuto] = useState({
        name: '',
        trigger_type: 'lead_created',
        action_type: 'webhook',
        action_config: { url: '' }
    });

    const handleCreate = async () => {
        await api.post('/tenant/automations/', newAuto);
        setShowForm(false);
        mutate('/tenant/automations');
    };

    const handleDelete = async (id) => {
        await api.delete(`/tenant/automations/${id}`);
        mutate('/tenant/automations');
    };

    if (isLoading) return <div className="shimmer-line" style={{ height: '300px' }}></div>;

    return (
        <div className="tab-fade-in" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Fluxos de Automação</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Conecte eventos do seu CRM com ações externas e internas</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Nova Automação
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {automations?.map(auto => (
                    <div key={auto.id} className="data-card-luxury" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-400)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>{auto.name}</h4>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <span className="palette-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                                        Gatilho: {auto.trigger_type}
                                    </span>
                                    <span className="palette-badge" style={{ background: 'var(--grad-gold)', color: 'var(--navy-950)' }}>
                                        Ação: {auto.action_type}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(auto.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6 }}>
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <div className="modal-header-luxury">
                            <h2>Configurar Fluxo</h2>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group-luxury">
                                <label>Nome da Automação</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Enviar para Webhook de Boas-vindas"
                                    value={newAuto.name}
                                    onChange={e => setNewAuto({ ...newAuto, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group-luxury">
                                <label>Quando isso acontece? (Gatilho)</label>
                                <select
                                    value={newAuto.trigger_type}
                                    onChange={e => setNewAuto({ ...newAuto, trigger_type: e.target.value })}
                                >
                                    <option value="lead_created">Novo Lead Criado</option>
                                    <option value="appointment_completed">Agendamento Concluído</option>
                                    <option value="churn_risk">Risco de Churn Detectado</option>
                                </select>
                            </div>
                            <div className="form-group-luxury">
                                <label>O que fazer? (Ação)</label>
                                <select
                                    value={newAuto.action_type}
                                    onChange={e => setNewAuto({ ...newAuto, action_type: e.target.value })}
                                >
                                    <option value="webhook">Enviar Webhook (Link Externo)</option>
                                    <option value="notification">Notificar Time</option>
                                    <option value="internal_task">Criar Tarefa Interna</option>
                                </select>
                            </div>
                            {newAuto.action_type === 'webhook' && (
                                <div className="form-group-luxury">
                                    <label>URL do Webhook (Ex: n8n, Zapier)</label>
                                    <input
                                        type="url"
                                        placeholder="https://sua-url.com/webhook"
                                        value={newAuto.action_config.url}
                                        onChange={e => setNewAuto({ ...newAuto, action_config: { url: e.target.value } })}
                                    />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Ativar Automação</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationsManager;
