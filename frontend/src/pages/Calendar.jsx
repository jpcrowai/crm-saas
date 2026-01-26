import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getAppointments, createAppointment, getCustomers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Video, MapPin, Clock, User, XCircle, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import '../styles/tenant-luxury.css';

const AppointmentsCalendar = () => {
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newAppt, setNewAppt] = useState({
        customer_id: '',
        title: '',
        description: '',
        appointment_date: new Date().toISOString(),
        location: '',
        link_reuniao: ''
    });

    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [apptRes, custRes] = await Promise.all([getAppointments(), getCustomers()]);
            setAppointments(apptRes.data);
            setCustomers(custRes.data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createAppointment(newAppt);
            setShowModal(false);
            setNewAppt({ customer_id: '', title: '', description: '', appointment_date: new Date().toISOString(), location: '', link_reuniao: '' });
            loadData();
        } catch (e) { alert("Erro ao agendar"); }
    };

    const dayAppointments = appointments.filter(a =>
        new Date(a.appointment_date).toDateString() === date.toDateString()
    );

    return (
        <div className="tenant-page-container">
            <header className="page-header-row">
                <div className="page-title-group">
                    <h1>Agenda & Compromissos</h1>
                    <p>Sincronização centralizada para sua produtividade</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-luxury" style={{ borderRadius: '12px', padding: '0.75rem 1.25rem' }}>
                        <Video size={18} /> Vincular Google Meet
                    </button>
                    <button className="btn-luxury-gold" onClick={() => setShowModal(true)} style={{ borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
                        <Plus size={20} /> Novo Agendamento
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.5fr', gap: '2.5rem' }}>
                {/* CALENDAR CARD */}
                <div className="data-card-luxury" style={{ alignSelf: 'start' }}>
                    <div className="data-card-header" style={{ padding: '1.25rem 1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)' }}>Calendário Interativo</h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <Calendar
                            onChange={setDate}
                            value={date}
                            className="luxury-calendar-override"
                            tileClassName={({ date: tileDate }) => {
                                const hasAppt = appointments.some(a => new Date(a.appointment_date).toDateString() === tileDate.toDateString());
                                return hasAppt ? 'has-appointment' : null;
                            }}
                        />
                    </div>
                </div>

                {/* DAY DETAILS CARD */}
                <div className="data-card-luxury">
                    <div className="data-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={20} color="var(--gold-500)" />
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                Compromissos - {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </h3>
                        </div>
                    </div>
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {dayAppointments.length > 0 ? dayAppointments.map(appt => (
                            <div key={appt.id} style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', borderLeft: '4px solid var(--gold-500)', transition: 'var(--transition)' }} className="list-row-hover">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)' }}>{appt.title}</h4>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-600)', background: 'var(--gold-50)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                        {new Date(appt.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{appt.description}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--navy-700)', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={14} /> {appt.customer_name}
                                    </div>
                                    {appt.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={14} /> {appt.location}
                                        </div>
                                    )}
                                    {appt.link_reuniao && (
                                        <a href={appt.link_reuniao} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-600)' }}>
                                            <Video size={14} /> Link da Reunião
                                        </a>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                                <CalendarIcon size={64} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 600 }}>Agenda livre para este dia.</p>
                                <button className="btn-luxury" style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px' }} onClick={() => setShowModal(true)}>
                                    Criar meu primeiro agendamento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
                        <div className="modal-header-luxury">
                            <h2>Agendar Compromisso</h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><XCircle /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label>Título da Reunião</label>
                                <input className="input-premium" placeholder="Ex: Alinhamento de Projeto" value={newAppt.title} onChange={e => setNewAppt({ ...newAppt, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Cliente Participante</label>
                                <select className="input-premium" value={newAppt.customer_id} onChange={e => setNewAppt({ ...newAppt, customer_id: e.target.value })} required>
                                    <option value="">Escolha um cliente...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Data e Horário</label>
                                <input className="input-premium" type="datetime-local" value={newAppt.appointment_date.slice(0, 16)} onChange={e => setNewAppt({ ...newAppt, appointment_date: new Date(e.target.value).toISOString() })} required />
                            </div>
                            <div className="form-group">
                                <label>Local ou Link Virtual (Opcional)</label>
                                <input className="input-premium" placeholder="Google Meet, Endereço Físico..." value={newAppt.location} onChange={e => setNewAppt({ ...newAppt, location: e.target.value })} />
                            </div>
                            <footer style={{ marginTop: '1rem', display: 'flex', gap: '1.25rem' }}>
                                <button type="button" className="btn-secondary-premium" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Voltar</button>
                                <button type="submit" className="btn-primary-premium" style={{ flex: 2 }}>Confirmar Agendamento</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* INJECT CALENDAR CSS OVERRIDES */}
            <style>{`
                .luxury-calendar-override {
                    width: 100% !important;
                    border: none !important;
                    font-family: 'Outfit', sans-serif !important;
                }
                .react-calendar__tile--active {
                    background: var(--navy-900) !important;
                    color: white !important;
                    border-radius: 8px !important;
                }
                .react-calendar__tile--now {
                    background: var(--gold-50) !important;
                    color: var(--gold-600) !important;
                    border-radius: 8px !important;
                    font-weight: 800 !important;
                }
                .has-appointment::after {
                    content: '';
                    display: block;
                    width: 4px;
                    height: 4px;
                    background: var(--gold-500);
                    border-radius: 50%;
                    margin: 2px auto 0;
                }
            `}</style>
        </div>
    );
};

export default AppointmentsCalendar;
