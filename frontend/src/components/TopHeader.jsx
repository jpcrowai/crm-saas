import React from 'react'
import { User } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import { useAuth } from '../context/AuthContext'

const TopHeader = ({ onSearchClick }) => {
    const { user } = useAuth()

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

                    .notification-center-container {
                        position: fixed !important;
                        top: max(20px, env(safe-area-inset-top)) !important;
                        right: 16px !important;
                        pointer-events: auto !important;
                        z-index: 2001;
                    }

                    .app-top-header .user-profile-summary {
                        display: none !important; 
                    }

                    .main-content {
                        padding-top: 0 !important;
                    }

                    .page-header-row {
                        padding-right: 100px !important; /* Prevent text overlap with absolute buttons */
                    }
                }
            `}</style>
        </header>
    )
}

export default TopHeader
