import React, { useState, useEffect } from 'react';
import { useCalendarData } from '../hooks/useCalendarData';
import { getCustomerPlans } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, MapPin, Clock, User, XCircle, Calendar as CalendarIcon, CheckCircle2, CheckCircle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Skeleton, { KpiSkeleton } from '../components/Skeleton';
import '../styles/tenant-luxury.css';

const AppointmentsCalendar = () => {
    const [date, setDate] = useState(new Date());
    const {
        appointments, customers, professionals, services, connectionInfo,
        loading, loadData, addAppointment, finishAppointment
    } = useCalendarData();

    const [showGoogleConfig, setShowGoogleConfig] = useState(false);
    const [googleConfig, setGoogleConfig] = useState({
        client_id: '',
        client_secret: '',
        redirect_uri: 'http://localhost:5173/google-callback'
    });
    const [customerPlans, setCustomerPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);

    const [newAppt, setNewAppt] = useState({
        customer_id: '', professional_id: '', title: '', description: '',
        appointment_date: new Date().toISOString().slice(0, 16),
        location: '', link_reuniao: '', service_id: '',
        service_duration_minutes: 30, service_value: 0.0, plan_id: ''
    });

    const [selectedPros, setSelectedPros] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (professionals.length > 0 && selectedPros.length === 0) {
            setSelectedPros(professionals.map(p => p.id));
        }
    }, [professionals]);

    const handleConnectGoogle = async () => {
        try {
            const { getAuthUrl } = await import('../services/api');
            const res = await getAuthUrl();
            window.location.href = res.data.url;
        } catch (e) {
            setShowGoogleConfig(true);
        }
    };

    const handleCustomerChange = async (cid) => {
        setNewAppt({ ...newAppt, customer_id: cid, plan_id: '' });
        if (cid) {
            try {
                const res = await getCustomerPlans(cid);
                setCustomerPlans(res.data);
            } catch (e) {
                setCustomerPlans([]);
            }
        } else {
            setCustomerPlans([]);
        }
    };

    const handleServiceChange = (sid) => {
        const service = services.find(s => s.id === sid);
        if (service) {
            setNewAppt({
                ...newAppt,
                service_id: sid,
                service_duration_minutes: service.duration_minutes,
                service_value: service.value
            });
        } else {
            setNewAppt({ ...newAppt, service_id: sid });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await addAppointment({
                ...newAppt,
                appointment_date: new Date(newAppt.appointment_date).toISOString(),
            });
            setShowModal(false);
            setNewAppt({
                customer_id: '', professional_id: '', title: '', description: '',
                appointment_date: new Date().toISOString().slice(0, 16),
                location: '', link_reuniao: '', service_id: '',
                service_duration_minutes: 30, service_value: 0.0, plan_id: ''
            });
        } catch (e) {
            alert(e.response?.data?.detail || "Erro ao agendar");
        }
    };

    const targetDateStr = date.toISOString().split('T')[0];
    const getWeekDays = (currentDate) => {
        const days = [];
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const startOfWeek = new Date(d.setDate(diff));
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(startOfWeek);
            nextDay.setDate(startOfWeek.getDate() + i);
            days.push(nextDay);
        }
        return days;
    };
    const weekDays = getWeekDays(date);
    const hours = Array.from({ length: 15 }, (_, i) => i + 8);

    const getApptPosition = (startTime, duration) => {
        const dateObj = new Date(startTime);
        const top = ((dateObj.getHours() - 8) * 60) + dateObj.getMinutes();
        return { top, height: duration || 60 };
    };

    const proSelectorDesktop = (
        <div className="pro-tabs desktop-only">
            <button
                className={`btn-tab-luxury ${selectedPros.length === professionals.length ? 'active' : ''}`}
                onClick={() => setSelectedPros(selectedPros.length === professionals.length ? [] : professionals.map(p => p.id))}
                style={{
                    padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900,
                    background: selectedPros.length === professionals.length ? 'var(--gold-500)' : 'transparent',
                    color: selectedPros.length === professionals.length ? '#000' : 'var(--gold-500)',
                    border: '1px solid var(--gold-500)',
                    whiteSpace: 'nowrap'
                }}
            >
                {selectedPros.length === professionals.length ? 'LIMPAR' : 'TODOS'}
            </button>
            {professionals.map(pro => (
                <button
                    key={pro.id}
                    onClick={() => setSelectedPros(prev => prev.includes(pro.id) ? prev.filter(p => p !== pro.id) : [...prev, pro.id])}
                    style={{
                        padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                        background: selectedPros.includes(pro.id) ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                        border: selectedPros.includes(pro.id) ? '1px solid var(--gold-500)' : '1px solid rgba(255,255,255,0.05)',
                        color: selectedPros.includes(pro.id) ? '#fff' : 'rgba(255,255,255,0.5)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {pro.name.split(' ')[0].toUpperCase()}
                </button>
            ))}
        </div>
    );

    const proSelectorMobile = (
        <div className="pro-selector-mobile mobile-only" style={{ width: '100%', marginBottom: '0.5rem' }}>
            <select
                className="input-premium"
                style={{
                    background: 'var(--navy-800)',
                    color: 'var(--gold-400)',
                    border: '1px solid var(--gold-500)',
                    borderRadius: '12px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    width: '100%',
                    appearance: 'none',
                    textAlign: 'center'
                }}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') setSelectedPros(professionals.map(p => p.id));
                    else setSelectedPros([val]);
                }}
                value={selectedPros.length === professionals.length ? 'all' : selectedPros[0] || ''}
            >
                <option value="all">TODOS OS PROFISSIONAIS</option>
                {professionals.map(pro => (
                    <option key={pro.id} value={pro.id}>{pro.name.toUpperCase()}</option>
                ))}
            </select>
        </div>
    );

    if (loading && appointments.length === 0) {
        return (
            <div className="tenant-page-container custom-calendar-root" style={{ padding: '1.5rem' }}>
                <header className="page-header-row">
                    <Skeleton width="250px" height="32px" />
                    <Skeleton width="150px" height="40px" />
                </header>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <Skeleton width="100%" height="80px" borderRadius="16px" />
                </div>
                <div style={{ display: 'flex', flex: 1, gap: '1rem' }}>
                    <Skeleton width="60px" height="100%" />
                    <Skeleton width="100%" height="100%" />
                </div>
            </div>
        );
    }

    return (
        <div className="tenant-page-container custom-calendar-root" style={{ padding: '1.5rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .calendar-wrapper { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: var(--navy-900); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .calendar-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 1rem; flex-wrap: wrap; }
                .calendar-week-strip { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); overflow-x: auto; gap: 0.5rem; }
                .week-strip-day { flex: 1; min-width: 45px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 12px; transition: all 0.2s ease; cursor: pointer; padding: 0.75rem 0.5rem; }
                .week-strip-day.active { background: var(--gold-500); color: #000; font-weight: 800; transform: scale(1.05); }
                .calendar-grid-container { flex: 1; display: flex; overflow-y: auto; background: var(--navy-950); position: relative; }
                .time-axis { width: 60px; border-right: 1px solid rgba(255,255,255,0.05); background: var(--navy-900); }
                .unified-grid-area { flex: 1; position: relative; min-width: 300px; }
                .pro-tabs { display: flex; gap: 0.5rem; }
                .mobile-only { display: none; }
                .desktop-only { display: flex; }

                @media (max-width: 768px) {
                    .mobile-only { display: block; }
                    .desktop-only { display: none; }
                    .calendar-header { padding: 0.75rem !important; gap: 0.5rem !important; }
                    .calendar-week-strip { padding: 0.5rem !important; }
                    .pro-selector-mobile { width: 100% !important; margin: 0.25rem 0 !important; }
                    .calendar-header > div:first-child { margin-bottom: 0.25rem; }
                    .week-strip-day { padding: 0.4rem 0.2rem !important; min-width: 40px; }
                    .week-strip-day span:last-child { font-size: 1rem !important; }
                }
            `}</style>

            <div className="calendar-wrapper">
                <div className="calendar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 7); setDate(d); }}><ChevronLeft size={16} /></button>
                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{weekDays[0].getDate()} - {weekDays[6].getDate()}</div>
                            </div>
                            <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 7); setDate(d); }}><ChevronRight size={16} /></button>
                        </div>
                        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', height: '32px' }}>
                            <Plus size={16} /> <span className="desktop-only">AGENDAR</span>
                        </button>
                    </div>

                    {proSelectorMobile}

                    {/* Desktop Pro Selector (Hidden on Mobile) */}
                    {proSelectorDesktop}
                </div>

                <div className="calendar-week-strip">
                    {weekDays.map((d, i) => (
                        <div key={i} className={`week-strip-day ${d.toISOString().split('T')[0] === targetDateStr ? 'active' : ''}`} onClick={() => setDate(d)}>
                            <span style={{ fontSize: '0.6rem' }}>{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][d.getDay()]}</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{d.getDate()}</span>
                        </div>
                    ))}
                </div>

                <div className="calendar-grid-container">
                    <div className="time-axis">
                        {hours.map(h => <div key={h} style={{ height: '60px', padding: '10px 5px', fontSize: '0.7rem', opacity: 0.5, textAlign: 'right' }}>{h}:00</div>)}
                    </div>
                    <div className="unified-grid-area">
                        {hours.map(h => <div key={h} style={{ position: 'absolute', top: (h - 8) * 60, left: 0, right: 0, height: '60px', borderBottom: '1px solid rgba(255,255,255,0.03)' }} />)}
                        {appointments
                            .filter(a => selectedPros.includes(a.professional_id) && a.start_time?.split('T')[0] === targetDateStr)
                            .map(appt => {
                                const { top, height } = getApptPosition(appt.start_time, appt.service_duration_minutes);
                                return (
                                    <div key={appt.id} className="appointment-block" style={{
                                        position: 'absolute', top, height, left: '4px', right: '4px',
                                        background: 'var(--grad-gold)', color: '#000', padding: '8px', borderRadius: '8px',
                                        fontSize: '0.75rem', fontWeight: 800, overflow: 'hidden', cursor: 'pointer', zIndex: 10
                                    }}>
                                        {appt.customer_name} • {appt.title}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
            {/* APPOINTMENT MODAL */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content card-dark" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="card-header-row">
                            <h3 className="text-gold">Novo Agendamento</h3>
                            <button className="btn-close-modal" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="form-grid" style={{ marginTop: '1rem' }}>
                            <div>
                                <label>Cliente</label>
                                <select
                                    className="input-premium"
                                    required
                                    value={newAppt.customer_id}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Profissional</label>
                                <select
                                    className="input-premium"
                                    required
                                    value={newAppt.professional_id}
                                    onChange={(e) => setNewAppt({ ...newAppt, professional_id: e.target.value })}
                                >
                                    <option value="">Selecione um profissional...</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Serviço</label>
                                <select
                                    className="input-premium"
                                    required
                                    value={newAppt.service_id}
                                    onChange={(e) => handleServiceChange(e.target.value)}
                                >
                                    <option value="">Selecione um serviço...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.value}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Data e Hora</label>
                                <input
                                    type="datetime-local"
                                    className="input-premium"
                                    required
                                    value={newAppt.appointment_date}
                                    onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsCalendar;
