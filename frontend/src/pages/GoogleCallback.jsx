import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Finalizando conexão com o Google...");
    const [error, setError] = useState(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(`O Google retornou um erro: ${errorParam}`);
        } else if (code) {
            handleCallback(code, state);
        } else {
            setError("O código de autorização não foi encontrado. Por favor, tente vincular novamente.");
        }
    }, [searchParams]);

    const handleCallback = async (code, state) => {
        try {
            setStatus("Processando autorização no servidor...");
            const { googleCallback } = await import('../services/api');

            const response = await googleCallback({ code, state });

            if (response.data.status === "success") {
                setStatus("Conectado com sucesso! Redirecionando...");
                setTimeout(() => navigate('/calendar'), 2000);
            } else {
                throw new Error(response.data.message || "Falha na sincronização.");
            }
        } catch (e) {
            console.error("Erro no callback:", e);
            const msg = e.response?.data?.detail || e.message || "Erro ao processar o vínculo.";
            setError(msg);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '450px',
                padding: '3rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 163, 115, 0.1)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        transition: 'all 0.3s ease'
                    }}>
                        {error ? (
                            <span style={{ fontSize: '2rem' }}>⚠️</span>
                        ) : (
                            <div className="loading-spinner-luxury"></div>
                        )}
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                        {error ? "Ops! Algo deu errado" : "Sincronização Ativa"}
                    </h2>
                    <p style={{ color: error ? '#fca5a5' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {error || status}
                    </p>
                </div>

                {error && (
                    <button
                        onClick={() => navigate('/calendar')}
                        style={{
                            background: 'white',
                            color: '#0f172a',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Tentar Novamente
                    </button>
                )}
            </div>

            <style>{`
                .loading-spinner-luxury {
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top: 3px solid #d4a373;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default GoogleCallback;
