import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getAppointments, createAppointment, getCustomers, getServices, getCustomerPlans } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, MapPin, Clock, User, XCircle, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
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

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Agenda & Compromissos</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                        <p style={{ margin: 0 }}>Sincronização centralizada para sua produtividade</p>
                        {user.role_global === 'master' && (
                            <button
                                onClick={() => setShowGoogleConfig(true)}
                                style={{ fontSize: '0.7rem', background: 'none', border: 'none', color: 'var(--gold-500)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Configurações de API (Master)
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!connectionInfo.connected ? (
                        <button
                            className="btn-primary"
                            onClick={handleConnectGoogle}
                            style={{ background: '#4285F4', border: 'none' }}
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '16px', marginRight: '8px', filter: 'brightness(10)' }} />
                            Vincular com Conta Google
                        </button>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0 1rem',
                            background: 'rgba(5, 150, 105, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid #10b981'
                        }}>
                            <CheckCircle2 size={18} color="#059669" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>Google Conectado</span>
                        </div>
                    )}
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Novo Agendamento
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: 'calc(100vh - 160px)' }}>
                <div className="data-card-luxury" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="data-card-header" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)' }}>Visão Geral do Mês</h3>
                    </div>
                    <div style={{ padding: '2rem', flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <Calendar
                            onChange={handleDayClick}
                            value={date}
                            className="luxury-calendar-override big-calendar"
                            tileClassName={({ date: tileDate }) => {
                                const hasAppt = appointments.some(a => {
                                    const apptDate = a.start_time || a.appointment_date;
                                    return apptDate && new Date(apptDate).toDateString() === tileDate.toDateString();
                                });
                                return hasAppt ? 'has-appointment' : null;
                            }}
                        />
                    </div>
                </div>
            </div>

            {showDayModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowDayModal(false) }}>
                    <div className="card" style={{ width: '600px', padding: '0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                                                {appt.title}
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
                    <div className="card" style={{ width: '650px', padding: '0', overflow: 'hidden' }}>
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
                    <div className="card" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
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

            <style>{`
                .luxury-calendar-override {
                    width: 100% !important;
                    height: 100% !important;
                    border: none !important;
                    font-family: 'Outfit', sans-serif !important;
                    display: flex;
                    flex-direction: column;
                }
                .react-calendar__viewContainer {
                    flex: 1;
                }
                .react-calendar__month-view {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .react-calendar__month-view__days {
                    flex: 1 !important;
                    height: 100% !important;
                }
                .react-calendar__tile {
                    height: auto !important;
                    min-height: 80px !important;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                    padding-top: 10px !important;
                    font-size: 1.1rem !important;
                }
                .react-calendar__tile--active {
                    background: var(--navy-900) !important;
                    color: white !important;
                    border-radius: 12px !important;
                }
                .react-calendar__tile--now {
                    background: var(--gold-50) !important;
                    color: var(--gold-600) !important;
                    border-radius: 12px !important;
                    font-weight: 800 !important;
                }
                .react-calendar__tile:hover {
                    background: #f1f5f9 !important;
                    border-radius: 12px !important;
                    transform: translateY(-2px);
                    transition: all 0.2s ease;
                }
                .react-calendar__tile--active:hover {
                    background: var(--navy-800) !important;
                }
                .has-appointment::after {
                    content: '•';
                    font-size: 1.5rem;
                    color: var(--gold-500);
                    margin-top: -5px;
                }
            `}</style>
        </div>
    );
};

export default AppointmentsCalendar;
