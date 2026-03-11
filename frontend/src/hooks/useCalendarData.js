import { useState, useCallback, useRef } from 'react';
import {
    getCalendarBundle,
    createAppointment,
    completeAppointment
} from '../services/api';

export const useCalendarData = () => {
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [services, setServices] = useState([]);
    const [connectionInfo, setConnectionInfo] = useState({ connected: false, email: '' });
    const [loading, setLoading] = useState(true);
    const lastFetch = useRef(0);

    const loadData = useCallback(async (force = false) => {
        // Evita múltiplas chamadas redundantes (debounce de 2 segundos)
        const now = Date.now();
        if (!force && now - lastFetch.current < 2000) {
            console.log("--- BUNDLE: Ignorando chamada redundante ---");
            return;
        }
        lastFetch.current = now;

        setLoading(true);
        try {
            console.log("--- BUNDLE: Buscando dados unificados da Agenda ---");
            const res = await getCalendarBundle();
            const { appointments, customers, professionals, services, connectionInfo } = res.data;

            setAppointments(appointments);
            localStorage.setItem('cached_appointments', JSON.stringify(appointments));
            setCustomers(customers);
            setProfessionals(professionals);
            setConnectionInfo(connectionInfo || { connected: false });
            setServices(services);

            if (connectionInfo?.connected) {
                localStorage.setItem('google_connected', 'true');
            } else {
                localStorage.removeItem('google_connected');
            }
        } catch (e) {
            console.error("Erro no Bundle:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    const addAppointment = async (apptData) => {
        const res = await createAppointment(apptData);
        await loadData(true); // Force reload after action
        return res;
    };

    const finishAppointment = async (id) => {
        await completeAppointment(id);
        await loadData(true); // Force reload after action
    };

    return {
        appointments,
        customers,
        professionals,
        services,
        connectionInfo,
        loading,
        loadData,
        addAppointment,
        finishAppointment
    };
};
