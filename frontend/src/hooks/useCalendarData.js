import { useState, useCallback } from 'react';
import {
    getAppointments,
    getCustomers,
    getCalendarInfo,
    getServices,
    getProfessionals,
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

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
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
            setServices(servRes.data);

            if (infoRes.data.connected) {
                localStorage.setItem('google_connected', 'true');
            } else {
                localStorage.removeItem('google_connected');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const addAppointment = async (apptData) => {
        const res = await createAppointment(apptData);
        await loadData();
        return res;
    };

    const finishAppointment = async (id) => {
        await completeAppointment(id);
        await loadData();
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
