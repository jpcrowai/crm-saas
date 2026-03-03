import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment, getCustomers, getServices, getCustomerPlans, completeAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, MapPin, Clock, User, XCircle, Calendar as CalendarIcon, CheckCircle2, CheckCircle } from 'lucide-react';
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
        const optimisticAppt = {
            id: tempId,
            title: newAppt.title,
            description: newAppt.description,
            start_time: newAppt.appointment_date,
            end_time: new Date(new Date(newAppt.appointment_date).getTime() + (newAppt.service_duration_minutes * 60000)).toISOString(),
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
            await createAppointment(newAppt);
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

    const getWeekDays = (currentDate) => {
        const days = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
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
        const height = duration; // 1 min = 1px
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
        <div className="tenant-page-container" style={{ padding: '1.5rem 2.5rem' }}>
            <div className="calendar-day-view-full">
                {/* CALENDAR TOP BAR */}
                <div className="calendar-top-bar">
                    <div className="calendar-nav-group">
                        <button className="btn-nav-week" onClick={handlePrevWeek}>&lt;</button>

                        <div className="pro-filter-dropdown">
                            <div className="month-selector" onClick={() => setShowDatePicker(!showDatePicker)}>
                                <CalendarIcon size={20} className="pro-color-0" />
                                {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </div>

                            {showDatePicker && (
                                <div className="filter-dropdown-content" style={{ right: 'auto', left: 0, width: 'auto', padding: '0.5rem' }}>
                                    <input
                                        type="date"
                                        className="input-premium"
                                        value={date.toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            setDate(new Date(e.target.value + 'T12:00:00'));
                                            setShowDatePicker(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <button className="btn-nav-week" onClick={handleNextWeek}>&gt;</button>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div className="pro-filter-dropdown">
                            <button className="btn-filter-luxury" onClick={() => setShowProFilter(!showProFilter)}>
                                <User size={18} /> Profissionais ({selectedPros.length})
                            </button>

                            {showProFilter && (
                                <div className="filter-dropdown-content">
                                    <div className="filter-item" onClick={toggleAllPros}>
                                        <input type="checkbox" checked={selectedPros.length === professionals.length} readOnly />
                                        <span style={{ fontWeight: 800 }}>Selecionar Todos</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 0' }}></div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {professionals.map((pro, idx) => (
                                            <div key={pro.id} className="filter-item" onClick={() => togglePro(pro.id)}>
                                                <input type="checkbox" checked={selectedPros.includes(pro.id)} readOnly />
                                                <div className={`pro-color-dot pro-color-${idx % 8}`} style={{ background: 'currentColor' }}></div>
                                                <span>{pro.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.75rem 1.5rem' }}>
                            <Plus size={20} /> Agendar
                        </button>
                    </div>
                </div>

                {/* WEEK STRIP */}
                <div className="calendar-week-strip" style={{ padding: '0.5rem 2.5rem' }}>
                    {weekDays.map((d, i) => {
                        const isActive = d.toDateString() === date.toDateString();
                        const names = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                        return (
                            <div
                                key={i}
                                className={`week-strip-day ${isActive ? 'active' : ''}`}
                                onClick={() => setDate(d)}
                            >
                                <span className="day-name">{names[d.getDay()]}</span>
                                <span className="day-number">{d.getDate()}</span>
                            </div>
                        );
                    })}
                </div>

                {/* GRID CONTAINER */}
                <div className="calendar-grid-container" style={{ flex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* TIME AXIS */}
                    <div className="time-axis" style={{ height: 'fit-content' }}>
                        <div style={{ height: '80px' }}></div> {/* Spacer for Pro Header */}
                        {hours.map(h => (
                            <div key={h} className="time-slot-label">
                                {String(h).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* PROFESSIONAL COLUMNS */}
                    <div className="professional-columns-container">
                        {visibleProfessionals.length === 0 ? (
                            <div style={{ flex: 1, padding: '4rem', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={48} style={{ marginBottom: '1rem' }} />
                                <p>Selecione profissionais para visualizar a agenda.</p>
                            </div>
                        ) : visibleProfessionals.map((pro, idx) => {
                            const proColorIdx = professionals.findIndex(p => p.id === pro.id) % 8;
                            const proAppts = dayAppointments.filter(a =>
                                a.professional_id === pro.id || a.professional_name === pro.name
                            );

                            return (
                                <div key={pro.id} className="pro-column" style={{ minWidth: visibleProfessionals.length > 4 ? '180px' : '220px' }}>
                                    <div className={`pro-column-header pro-color-${proColorIdx} pro-header-colored`}>
                                        {pro.photo_url ? (
                                            <img
                                                src={pro.photo_url.startsWith('http') ? pro.photo_url : `${import.meta.env.VITE_API_URL || ''}${pro.photo_url}`}
                                                className={`pro-avatar pro-avatar-colored pro-color-${proColorIdx}`}
                                                alt=""
                                            />
                                        ) : (
                                            <div className={`pro-avatar pro-avatar-colored pro-color-${proColorIdx}`} style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                                {pro.name.charAt(0)}
                                            </div>
                                        )}
                                        <span className="pro-name">{pro.name.split(' ')[0]}</span>
                                    </div>

                                    <div className="appointments-grid-area" onClick={() => {
                                        setNewAppt({ ...newAppt, professional_id: pro.id });
                                        setShowModal(true);
                                    }}>
                                        {hours.map(h => (
                                            <div key={h} className="grid-hour-line" style={{ top: `${(h - 8) * 60}px` }}></div>
                                        ))}

                                        {proAppts.map(appt => {
                                            const { top, height } = getApptPosition(appt.start_time || appt.appointment_date, appt.service_duration_minutes || 30);
                                            const isPast = isPastAppointment(appt);

                                            return (
                                                <div
                                                    key={appt.id}
                                                    className={`appointment-block pro-bg-${proColorIdx}`}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        opacity: isPast ? 0.6 : 1,
                                                        borderColor: appt.status === 'completed' ? '#10b981' : 'inherit'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDate(new Date(appt.start_time || appt.appointment_date));
                                                        setShowDayModal(true);
                                                    }}
                                                >
                                                    <span className="appt-customer">{appt.customer_name}</span>
                                                    <span className="appt-time">
                                                        {new Date(appt.start_time || appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        {` - ${appt.title}`}
                                                    </span>
                                                </div>
                                            );
                                        })}
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
                            <button onClick={() => setShowDayModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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
                            <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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
                            <button onClick={() => setShowGoogleConfig(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
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
