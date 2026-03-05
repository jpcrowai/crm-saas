import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    UserPlus,
    Calendar as CalendarIcon,
    DollarSign,
    Users,
    Target,
    X,
    Command,
    ArrowRight
} from 'lucide-react';
import { getLeads, getCustomers } from '../services/api';
import './CommandPalette.css';

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ leads: [], customers: [], actions: [] });
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const staticActions = [
        { id: 'act-1', label: 'Novo Lead', icon: <UserPlus size={18} />, path: '/pipeline', action: 'openForm' },
        { id: 'act-2', label: 'Ver Agenda', icon: <CalendarIcon size={18} />, path: '/calendar' },
        { id: 'act-3', label: 'Lançar Receita', icon: <DollarSign size={18} />, path: '/finances' },
        { id: 'act-4', label: 'Base de Clientes', icon: <Users size={18} />, path: '/customers' },
    ];

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleSearch = async () => {
            if (!query.trim()) {
                setResults({ leads: [], customers: [], actions: staticActions });
                return;
            }

            setLoading(true);
            try {
                // In a real scenario, we'd have a specific search endpoint
                // For now, we'll filter local data or simulate
                const [leadsRes, custRes] = await Promise.all([getLeads(), getCustomers()]);

                const filteredLeads = leadsRes.data.filter(l =>
                    l.name.toLowerCase().includes(query.toLowerCase()) ||
                    l.email?.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 3);

                const filteredCust = custRes.data.filter(c =>
                    c.name.toLowerCase().includes(query.toLowerCase()) ||
                    c.email?.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 3);

                const filteredActions = staticActions.filter(a =>
                    a.label.toLowerCase().includes(query.toLowerCase())
                );

                setResults({
                    leads: filteredLeads,
                    customers: filteredCust,
                    actions: filteredActions
                });
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(handleSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (item) => {
        onClose();
        if (item.path) {
            navigate(item.path);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="palette-overlay" onClick={onClose}>
            <div className="palette-container tab-fade-in" onClick={e => e.stopPropagation()}>
                <div className="palette-search-wrapper">
                    <Search className="palette-search-icon" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="O que você deseja fazer hoje?"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="palette-input"
                    />
                    <div className="palette-esc-badge">ESC</div>
                </div>

                <div className="palette-results">
                    {loading && (
                        <div className="palette-loading">
                            <div className="shimmer-line" style={{ width: '100%', height: '40px' }}></div>
                            <div className="shimmer-line" style={{ width: '100%', height: '40px' }}></div>
                        </div>
                    )}

                    {!loading && results.actions.length > 0 && (
                        <div className="palette-section">
                            <label>AÇÕES RÁPIDAS</label>
                            {results.actions.map(action => (
                                <div key={action.id} className="palette-item" onClick={() => handleSelect(action)}>
                                    <div className="palette-item-icon">{action.icon}</div>
                                    <span>{action.label}</span>
                                    <ArrowRight size={14} className="palette-item-arrow" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && results.leads.length > 0 && (
                        <div className="palette-section">
                            <label>LEADS ENCONTRADOS</label>
                            {results.leads.map(lead => (
                                <div key={lead.id} className="palette-item" onClick={() => handleSelect({ path: '/pipeline' })}>
                                    <div className="palette-item-icon"><Target size={18} color="var(--gold-400)" /></div>
                                    <div className="palette-item-info">
                                        <span className="name">{lead.name}</span>
                                        <span className="sub">{lead.email}</span>
                                    </div>
                                    <span className="palette-badge">{lead.funil_stage}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && results.leads.length === 0 && results.customers.length === 0 && results.actions.length === 0 && (
                        <div className="palette-empty">
                            <p>Nenhum resultado para "{query}"</p>
                        </div>
                    )}
                </div>

                <div className="palette-footer">
                    <div className="palette-hint">
                        <Command size={12} /> + K para abrir em qualquer lugar
                    </div>
                    <div className="palette-hint">
                        Use as setas para navegar
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
