/**
 * Toast — sistema de notificações não-bloqueantes.
 * Suporta: success, error, info, warning
 * Uso: showToast('mensagem', 'error')
 */
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastRoot = null;
let toastContainer = null;

function getContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-root';
        Object.assign(toastContainer.style, {
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: '99999',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            pointerEvents: 'none',
        });
        document.body.appendChild(toastContainer);
        toastRoot = createRoot(toastContainer);
    }
    return toastContainer;
}

// Global list of toasts
let globalToasts = [];
let renderFn = null;

function syncRender() {
    if (renderFn) renderFn([...globalToasts]);
}

export function showToast(message, type = 'info', duration = 4000) {
    getContainer();
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    globalToasts = [...globalToasts, toast];
    syncRender();

    // Auto-remove
    setTimeout(() => {
        globalToasts = globalToasts.filter(t => t.id !== id);
        syncRender();
    }, duration);
}

const TYPE_CONFIG = {
    success: {
        bg: 'linear-gradient(135deg, #065f46, #047857)',
        icon: <CheckCircle2 size={18} />,
        border: '#10b981',
    },
    error: {
        bg: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        icon: <XCircle size={18} />,
        border: '#ef4444',
    },
    warning: {
        bg: 'linear-gradient(135deg, #78350f, #92400e)',
        icon: <AlertTriangle size={18} />,
        border: '#f59e0b',
    },
    info: {
        bg: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
        icon: <Info size={18} />,
        border: '#3b82f6',
    },
};

function ToastItem({ id, message, type, onRemove }) {
    const [visible, setVisible] = useState(false);
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onRemove(id), 300);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                borderRadius: '12px',
                background: config.bg,
                border: `1px solid ${config.border}`,
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                minWidth: '280px',
                maxWidth: '420px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'all',
                cursor: 'default',
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            }}
        >
            <span style={{ flexShrink: 0, opacity: 0.9 }}>{config.icon}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    flexShrink: 0,
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        renderFn = setToasts;
        return () => { renderFn = null; };
    }, []);

    const remove = (id) => {
        globalToasts = globalToasts.filter(t => t.id !== id);
        setToasts([...globalToasts]);
    };

    return (
        <>
            {toasts.map(t => (
                <ToastItem key={t.id} {...t} onRemove={remove} />
            ))}
        </>
    );
}

// Mount once on import
let mounted = false;
function mountToastSystem() {
    if (mounted) return;
    mounted = true;
    setTimeout(() => {
        const container = getContainer();
        toastRoot.render(<ToastContainer />);
    }, 0);
}

mountToastSystem();

export default ToastContainer;
