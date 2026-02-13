import React, { useState, useEffect } from 'react';
import {
    X, Phone, Mail, MessageSquare, History, CheckSquare,
    Save, Plus, Trash2, ChevronRight, User, MapPin,
    Calendar, DollarSign, Clock, Send, Trophy, CheckCircle
} from 'lucide-react';
import {
    updateLead, getLeadHistory, addLeadHistory,
    getLeadTasks, createLeadTask, updateTask
} from '../services/api';

const LeadDetailsModal = ({ lead, onClose, onUpdate, pipelineStages = [] }) => {
    const [activeTab, setActiveTab] = useState('info'); // info, history, tasks
    const [editedLead, setEditedLead] = useState({ ...lead });
    const [history, setHistory] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newHistoryItem, setNewHistoryItem] = useState({ type: 'note', description: '' });
    const [newTask, setNewTask] = useState({ title: '', due_date: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSubData();
    }, [lead.id]);

    const loadSubData = async () => {
        try {
            const [hRes, tRes] = await Promise.all([
                getLeadHistory(lead.id),
                getLeadTasks(lead.id)
            ]);
            setHistory(hRes.data.sort((a, b) => b.created_at.localeCompare(a.created_at)));
            setTasks(tRes.data.sort((a, b) => a.due_date.localeCompare(b.due_date)));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveInfo = async () => {
        setLoading(true);
        try {
            await updateLead(lead.id, editedLead);
            onUpdate();
            alert("Informações atualizadas!");
        } catch (e) {
            alert("Erro ao salvar");
        }
        setLoading(false);
    };

    const handleAddHistory = async () => {
        if (!newHistoryItem.description) return;
        try {
            await addLeadHistory(lead.id, newHistoryItem);
            setNewHistoryItem({ type: 'note', description: '' });
            loadSubData();
        } catch (e) {
            alert("Erro ao adicionar histórico");
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title) return;
        try {
            await createLeadTask(lead.id, newTask);
            setNewTask({ title: '', due_date: '' });
            loadSubData();
        } catch (e) {
            alert("Erro ao criar tarefa");
        }
    };

    const handleToggleTask = async (task) => {
        try {
            await updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
            loadSubData();
        } catch (e) {
            alert("Erro ao atualizar tarefa");
        }
    };

    const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1200 }}>
            <div style={{ width: '600px', background: 'white', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 20px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editedLead.nome || editedLead.name}</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {editedLead.telefone || editedLead.whatsapp || '-'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {editedLead.email || '-'}</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                    {['info', 'history', 'tasks'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer',
                                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : 'none',
                                color: activeTab === tab ? 'var(--primary-color)' : '#64748b',
                                fontWeight: activeTab === tab ? 600 : 400
                            }}
                        >
                            {tab === 'info' && 'Informações'}
                            {tab === 'history' && 'Histórico'}
                            {tab === 'tasks' && 'Tarefas'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {activeTab === 'info' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Status / Etapa</label>
                                    <select
                                        style={{ width: '100%' }}
                                        value={editedLead.funil_stage || editedLead.status || editedLead.status_lead}
                                        onChange={e => setEditedLead({ ...editedLead, funil_stage: e.target.value, status: e.target.value, status_lead: e.target.value })}
                                    >
                                        {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Valor Estimado (R$)</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%' }}
                                        value={editedLead.valor || editedLead.value || 0}
                                        onChange={e => setEditedLead({ ...editedLead, valor: e.target.value, value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Origem</label>
                                    <input style={{ width: '100%' }} value={editedLead.origem || ''} onChange={e => setEditedLead({ ...editedLead, origem: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Responsável</label>
                                    <input style={{ width: '100%' }} value={editedLead.responsavel || ''} onChange={e => setEditedLead({ ...editedLead, responsavel: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem' }}>Observações Gerais</label>
                                <textarea
                                    style={{ width: '100%', height: '100px' }}
                                    value={editedLead.observacoes || editedLead.notes || ''}
                                    onChange={e => setEditedLead({ ...editedLead, observacoes: e.target.value })}
                                />
                            </div>

                            <button onClick={handleSaveInfo} disabled={loading} className="btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div style={{ mb: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Registrar Interação</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    {['note', 'call', 'whatsapp', 'meeting'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewHistoryItem({ ...newHistoryItem, type })}
                                            style={{
                                                flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer',
                                                background: newHistoryItem.type === type ? '#6366f1' : 'white',
                                                color: newHistoryItem.type === type ? 'white' : '#64748b',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {formatLabel(type)}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    placeholder="Descreva o que aconteceu..."
                                    style={{ width: '100%', minHeight: '60px', mb: '0.5rem' }}
                                    value={newHistoryItem.description}
                                    onChange={e => setNewHistoryItem({ ...newHistoryItem, description: e.target.value })}
                                />
                                <button onClick={handleAddHistory} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}>
                                    <Send size={16} /> Registrar
                                </button>
                            </div>

                            <div className="timeline" style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                                {history.map((item, idx) => (
                                    <div key={item.id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            position: 'absolute', left: '-1.5rem', top: '0.25rem', width: '10px', height: '10px',
                                            borderRadius: '50%', background: '#6366f1', border: '2px solid white', zIndex: 1
                                        }}></div>
                                        {idx < history.length - 1 && (
                                            <div style={{ position: 'absolute', left: 'calc(-1.5rem + 4px)', top: '0.75rem', bottom: '-1.25rem', width: '2px', background: '#e2e8f0' }}></div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{new Date(item.created_at).toLocaleString()}</span>
                                            <span style={{ fontWeight: 600, color: '#6366f1' }}>{item.type.toUpperCase()}</span>
                                        </div>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#334155' }}>{item.description}</p>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Por: {item.user_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nova Tarefa</label>
                                <input
                                    placeholder="O que precisa ser feito?"
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="date" style={{ flex: 1 }} value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                                    <button onClick={handleAddTask} className="btn-primary" style={{ padding: '0 1rem' }}><Plus size={18} /></button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {tasks.map(task => (
                                    <div key={task.id} className="card" style={{
                                        padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                        opacity: task.status === 'completed' ? 0.6 : 1,
                                        borderLeft: task.status === 'completed' ? '4px solid #10b981' : '4px solid #f59e0b'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'completed'}
                                            onChange={() => handleToggleTask(task)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                margin: 0, fontWeight: 600, fontSize: '0.9rem',
                                                textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                            }}>{task.title}</p>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Vence em: {new Date(task.due_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Quick Actions */}
                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            if (window.confirm("Deseja converter este Lead em Cliente?")) {
                                try {
                                    await updateLead(lead.id, { funil_stage: 'converted', status: 'converted', status_lead: 'converted' });
                                    alert("Lead convertido em Cliente com sucesso!");
                                    onUpdate();
                                } catch (e) {
                                    alert("Erro ao converter lead");
                                }
                            }
                        }}
                        style={{ flex: 2, justifyContent: 'center', background: 'var(--success)', border: 'none' }}
                    >
                        <Trophy size={18} /> Converter em Cliente
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => window.open(`https://wa.me/${(editedLead.telefone || editedLead.whatsapp || '').replace(/\D/g, '')}`)}
                        style={{ flex: 1, justifyContent: 'center', background: '#25D366', color: 'white', border: 'none' }}
                    >
                        <MessageSquare size={18} /> WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailsModal;
