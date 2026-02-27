/**
 * useDataCache — hook de cache + fetch automático.
 * 
 * - Serve dados do cache instantaneamente (TTL configurável)
 * - Refetch em background ao montar (stale-while-revalidate)
 * - Compartilha cache entre todas as instâncias (memória global)
 */

const CACHE_STORE = new Map(); // Cache global em memória
const SUBSCRIBERS = new Map(); // Listeners por chave

const DEFAULT_TTL_MS = 60_000; // 1 minuto

export function invalidateCache(key) {
    CACHE_STORE.delete(key);
    // Notifica assinantes que o cache foi invalidado
    if (SUBSCRIBERS.has(key)) {
        SUBSCRIBERS.get(key).forEach(cb => cb());
    }
}

export function setCacheData(key, data) {
    CACHE_STORE.set(key, { data, ts: Date.now() });
    if (SUBSCRIBERS.has(key)) {
        SUBSCRIBERS.get(key).forEach(cb => cb());
    }
}

export function getCacheData(key) {
    return CACHE_STORE.get(key)?.data ?? null;
}

import { useState, useEffect, useRef, useCallback } from 'react';

export function useDataCache(key, fetchFn, options = {}) {
    const { ttl = DEFAULT_TTL_MS, enabled = true } = options;

    const [data, setData] = useState(() => getCacheData(key));
    const [loading, setLoading] = useState(!getCacheData(key));
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    const fetch = useCallback(async (silent = false) => {
        if (!enabled || !fetchFn) return;
        if (!silent) setLoading(true);
        try {
            const result = await fetchFn();
            const payload = Array.isArray(result?.data) ? result.data : (result?.data ?? result);
            if (isMounted.current) {
                setCacheData(key, payload);
                setData(payload);
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) setError(err);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [key, fetchFn, enabled]);

    useEffect(() => {
        isMounted.current = true;

        // Subscriber para receber invalidações externas
        if (!SUBSCRIBERS.has(key)) SUBSCRIBERS.set(key, new Set());
        const rerender = () => {
            const cached = getCacheData(key);
            if (isMounted.current) setData(cached);
        };
        SUBSCRIBERS.get(key).add(rerender);

        // Se tiver cache válido, usa e refetch em background (stale-while-revalidate)
        const cached = CACHE_STORE.get(key);
        if (cached && Date.now() - cached.ts < ttl) {
            setData(cached.data);
            setLoading(false);
            fetch(true); // silent background refresh
        } else {
            fetch(false);
        }

        return () => {
            isMounted.current = false;
            SUBSCRIBERS.get(key)?.delete(rerender);
        };
    }, [key]);

    const mutate = useCallback((updater) => {
        setData(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            setCacheData(key, next);
            return next;
        });
    }, [key]);

    return { data: data ?? [], loading, error, refetch: fetch, mutate };
}
