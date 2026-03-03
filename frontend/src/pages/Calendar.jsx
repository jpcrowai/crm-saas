import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment, getCustomers, getServices, getCustomerPlans, completeAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, MapPin, Clock, User, XCircle, Calendar as CalendarIcon, CheckCircle2, CheckCircle, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/tenant-luxury.css';

const AppointmentsCalendar = () => {
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [showGoogleConfig, setShowGoogleConfig] = useState(false);
    const [googleConfig, setGoogleConfig] = useState({
        client_id: '',
        client_secret: '',
        redirect_uri: 'http://localhost:5173/google-callback'
    });
    const [connectionInfo, setConnectionInfo] = useState({ connected: false, email: '' });
    const [services, setServices] = useState([]);
    const [customerPlans, setCustomerPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDayModal, setShowDayModal] = useState(false);

    const [newAppt, setNewAppt] = useState({
        customer_id: '',
        professional_id: '',
        title: '',
        description: '',
        appointment_date: (() => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        })(),
        location: '',
        link_reuniao: '',
        service_id: '',
        service_duration_minutes: 30,
        service_value: 0.0,
        plan_id: ''
    });

    const [selectedPros, setSelectedPros] = useState([]);
    const [showProFilter, setShowProFilter] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        const cachedConn = localStorage.getItem('google_connected');
        if (cachedConn === 'true') {
            setConnectionInfo(prev => ({ ...prev, connected: true }));
        }

        const cachedAppts = localStorage.getItem('cached_appointments');
        if (cachedAppts) {
            try { setAppointments(JSON.parse(cachedAppts)); } catch (e) { }
        }

        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { getCalendarInfo, getProfessionals } = await import('../services/api');
            const [apptRes, custRes, infoRes, servRes, profRes] = await Promise.all([
                getAppointments(),
                getCustomers(),
                getCalendarInfo(),
                getServices(),
                getProfessionals()
            ]);

            setAppointments(apptRes.data);
            localStorage.setItem('cached_appointments', JSON.stringify(apptRes.data));
            setCustomers(custRes.data);
            setProfessionals(profRes.data);
            setSelectedPros(profRes.data.map(p => p.id)); // Default: Select all
            setConnectionInfo(infoRes.data);

            if (infoRes.data.connected) {
                localStorage.setItem('google_connected', 'true');
            } else {
                localStorage.removeItem('google_connected');
            }

            setServices(servRes.data);
        } catch (e) { console.error(e); }
    };

    const handleConnectGoogle = async () => {
        try {
            const { getAuthUrl } = await import('../services/api');
            const res = await getAuthUrl();
            window.location.href = res.data.url;
        } catch (e) {
            alert("Erro ao iniciar conexão com Google. Certifique-se de que o Client ID/Secret estão salvos.");
            setShowGoogleConfig(true);
        }
    };

    const handleSaveGoogleConfig = async (e) => {
        e.preventDefault();
        try {
            const { saveGoogleConfig } = await import('../services/api');
            const res = await saveGoogleConfig(googleConfig);
            alert(res.data.message || "Configurações do Google salvas e VALIDADAS com sucesso!");
            setShowGoogleConfig(false);
            loadData();
        } catch (e) {
            console.error(e);
            const errorMsg = e.response?.data?.detail || "Erro ao validar configurações. Verifique o Client ID e Secret.";
            alert(errorMsg);
        }
    };

    const handleDayClick = (value) => {
        setDate(value);
        setShowDayModal(true);
    };

    const handleCustomerChange = async (cid) => {
        setNewAppt({ ...newAppt, customer_id: cid, plan_id: '' });
        if (cid) {
            try {
                const res = await getCustomerPlans(cid);
                setCustomerPlans(res.data);
            } catch (e) {
                console.error("Erro ao buscar planos do cliente", e);
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

        const tempId = 'temp_' + Date.now();
        const selectedCustomer = customers.find(c => c.id === newAppt.customer_id);
        const appointmentDateObj = new Date(newAppt.appointment_date);
        const optimisticAppt = {
            id: tempId,
            title: newAppt.title,
            description: newAppt.description,
            start_time: appointmentDateObj.toISOString(),
            end_time: new Date(appointmentDateObj.getTime() + (newAppt.service_duration_minutes * 60000)).toISOString(),
            service_duration_minutes: newAppt.service_duration_minutes,
            service_value: newAppt.service_value,
            customer_name: selectedCustomer ? selectedCustomer.name : 'Cliente',
            professional_name: professionals.find(p => p.id === newAppt.professional_id)?.name || 'Profissional',
            status: 'scheduled',
            location: newAppt.location,
            link_reuniao: newAppt.link_reuniao,
            billing_status: newAppt.plan_id ? 'covered_by_plan' : 'open'
        };

        setAppointments(prev => [...prev, optimisticAppt]);
        setShowModal(false);

        try {
            await createAppointment({
                ...newAppt,
                appointment_date: appointmentDateObj.toISOString(),
                start_time: appointmentDateObj.toISOString()
            });
            loadData();
            setNewAppt({
                customer_id: '',
                professional_id: '',
                title: '',
                description: '',
                appointment_date: (() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                    return now.toISOString().slice(0, 16);
                })(),
                location: '',
                link_reuniao: '',
                service_id: '',
                service_duration_minutes: 30,
                service_value: 0.0,
                plan_id: ''
            });
        } catch (e) {
            setAppointments(prev => prev.filter(a => a.id !== tempId));
            const msg = e.response?.data?.detail || "Erro ao agendar";
            alert(msg);
            setShowModal(true);
        }
    };

    const handleComplete = async (id) => {
        try {
            await completeAppointment(id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Erro ao finalizar agendamento");
        }
    };

    const dayAppointments = appointments
        .filter(a => {
            const apptDate = a.start_time || a.appointment_date;
            return apptDate && new Date(apptDate).toDateString() === date.toDateString();
        })
        .sort((a, b) => {
            const timeA = new Date(a.start_time || a.appointment_date).getTime();
            const timeB = new Date(b.start_time || b.appointment_date).getTime();
            return timeA - timeB;
        });

    const isPastAppointment = (appt) => {
        const apptTime = new Date(appt.start_time || appt.appointment_date);
        return apptTime < new Date();
    };

    // Helper to get YYYY-MM-DD for comparison (Timezone Safe)
    const getISODate = (d) => {
        if (!d) return null;
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return null;
        return dateObj.toISOString().split('T')[0];
    };

    const targetDateStr = getISODate(date);

    const getWeekDays = (currentDate) => {
        const days = [];
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day; // Adjust to Sunday
        const startOfWeek = new Date(d.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(startOfWeek);
            nextDay.setDate(startOfWeek.getDate() + i);
            days.push(nextDay);
        }
        return days;
    };

    const weekDays = getWeekDays(date);
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

    const getApptPosition = (startTime, duration) => {
        const dateObj = new Date(startTime);
        const startHour = dateObj.getHours();
        const startMinutes = dateObj.getMinutes();

        // 1 hour = 60px. Baseline is 08:00
        const top = ((startHour - 8) * 60) + startMinutes;
        const height = duration || 60; // default 1h
        return { top, height };
    };

    const handlePrevWeek = () => {
        const d = new Date(date);
        d.setDate(d.getDate() - 7);
        setDate(d);
    };

    const handleNextWeek = () => {
        const d = new Date(date);
        d.setDate(d.getDate() + 7);
        setDate(d);
    };

    const togglePro = (id) => {
        if (selectedPros.includes(id)) {
            setSelectedPros(selectedPros.filter(p => p !== id));
        } else {
            setSelectedPros([...selectedPros, id]);
        }
    };

    const toggleAllPros = () => {
        if (selectedPros.length === professionals.length) {
            setSelectedPros([]);
        } else {
            setSelectedPros(professionals.map(p => p.id));
        }
    };

    const visibleProfessionals = professionals.filter(p => selectedPros.includes(p.id));

    return (
        <div className="tenant-page-container custom-calendar-root" style={{ padding: '0', margin: '0', maxWidth: '100%', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <style>
                {`
                .custom-calendar-root {
                    padding: 1.5rem !important;
                }
                .calendar-wrapper { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: var(--navy-900); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .calendar-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 1rem; flex-wrap: wrap; }
                .cal-header-nav-group { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
                .cal-actions-group { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; flex-grow: 1; justify-content: flex-end; }
                .pro-tabs { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.25rem; scrollbar-width: none; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
                .pro-tabs::-webkit-scrollbar { display: none; }
                
                .btn-nav-week { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid rgba(212,175,55,0.4); background: rgba(212,175,55,0.05); color: var(--gold-500); cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
                .btn-nav-week:hover { background: var(--gold-500); color: #000; transform: scale(1.05); }
                
                .cal-action-buttons-group { display: flex; gap: 0.75rem; flex-shrink: 0; }

                .calendar-week-strip { display: flex; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); overflow-x: auto; scrollbar-width: none; gap: 0.5rem; }
                .week-strip-day { flex: 1; min-width: 45px; display: flex; flexDirection: column; align-items: center; justify-content: center; gap: 4px; border-radius: 12px; transition: all 0.2s ease; cursor: pointer; padding: 0.75rem 0.5rem; }
                .week-strip-day.active { background: var(--gold-500); color: #000; font-weight: 800; transform: scale(1.05); }
                
                .calendar-grid-container { flex: 1; display: flex; overflow-y: auto; background: var(--navy-950); position: relative; }
                .time-axis { width: 60px; flex-shrink: 0; border-right: 1px solid rgba(255,255,255,0.05); background: var(--navy-900); }
                .unified-grid-area { flex: 1; position: relative; min-width: 300px; }
                
                @media (max-width: 900px) {
                    .custom-calendar-root {
                        padding: 0.5rem !important;
                        height: calc(100vh - 75px) !important;
                    }
                    .calendar-header { 
                        flex-direction: column; 
                        align-items: center; 
                        gap: 1.25rem; 
                        padding: 1rem 0.5rem 0.5rem 0.5rem; 
                        background: transparent;
                        border: none;
                    }
                    
                    /* Cabeçalho de Navegação Mobile Fiel ao Print */
                    .cal-header-nav-group { 
                        width: 100%; 
                        justify-content: center; 
                        gap: 1.5rem;
                        background: transparent;
                        padding: 0;
                        border: none;
                        display: flex;
                        align-items: center;
                    }
                    
                    .btn-nav-week { 
                        width: 44px !important; 
                        height: 44px !important; 
                        border-radius: 50% !important; 
                        border: 1px solid var(--gold-500) !important; 
                        background: rgba(212,175,55,0.05) !important; 
                        color: var(--gold-500) !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .mobile-date-label {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2px;
                    }
                    .mobile-date-label .month-text {
                        font-family: 'Inter', sans-serif;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #fff;
                        text-transform: lowercase; /* Como no print: março de 2026 */
                    }
                    .mobile-date-label .week-range {
                        font-size: 1rem;
                        color: #fff;
                        font-weight: 500;
                    }

                    .cal-actions-group { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
                    .pro-tabs { width: 100%; padding: 0.25rem; border: none; flex-wrap: nowrap; overflow-x: auto; justify-content: flex-start; }
                    .cal-action-buttons-group { width: 100%; display: flex; gap: 0.5rem; }
                    .cal-action-buttons-group > button { flex: 1; justify-content: center; }
                    /* Make the text visible inside the buttons on mobile */
                    .responsive-btn-text { display: inline-block !important; font-size: 0.8rem; }

                    .calendar-week-strip {
                        padding: 0.5rem 0.25rem;
                        gap: 0.25rem;
                        border-top: 1px solid rgba(255,255,255,0.05);
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        overflow-x: hidden;
                    }
                    
                    .week-strip-day {
                        min-width: 0;
                        padding: 0.5rem 0.25rem;
                    }

                    .calendar-grid-container {
                        padding-bottom: 100px; /* garante espaço para a navbar inferior */
                        overflow-x: hidden;
                    }
                    
                    .unified-grid-area {
                        min-width: 0 !important; /* avoid horizontal scroll */
                        width: 100%;
                    }
                    
                    .time-axis {
                        width: 45px;
                    }
                }
                `}
            </style>

            <div className="calendar-wrapper">
                {/* CALENDAR HEADER */}
                <div className="calendar-header">
                    <div className="cal-header-nav-group">
                        <button className="btn-nav-week" onClick={handlePrevWeek}>
                            <ChevronLeft size={24} />
                        </button>

                        <div onClick={() => setShowDatePicker(!showDatePicker)} className="mobile-date-label" style={{ cursor: 'pointer' }}>
                            <div className="month-text">
                                {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="week-range">
                                {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit' })} a {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>

                            {showDatePicker && (
                                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'var(--navy-900)', border: '1px solid var(--gold-500)', padding: '0.75rem', borderRadius: '12px', marginTop: '0.5rem' }}>
                                    <input type="date" className="input-premium" value={date.toISOString().split('T')[0]} onChange={(e) => { setDate(new Date(e.target.value + 'T12:00:00')); setShowDatePicker(false); }} />
                                </div>
                            )}
                        </div>

                        <button className="btn-nav-week" onClick={handleNextWeek}>
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="cal-actions-group">
                        <div className="pro-tabs">
                            <button
                                className={`btn-tab-luxury ${selectedPros.length === professionals.length ? 'active' : ''}`}
                                onClick={toggleAllPros}
                                style={{
                                    whiteSpace: 'nowrap',
                                    padding: '0.4rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--gold-500)',
                                    background: selectedPros.length === professionals.length ? 'var(--gold-500)' : 'transparent',
                                    color: selectedPros.length === professionals.length ? '#000' : 'var(--gold-500)',
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    cursor: 'pointer'
                                }}
                            >
                                {selectedPros.length === professionals.length ? 'LIMPAR' : 'TODOS'}
                            </button>
                            {professionals.map(pro => {
                                const isSelected = selectedPros.includes(pro.id);
                                return (
                                    <button
                                        key={pro.id}
                                        onClick={() => togglePro(pro.id)}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '0.4rem 1rem',
                                            borderRadius: '10px',
                                            background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '1px solid var(--gold-500)' : '1px solid rgba(255,255,255,0.05)',
                                            color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: isSelected ? 'var(--gold-500)' : 'currentColor' }}></div>
                                        {pro.name.split(' ')[0].toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="cal-action-buttons-group">
                            {connectionInfo.connected ? (
                                <button className="btn-secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }} disabled title="Google Conectado">
                                    <CheckCircle2 size={16} color="var(--success)" />
                                    <span className="responsive-btn-text">Conectado</span>
                                </button>
                            ) : (
                                <button className="btn-secondary" style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowGoogleConfig(true)}>
                                    <CalendarIcon size={16} />
                                    <span className="responsive-btn-text">Vincular</span>
                                </button>
                            )}

                            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                <Plus size={16} />
                                <span className="responsive-btn-text">Agendar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* WEEK STRIP */}
                <div className="calendar-week-strip">
                    {weekDays.map((d, i) => {
                        const isActive = getISODate(d) === targetDateStr;
                        const names = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                        return (
                            <div
                                key={i}
                                className={`week-strip-day ${isActive ? 'active' : ''}`}
                                onClick={() => setDate(d)}
                            >
                                <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{names[d.getDay()]}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{d.getDate()}</span>
                            </div>
                        );
                    })}
                </div>

                {/* GRID CONTAINER */}
                <div className="calendar-grid-container">
                    {/* TIME AXIS */}
                    <div className="time-axis">
                        {hours.map(h => (
                            <div key={h} style={{ height: '60px', padding: '10px 5px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                {h.toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* UNIFIED APPOINTMENTS AREA */}
                    <div className="unified-grid-area" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hour = Math.floor(y / 60) + 8;
                        const mins = Math.floor((y % 60));
                        const selectedDate = new Date(date);
                        selectedDate.setHours(hour, mins, 0, 0);
                        setNewAppt({ ...newAppt, appointment_date: selectedDate.toISOString().slice(0, 16) });
                        setShowModal(true);
                    }}>
                        {/* Background Hour Lines */}
                        {hours.map(h => (
                            <div key={h} style={{ position: 'absolute', top: `${(h - 8) * 60}px`, left: 0, right: 0, height: '60px', borderBottom: '1px solid rgba(255,255,255,0.03)', pointerEvents: 'none' }}></div>
                        ))}

                        {/* Half-hour Lines (Subtle) */}
                        {/* {hours.map(h => (
                            <div key={`half-${h}`} style={{ position: 'absolute', top: `${(h - 8) * 60 + 50}px`, left: 0, right: 0, height: '1px', borderTop: '1px dashed rgba(255,255,255,0.02)' }}></div>
                        ))} */}

                        {/* All Appointments for the selected day/professionals */}
                        {appointments
                            .filter(a => selectedPros.includes(a.professional_id))
                            .filter(a => getISODate(a.start_time || a.appointment_date) === targetDateStr)
                            .map((appt, idx) => {
                                const { top, height } = getApptPosition(appt.start_time || appt.appointment_date, appt.service_duration_minutes || 30);
                                const proIdx = professionals.findIndex(p => p.id === appt.professional_id || p.name === appt.professional_name) % 5;
                                const isPast = isPastAppointment(appt);

                                return (
                                    <div
                                        key={appt.id}
                                        className={`appointment-block pro-bg-${proIdx}`}
                                        style={{
                                            position: 'absolute',
                                            top: `${top}px`,
                                            maxHeight: '100%',
                                            height: `${height}px`,
                                            left: '4px',
                                            right: '4px',
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            zIndex: 10,
                                            opacity: isPast ? 0.6 : 1,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            borderLeft: '4px solid rgba(255,255,255,0.4)',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            overflow: 'hidden'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDate(new Date(appt.start_time || appt.appointment_date));
                                            setShowDayModal(true);
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.customer_name}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.9, background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>
                                                {new Date(appt.start_time || appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                            {appt.professional_name?.split(' ')[0]} • {appt.title}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {showDayModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowDayModal(false) }}>
                    <div className="card modal-content-luxury" style={{ maxWidth: '600px', width: '100%', padding: '0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>{date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                            <button onClick={() => setShowDayModal(false)} className="btn-icon" style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--navy-700)' }}>Compromissos do Dia</h3>
                                <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => { setShowDayModal(false); setShowModal(true); }}>
                                    <Plus size={16} /> Adicionar
                                </button>
                            </div>

                            {dayAppointments.length > 0 ? dayAppointments.map(appt => {
                                const isPast = isPastAppointment(appt);
                                return (
                                    <div
                                        key={appt.id}
                                        style={{
                                            padding: '1.5rem',
                                            background: isPast ? '#f1f5f9' : '#f8fafc',
                                            borderRadius: '16px',
                                            borderLeft: `4px solid ${isPast ? '#94a3b8' : 'var(--gold-500)'}`,
                                            transition: 'var(--transition)',
                                            opacity: isPast ? 0.65 : 1
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <h4 style={{
                                                fontSize: '1rem',
                                                fontWeight: 800,
                                                color: isPast ? '#64748b' : 'var(--navy-900)',
                                                textDecoration: isPast ? 'line-through' : 'none'
                                            }}>
                                                {appt.title} {appt.status === 'completed' && <CheckCircle size={16} color="var(--success)" style={{ display: 'inline', marginLeft: '8px' }} />}
                                            </h4>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                color: isPast ? '#64748b' : 'var(--gold-600)',
                                                background: isPast ? '#e2e8f0' : 'var(--gold-50)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px'
                                            }}>
                                                {new Date(appt.start_time || appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {appt.status !== 'completed' && (
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', background: 'var(--success)', border: 'none' }}
                                                    onClick={() => handleComplete(appt.id)}
                                                >
                                                    Finalizar
                                                </button>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{appt.description || "Sem descrição"}</p>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: isPast ? '#94a3b8' : 'var(--navy-600)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <User size={14} /> {appt.customer_name || 'Cliente'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <User size={14} style={{ color: 'var(--gold-500)' }} /> {appt.professional_name || 'Profissional'}
                                            </div>
                                            {appt.location && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <MapPin size={14} /> {appt.location}
                                                </div>
                                            )}
                                            {appt.link_reuniao && (
                                                <a href={appt.link_reuniao} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold-600)' }}>
                                                    <Video size={14} /> Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    <p>Nenhum compromisso agendado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="card modal-content-luxury" style={{ maxWidth: '650px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Agendar Compromisso</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>TÍTULO DA REUNIÃO</label>
                                <input className="input-premium" placeholder="Ex: Alinhamento de Projeto" value={newAppt.title} onChange={e => setNewAppt({ ...newAppt, title: e.target.value })} required />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>CLIENTE PARTICIPANTE</label>
                                    <select className="input-premium" value={newAppt.customer_id} onChange={e => handleCustomerChange(e.target.value)} required>
                                        <option value="">Escolha um cliente...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>PROFISSIONAL RESPONSÁVEL</label>
                                    <select className="input-premium" value={newAppt.professional_id} onChange={e => setNewAppt({ ...newAppt, professional_id: e.target.value })} required>
                                        <option value="">Escolha um profissional...</option>
                                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>SERVIÇO</label>
                                    <select className="input-premium" value={newAppt.service_id} onChange={e => handleServiceChange(e.target.value)} required>
                                        <option value="">Selecione o serviço...</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>PLANO DO CLIENTE (OPCIONAL)</label>
                                    <select className="input-premium" value={newAppt.plan_id} onChange={e => setNewAppt({ ...newAppt, plan_id: e.target.value })}>
                                        <option value="">Pagamento Avulso</option>
                                        {customerPlans.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>DURAÇÃO (MIN)</label>
                                    <input className="input-premium" type="number" value={newAppt.service_duration_minutes} readOnly style={{ opacity: 0.7, background: '#f8fafc' }} />
                                </div>
                                <div className="form-group">
                                    <label>VALOR (R$)</label>
                                    <input className="input-premium" type="number" value={newAppt.service_value} readOnly style={{ opacity: 0.7, background: '#f8fafc' }} />
                                </div>
                                <div className="form-group">
                                    <label>DATA E HORÁRIO</label>
                                    <input
                                        className="input-premium"
                                        type="datetime-local"
                                        value={newAppt.appointment_date}
                                        onChange={e => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>LOCAL OU LINK VIRTUAL (OPCIONAL)</label>
                                <input className="input-premium" placeholder="Google Meet, Endereço Físico..." value={newAppt.location} onChange={e => setNewAppt({ ...newAppt, location: e.target.value })} />
                            </div>

                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>VOLTAR</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }}>CONFIRMAR AGENDAMENTO</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {showGoogleConfig && (
                <div className="modal-overlay">
                    <div className="card modal-content-luxury" style={{ maxWidth: '500px', width: '100%', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Configurar Google Agenda</h2>
                            <button onClick={() => setShowGoogleConfig(false)} className="btn-icon" style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveGoogleConfig} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Insira suas credenciais da API do Google para sincronizar sua agenda.
                                Você pode encontrá-las no <a href="https://console.developers.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-600)', textDecoration: 'underline' }}>Google Cloud Console</a>.
                            </p>
                            <div className="form-group">
                                <label>Client ID</label>
                                <input className="input-premium" placeholder="Seu Client ID do Google" value={googleConfig.client_id} onChange={e => setGoogleConfig({ ...googleConfig, client_id: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Client Secret</label>
                                <input className="input-premium" type="password" placeholder="Seu Client Secret do Google" value={googleConfig.client_secret} onChange={e => setGoogleConfig({ ...googleConfig, client_secret: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Redirect URI</label>
                                <input className="input-premium" value={googleConfig.redirect_uri} readOnly />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Copie esta URI e adicione-a como "URI de redirecionamento autorizada" no Google Cloud Console.
                                </p>
                            </div>
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowGoogleConfig(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }}><CheckCircle2 size={18} /> Salvar Configurações</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AppointmentsCalendar;
