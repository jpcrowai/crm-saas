import React, { useState, useEffect } from 'react'
import { User, BellRing, BellOff } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../context/AuthContext'
import { subscribePush } from '../services/api'

const TopHeader = ({ onSearchClick }) => {
    const { user } = useAuth()
    const [pushStatus, setPushStatus] = useState('default')

    useEffect(() => {
        if ('Notification' in window) {
            setPushStatus(Notification.permission)
        }
    }, [])

    const handleEnablePush = async () => {
        if (!('Notification' in window)) {
            alert("Este navegador não suporta notificações.");
            return;
        }

        const permission = await Notification.requestPermission();
        setPushStatus(permission);

        if (permission === 'granted') {
            try {
                const registration = await navigator.serviceWorker.ready;
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Chave pública VAPID (exemplo genérico para teste)
                    const publicVapidKey = 'BN77X7Vf9v6D5b0A6c-K3S8H_Xv_qU-N8w_l_x_S_m_A';
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: publicVapidKey
                    });
                }

                await subscribePush(subscription);
                alert("Notificações via Push ativadas! Você receberá alertas mesmo com o app fechado.");
            } catch (err) {
                console.error("Erro ao assinar push:", err);
                // Mesmo com erro de VAPID, a permissão do browser foi dada
            }
        }
    };

    return (
        <header className="app-top-header" style={{
            height: '64px',
            padding: '0 1.5rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            width: '100%'
        }}>

            <button
                onClick={handleEnablePush}
                className="notification-toggle-btn"
                title={pushStatus === 'granted' ? "Notificações Ativas" : "Ativar Notificações no Celular"}
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    padding: '8px',
                    color: pushStatus === 'granted' ? 'var(--gold-500)' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s'
                }}
            >
                {pushStatus === 'granted' ? <BellRing size={20} /> : <BellOff size={20} />}
            </button>

            <NotificationCenter />

            <div className="user-profile-summary" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ textAlign: 'right' }} className="desktop-only">
                    <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user?.name || user?.email?.split('@')[0]}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{user?.role_local || user?.role_global}</div>
                </div>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--grad-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000'
                }}>
                    <User size={18} />
                </div>
            </div>

            <style>{`
                .notification-toggle-btn:hover {
                    background: rgba(212, 175, 55, 0.1) !important;
                    color: var(--gold-500) !important;
                }
                .app-top-header {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @media (max-width: 768px) {
                    header.app-top-header {
                        position: absolute;
                        top: 0;
                        right: 0;
                        width: auto;
                        height: auto;
                        padding: 0 !important;
                        background: transparent !important;
                        border: none !important;
                        z-index: 2000;
                        pointer-events: none;
                    }

                    .notification-toggle-btn {
                        position: fixed !important;
                        top: max(10px, env(safe-area-inset-top)) !important;
                        right: 60px !important;
                        pointer-events: auto !important;
                        z-index: 2001;
                    }

                    .notification-center-container {
                        position: fixed !important;
                        top: max(10px, env(safe-area-inset-top)) !important;
                        right: 15px !important;
                        pointer-events: auto !important;
                    }

                    .app-top-header .user-profile-summary {
                        display: none !important; 
                    }

                    .main-content {
                        padding-top: 0 !important;
                    }
                }
            `}</style>
        </header>
    )
}

export default TopHeader
