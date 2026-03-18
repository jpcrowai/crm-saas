import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, Clock, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, subscribePush } from '../services/api'
import { useNavigate } from 'react-router-dom'

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchUnreadCount()
        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleBellClick = async () => {
        setIsOpen(!isOpen)

        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const registration = await navigator.serviceWorker.ready;
                    let subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        const publicVapidKey = 'BN77X7Vf9v6D5b0A6c-K3S8H_Xv_qU-N8w_l_x_S_m_A'; // Update in production to env var
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: publicVapidKey
                        });
                    }

                    await subscribePush(subscription);
                }
            } catch (err) {
                console.error("Erro ao pedir permissão de push notificaton:", err);
            }
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount()
            setUnreadCount(res.data.count)
        } catch (e) {
            console.error("Error fetching unread count", e)
        }
    }

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const res = await getNotifications()
            setNotifications(res.data)
        } catch (e) {
            console.error("Error fetching notifications", e)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            fetchUnreadCount()
        } catch (e) {
            console.error(e)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (e) {
            console.error(e)
        }
    }

    const handleNotificationClick = (n) => {
        if (!n.read) handleMarkAsRead(n.id)
        if (n.link_url) {
            navigate(n.link_url)
            setIsOpen(false)
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-success" size={16} />
            case 'warning': return <AlertTriangle className="text-warning" size={16} />
            case 'error': return <X className="text-danger" size={16} />
            default: return <Info className="text-info" size={16} />
        }
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffInSeconds = Math.floor((now - date) / 1000)

        if (diffInSeconds < 60) return 'agora'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
        return date.toLocaleDateString('pt-BR')
    }

    return (
        <div className="notification-center-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                className={`btn-icon ${isOpen ? 'active' : ''}`}
                onClick={handleBellClick}
                style={{ position: 'relative' }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: 'var(--danger, #ef4444)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '2px 5px',
                        borderRadius: '10px',
                        border: '2px solid var(--navy-900)',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown card-dark" style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '450px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeInUp 0.2s ease-out'
                }}>
                    <div className="dropdown-header" style={{
                        padding: '1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Notificações</h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gold-400)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Ler tudo
                            </button>
                        )}
                    </div>

                    <div className="dropdown-body" style={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.5 }}>
                                <Bell size={32} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p style={{ fontSize: '0.85rem' }}>Nenhuma notificação por aqui.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: n.read ? 'transparent' : 'rgba(212,175,55,0.03)',
                                        display: 'flex',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <div style={{ marginTop: '3px' }}>{getIcon(n.type)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: n.read ? 600 : 800,
                                            fontSize: '0.85rem',
                                            color: n.read ? 'rgba(255,255,255,0.7)' : '#fff',
                                            marginBottom: '2px'
                                        }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
                                            {n.message}
                                        </div>
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: 'rgba(255,255,255,0.3)',
                                            marginTop: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Clock size={10} /> {formatTime(n.created_at)}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'var(--gold-500)',
                                            marginTop: '8px'
                                        }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dropdown-footer" style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.01)'
                    }}>
                        <button
                            onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                            }}
                        >
                            Ver todas as atividades
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .notification-item:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
                .notification-item.unread:hover {
                    background: rgba(212,175,55,0.08) !important;
                }
                @media (max-width: 768px) {
                    .notification-center-container .btn-icon {
                        width: 34px !important;
                        height: 34px !important;
                        background: rgba(15, 23, 42, 0.9) !important;
                        border: 1px solid rgba(255,255,255,0.15) !important;
                        color: rgba(255,255,255,0.8) !important;
                        border-radius: 8px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 0 !important;
                        backdrop-filter: blur(10px) !important;
                    }
                    .notification-center-container .btn-icon svg {
                        width: 18px !important;
                        height: 18px !important;
                    }
                    .notification-dropdown {
                        width: 90vw !important;
                        right: -10px !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default NotificationCenter
