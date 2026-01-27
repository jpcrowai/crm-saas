import React, { useState } from 'react';
import { importLeads } from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, XCircle, ChevronRight, Search, Download } from 'lucide-react';
import '../styles/tenant-luxury.css';

const ImportLeads = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFile = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await importLeads(formData);
            setResult(res.data);
        } catch (e) { alert("Erro ao importar base de leads."); }
        setLoading(false);
    };

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Sincronizar Inteligência de Leads</h1>
                    <p>Importação em massa via Excel com detecção automática de colunas</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1.2fr', gap: '3rem' }}>
                {/* UPLOAD CARD */}
                <div className="data-card-luxury" style={{ padding: '3rem' }}>
                    <div style={{ border: '2px dashed var(--border-soft)', borderRadius: '20px', padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', transition: 'var(--transition)' }}>
                        <div style={{ width: 64, height: 64, background: 'var(--navy-900)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Upload size={28} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Arraste seu arquivo Excel</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>O sistema detectará automaticamente as colunas de Nome, WhatsApp e E-mail.</p>

                        <label className="btn-primary" style={{ cursor: 'pointer' }}>
                            <FileText size={18} /> {file ? file.name : 'Selecionar Arquivo'}
                            <input type="file" hidden onChange={handleFile} accept=".xlsx, .xls" />
                        </label>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} color="var(--success)" /> Detecção inteligente de duplicados (Upsert)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} color="var(--success)" /> Atualização automática de histórico de contato
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        disabled={!file || loading}
                        style={{ width: '100%', marginTop: '3rem' }}
                        onClick={handleUpload}
                    >
                        {loading ? 'Processando dados...' : 'Executar Sincronização em Massa'}
                    </button>
                </div>

                {/* RESULTS AREA */}
                <div className="data-card-luxury" style={{ background: result ? 'white' : 'transparent', border: result ? 'none' : '2px dashed rgba(255,255,255,0.1)', boxShadow: result ? 'var(--shadow-premium)' : 'none' }}>
                    {result ? (
                        <div style={{ padding: '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                                <CheckCircle2 size={32} color="var(--success)" />
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)' }}>Sincronização Concluída</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sua base de dados comercial foi atualizada com sucesso.</p>
                                </div>
                            </div>

                            <div className="indicator-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div className="indicator-card-luxury" style={{ borderTop: 'none', background: '#f8fafc' }}>
                                    <div className="indicator-data">
                                        <label>Contatos Criados</label>
                                        <p style={{ color: 'var(--success)' }}>{result.created}</p>
                                    </div>
                                </div>
                                <div className="indicator-card-luxury" style={{ borderTop: 'none', background: '#f8fafc' }}>
                                    <div className="indicator-data">
                                        <label>Contatos Atualizados</label>
                                        <p style={{ color: 'var(--gold-600)' }}>{result.updated}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--grad-premium)', padding: '1.5rem', borderRadius: '16px', color: 'white' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, marginBottom: '0.5rem' }}>Próximos Passos</p>
                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/pipeline'}>
                                    Visualizar no Pipeline de Vendas <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem', textAlign: 'center' }}>
                            <FileBarChart size={80} style={{ marginBottom: '1.5rem' }} />
                            <p style={{ fontWeight: 600 }}>Aguardando upload para gerar relatório de processamento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportLeads;
