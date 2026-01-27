import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, CreditCard, ShoppingBag, User } from 'lucide-react';
import { createFinance, getLeads } from '../services/api';

const FinanceWizard = ({ onClose, onSuccess, categories, methods, initialData }) => {
    const [step, setStep] = useState(1);
    const [leads, setLeads] = useState([]);
    const defaultData = {
        tipo: 'receita',
        origem: 'avulso',
        lead_id: '',
        valor: '',
        descricao: '',
        data_vencimento: new Date().toISOString().split('T')[0],
        parcelas: 1,
        forma_pagamento: '',
        categoria: '',
        observacoes: '',
        status: 'pendente'
    };
    const [formData, setFormData] = useState({ ...defaultData, ...initialData });

    useEffect(() => {
        if (formData.origem === 'venda') {
            getLeads().then(res => setLeads(res.data));
        }
    }, [formData.origem]);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        try {
            await createFinance({
                ...formData,
                valor: parseFloat(formData.valor),
                parcelas: parseInt(formData.parcelas)
            });
            onSuccess();
        } catch (error) {
            alert("Erro ao salvar lançamento");
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="wizard-step">
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Etapa 1: Tipo e Origem</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                className={`card ${formData.tipo === 'receita' ? 'active-border' : ''}`}
                                onClick={() => setFormData({ ...formData, tipo: 'receita' })}
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: formData.tipo === 'receita' ? '#f0fdf4' : 'white' }}
                                type="button"
                            >
                                <ArrowUpCircle color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontWeight: 600 }}>Receita</div>
                            </button>
                            <button
                                className={`card ${formData.tipo === 'despesa' ? 'active-border' : ''}`}
                                onClick={() => setFormData({ ...formData, tipo: 'despesa' })}
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: formData.tipo === 'despesa' ? '#fef2f2' : 'white' }}
                                type="button"
                            >
                                <ArrowDownCircle color="#ef4444" style={{ margin: '0 auto 0.5rem' }} />
                                <div style={{ fontWeight: 600 }}>Despesa</div>
                            </button>
                        </div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Origem do Lançamento</label>
                        <select
                            style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem' }}
                            value={formData.origem}
                            onChange={(e) => setFormData({ ...formData, origem: e.target.value, lead_id: '' })}
                        >
                            <option value="avulso">Avulso / Despesa Fixa</option>
                            <option value="venda">Vinculado a uma Venda/Lead</option>
                        </select>

                        {formData.origem === 'venda' && (
                            <div className="form-group">
                                <label>Selecionar Venda/Lead</label>
                                <select
                                    value={formData.lead_id}
                                    onChange={(e) => {
                                        const lead = leads.find(l => l.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            lead_id: e.target.value,
                                            valor: lead?.valor || lead?.value || formData.valor,
                                            descricao: `Venda: ${lead?.nome || lead?.name || 'Lead'}`
                                        });
                                    }}
                                >
                                    <option value="">Selecione um lead...</option>
                                    {leads.map(l => (
                                        <option key={l.id} value={l.id}>{l.nome || l.name} - R$ {l.valor || l.value}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="wizard-step">
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Etapa 2: Valores e Vencimento</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Descrição</label>
                                <input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} placeholder="Ex: Pagamento Fornecedor X" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Valor Total (R$)</label>
                                    <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Número de Parcelas</label>
                                    <input type="number" min="1" value={formData.parcelas} onChange={e => setFormData({ ...formData, parcelas: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Data de Vencimento</label>
                                    <input type="date" value={formData.data_vencimento} onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Forma de Pagamento</label>
                                    <select value={formData.forma_pagamento} onChange={e => setFormData({ ...formData, forma_pagamento: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {(methods || []).map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="wizard-step">
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Etapa 3: Categorização</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Categoria Financeira</label>
                                <select style={{ width: '100%' }} value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {(categories || []).filter(c => c.tipo === (formData.tipo === 'receita' ? 'entrada' : 'saida') || c.tipo === 'ambos').map(c => (
                                        <option key={c.id} value={c.nome}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Observações Internas</label>
                                <textarea style={{ width: '100%', height: '100px' }} value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.status === 'pago'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'pago' : 'pendente' })}
                                    />
                                    <strong>Marcar como já pago/recebido</strong>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="wizard-step">
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Etapa 4: Resumo Final</h4>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', rowGap: '1.5rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Tipo/Descrição</p>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{formData.tipo.toUpperCase()} - {formData.descricao}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Valor Total</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: formData.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                                        R$ {parseFloat(formData.valor || 0).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Parcelamento</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{formData.parcelas}x de R$ {(parseFloat(formData.valor || 0) / parseInt(formData.parcelas || 1)).toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Vencimento Inicial</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{new Date(formData.data_vencimento).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Categoria / Pagamento</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{formData.categoria || 'Não definida'} • {formData.forma_pagamento || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Status</p>
                                    <span className={`badge ${formData.status === 'pago' ? 'badge-active' : 'badge-inactive'}`}>
                                        {formData.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '1.5rem', textAlign: 'center' }}>
                            Confira as informações antes de finalizar. {formData.parcelas > 1 && `Serão gerados ${formData.parcelas} lançamentos automáticos.`}
                        </p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '600px', maxWidth: '95%', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Novo Lançamento</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X /></button>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', height: '4px', background: '#f1f5f9' }}>
                    <div style={{ width: `${(step / 4) * 100}%`, background: 'var(--primary-color)', transition: 'width 0.3s ease' }}></div>
                </div>

                <div style={{ padding: '2rem' }}>
                    {renderStep()}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        onClick={handleBack}
                        disabled={step === 1}
                        className="btn-secondary"
                        style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
                    >
                        <ChevronLeft size={18} /> Voltar
                    </button>

                    {step < 4 ? (
                        <button onClick={handleNext} className="btn-primary" disabled={step === 2 && (!formData.valor || !formData.descricao)}>
                            Continuar <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} className="btn-primary" style={{ background: '#10b981' }}>
                            <Check size={18} /> Confirmar e Salvar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Help icons from extrato context
const ArrowUpCircle = ({ color, style }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="16" x2="12" y2="8" />
    </svg>
);
const ArrowDownCircle = ({ color, style }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 12 12 16 16 12" />
        <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
);

export default FinanceWizard;
