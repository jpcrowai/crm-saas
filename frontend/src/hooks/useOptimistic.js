/**
 * useOptimistic — hook para mutations com Optimistic UI.
 *
 * Aplica a mudança na UI antes da requisição terminar.
 * Se falhar, desfaz e exibe toast de erro.
 */
import { useCallback } from 'react';
import { showToast } from '../components/Toast';

export function useOptimistic(mutate) {
    /**
     * @param {Function} optimisticUpdate - função que recebe (prevData) e retorna novo estado
     * @param {Function} apiFn - função async que chama a API
     * @param {Object} options
     * @param {string} options.errorMessage - mensagem de erro customizada
     * @param {string} options.successMessage - mensagem de sucesso (opcional)
     */
    const optimisticMutate = useCallback(async (optimisticUpdate, apiFn, options = {}) => {
        const {
            errorMessage = 'Erro ao realizar operação. Ação revertida.',
            successMessage = null,
        } = options;

        // Captura o estado anterior para rollback
        let previousData;
        mutate(prev => {
            previousData = prev;
            return optimisticUpdate(prev);
        });

        try {
            const result = await apiFn();
            if (successMessage) showToast(successMessage, 'success');
            return result;
        } catch (err) {
            // Rollback para estado anterior
            mutate(() => previousData);
            const detail = err?.response?.data?.detail || err?.message || errorMessage;
            showToast(detail, 'error');
            throw err;
        }
    }, [mutate]);

    return optimisticMutate;
}
