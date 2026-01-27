import React, { useState, useEffect } from 'react';
import { getLeads, updateLead, getNicheConfig } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DollarSign, MoreHorizontal, Settings, Trophy, User, MapPin, Layers, Plus, XCircle } from 'lucide-react';
import FinanceWizard from '../components/FinanceWizard';
import LeadDetailsModal from '../components/LeadDetailsModal';
import '../styles/tenant-luxury.css';

// Professional palette for stages based on the Luxury theme
const COLORS = ['#d4af37', '#0f172a', '#1e293b', '#b8860b', '#334155', '#e1c16e', '#020617'];

const Pipeline = () => {
    const [leads, setLeads] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [pipelineStages, setPipelineStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFinanceModal, setShowFinanceModal] = useState(false);
    const [selectedLeadForFinance, setSelectedLeadForFinance] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [categories, setCategories] = useState([]);
    const [methods, setMethods] = useState([]);
    const [showPipelineConfig, setShowPipelineConfig] = useState(false);
    const [tempStages, setTempStages] = useState([]);

    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [leadsRes, configRes, catRes, methRes] = await Promise.all([
                getLeads(),
                getNicheConfig(),
                import('../services/api').then(m => m.getCategories()),
                import('../services/api').then(m => m.getPaymentMethods())
            ]);
            setLeads(leadsRes.data);
            setCategories(catRes.data);
            setMethods(methRes.data);

            const stages = configRes.data.pipeline_stages || ["Novo", "Em Contato", "Agendado"];
            setPipelineStages(stages);
            setTempStages(stages);
        } catch (error) {
            console.error(error);
            const fallback = ["Novo", "Em Contato", "Agendado"];
            setPipelineStages(fallback);
            setTempStages(fallback);
        }
        setLoading(false);
    };

    const handleSavePipelineConfig = async () => {
        try {
            const { savePipelineStages } = await import('../services/api');
            await savePipelineStages(tempStages);
            setPipelineStages(tempStages);
            setShowPipelineConfig(false);
            alert("Funil atualizado com sucesso!");
        } catch (e) {
            alert("Erro ao salvar configuração do funil");
        }
    };

    const handleStatusChange = async (lead, newStatus) => {
        const id = lead.id;
        const oldLeads = [...leads];
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus, status_lead: newStatus } : l));

        try {
            await updateLead(id, { status: newStatus, status_lead: newStatus });
            const isConverted = newStatus === 'converted';
            const isWin = isConverted ||
                newStatus.toLowerCase().includes('pago') ||
                newStatus.toLowerCase().includes('ganho') ||
                newStatus.toLowerCase().includes('concluido') ||
                newStatus === pipelineStages[pipelineStages.length - 1].toLowerCase().replace(/\s+/g, '_');

            if (isWin) {
                if (window.confirm(`Lead convertido! Deseja gerar o lançamento financeiro para ${lead.nome || lead.name}?`)) {
                    setSelectedLeadForFinance(lead);
                    setShowFinanceModal(true);
                }
            }
        } catch (error) {
            alert("Falha ao atualizar status");
            setLeads(oldLeads);
        }
    };

    const getName = (lead) => lead.nome || lead.name || 'Sem Nome';
    const getValue = (lead) => parseFloat(lead.valor_total_gasto || lead.value || 0);

    const columns = pipelineStages.map((stage, index) => ({
        id: stage.toLowerCase().replace(/\s+/g, '_'),
        label: stage,
        color: COLORS[index % COLORS.length]
    }));

    if (loading) return <div className="tenant-page-container" style={{ color: 'white' }}>Sincronizando fluxo comercial...</div>;

    return (
        <div className="tenant-page-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Pipeline de Vendas</h1>
                    <p>Gestão visual do funil estratégico • {pipelineStages.length} estágios ativos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => setShowPipelineConfig(true)}>
                        <Layers size={18} /> Configurar Funil
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '2rem' }}>
                {columns.map(col => {
                    const colLeads = leads.filter(l => {
                        const leadStatus = (l.status_lead || l.status || '').toLowerCase().replace(/\s+/g, '_');
                        return leadStatus === col.id || (l.status_lead || l.status) === col.label;
                    });
                    const totalValue = colLeads.reduce((sum, l) => sum + getValue(l), 0);

                    return (
                        <div key={col.id} style={{
                            flex: '0 0 320px',
                            background: '#f1f5f9',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid var(--border-soft)'
                        }}>
                            <div style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid var(--border-soft)',
                                background: 'white',
                                borderRadius: '20px 20px 0 0',
                                borderTop: `4px solid ${col.color}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col.label}</h3>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--navy-900)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{colLeads.length}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gold-600)', fontWeight: 700 }}>
                                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                                {colLeads.map(lead => (
                                    <div
                                        key={lead.id}
                                        className="indicator-card-luxury"
                                        style={{
                                            padding: '1.25rem',
                                            cursor: 'pointer',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem',
                                            borderLeft: `4px solid ${col.color}`,
                                            borderTop: 'none'
                                        }}
                                        onClick={() => setSelectedLead(lead)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--navy-950)', fontSize: '0.95rem' }}>{getName(lead)}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn-icon"
                                                    style={{ color: 'var(--success)' }}
                                                    title="Converter em Cliente"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(lead, 'converted');
                                                    }}
                                                >
                                                    <Trophy size={14} />
                                                </button>
                                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}><MoreHorizontal size={16} /></button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={12} color="var(--gold-500)" /> {lead.origem || 'Direto'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} color="var(--gold-500)" /> {lead.responsavel || 'Sem dono'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '0.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                                <DollarSign size={14} color="var(--success)" /> {getValue(lead).toLocaleString('pt-BR')}
                                            </div>
                                            <select
                                                className="input-premium"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', width: 'auto', height: 'auto', borderRadius: '6px' }}
                                                value={col.label}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStatusChange(lead, e.target.value)}
                                            >
                                                {pipelineStages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                {colLeads.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.75rem', color: 'rgba(0,0,0,0.15)', fontWeight: 700, textTransform: 'uppercase' }}>Vazio</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showFinanceModal && (
                <FinanceWizard
                    onClose={() => setShowFinanceModal(false)}
                    onSuccess={() => {
                        setShowFinanceModal(false);
                        loadData();
                    }}
                    categories={categories}
                    methods={methods}
                    initialData={{
                        tipo: 'receita',
                        origem: 'venda',
                        lead_id: selectedLeadForFinance?.id,
                        valor: selectedLeadForFinance?.valor || selectedLeadForFinance?.value || '',
                        descricao: `Venda Won: ${selectedLeadForFinance?.nome || selectedLeadForFinance?.name}`,
                        status: 'pendente'
                    }}
                />
            )}

            {selectedLead && (
                <LeadDetailsModal
                    lead={selectedLead}
                    pipelineStages={pipelineStages}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={() => {
                        setSelectedLead(null);
                        loadData();
                    }}
                />
            )}
            {/* PIPELINE CONFIG MODAL */}
            {showPipelineConfig && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Configurar Fluxo de Vendas</h2>
                            <button onClick={() => setShowPipelineConfig(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle size={22} /></button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Defina as etapas do seu funil comercial.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {tempStages.map((stage, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                                        <Layers size={14} color="var(--gold-500)" />
                                        <input
                                            className="input-premium"
                                            style={{ flex: 1, padding: '0.4rem', border: 'none', background: 'transparent' }}
                                            value={stage}
                                            onChange={(e) => {
                                                const newStages = [...tempStages];
                                                newStages[idx] = e.target.value;
                                                setTempStages(newStages);
                                            }}
                                        />
                                        <button onClick={() => setTempStages(tempStages.filter((_, i) => i !== idx))} style={{ color: 'var(--error)', padding: '0.4rem' }}>
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', marginBottom: '2rem', borderStyle: 'dashed' }}
                                onClick={() => setTempStages([...tempStages, "Nova Etapa"])}
                            >
                                <Plus size={18} /> Adicionar Etapa
                            </button>
                            <footer style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPipelineConfig(false)}>Cancelar</button>
                                <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={handleSavePipelineConfig}>Salvar Estrutura</button>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pipeline;
