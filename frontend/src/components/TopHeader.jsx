import React from 'react'
import { Search, User } from 'lucide-react'
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
            {/* Quick Search Shortcut Info (Desktop Only) */}
            <div className="search-shortcut desktop-only" style={{
                marginRight: 'auto',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.03)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
            }} onClick={onSearchClick}>
                <Search size={14} />
                <span>Pressione <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '4px' }}>Ctrl + K</kbd> para busca rápida</span>
            </div>

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
                .app-top-header {
                    transition: all 0.3s ease;
                }
                @media (max-width: 768px) {
                    .app-top-header {
                        height: 60px !important;
                        padding: 0 1rem !important;
                        background: var(--navy-900) !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        flex-direction: row !important; /* Keep it horizontal */
                        align-items: center !important;
                        justify-content: flex-end !important;
                    }
                    .main-content {
                        padding-top: 60px !important;
                    }
                }
            `}</style>
        </header>
    )
}

export default TopHeader
