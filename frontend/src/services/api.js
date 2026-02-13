import axios from 'axios';
// API Service for CRM SaaS

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginMaster = (email, password) => {
  return api.post('/auth/login-master', { email, password });
};

export const getMasterAmbientes = () => {
  return api.get('/master/ambientes');
};

export const createAmbiente = (data) => {
  return api.post('/master/ambientes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const selectTenant = (tenant_slug) => {
  return api.post('/auth/select-tenant', { tenant_slug });
};

export const loginTenant = (email, password, tenant_slug) => {
  return api.post('/auth/login-tenant', { email, password, tenant_slug });
};

export const getTenantUsers = () => {
  return api.get('/tenant/users');
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const updateAmbiente = (slug, data) => {
  return api.put(`/master/ambientes/${slug}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Lead Sub-resources
export const getLeadHistory = (leadId) => {
  return api.get(`/tenant/leads/${leadId}/history`);
};

export const addLeadHistory = (leadId, data) => {
  return api.post(`/tenant/leads/${leadId}/history`, data);
};

export const getLeadTasks = (leadId) => {
  return api.get(`/tenant/leads/${leadId}/tasks`);
};

export const createLeadTask = (leadId, data) => {
  return api.post(`/tenant/leads/${leadId}/tasks`, data);
};

export const updateTask = (taskId, data) => {
  return api.put(`/tenant/tasks/${taskId}`, data);
};

export const importLeads = (formData) => {
  return api.post('/tenant/leads/import-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getTenantStats = () => {
  return api.get('/tenant/stats');
};

export const getLeads = () => {
  return api.get('/tenant/leads');
};

export const createLead = (data) => {
  return api.post('/tenant/leads', data);
};

export const getCustomers = () => {
  return api.get('/tenant/customers');
};

export const createCustomer = (data) => {
  return api.post('/tenant/customers', data);
};

export const deleteCustomer = (id) => {
  return api.delete(`/tenant/customers/${id}`);
};

export const exitTenant = () => {
  return api.post('/auth/exit-tenant');
};

export const getTenantAdminStats = () => {
  return api.get('/tenant/admin-stats');
};

export const changePassword = (data) => {
  return api.post('/auth/change-password', data);
};

export const updateLead = (id, data) => {
  return api.put(`/tenant/leads/${id}`, data);
};

export const deleteLead = (id) => {
  return api.delete(`/tenant/leads/${id}`);
};

export const getReports = (params = {}) => {
  return api.get('/tenant/reports', { params });
};

export const getFinancialCustomerReport = (params = {}) => {
  return api.get('/tenant/financial-reports/customers', { params });
};

export const getFinancialSupplierReport = (params = {}) => {
  return api.get('/tenant/financial-reports/suppliers', { params });
};

export const getFinancialCashFlowReport = (params = {}) => {
  return api.get('/tenant/financial-reports/cash-flow', { params });
};

export const getFinancialPnLReport = (params = {}) => {
  return api.get('/tenant/financial-reports/pnl', { params });
};

export const getFinancialAgingReport = () => {
  return api.get('/tenant/financial-reports/aging');
};

export const getNiches = () => {
  return api.get('/niches/');
};

export const createNiche = (data) => {
  return api.post('/niches/', data);
};

export const getTeam = () => {
  return api.get('/tenant/users');
};

export const createTeamMember = (data) => {
  return api.post('/tenant/users', data);
};

export const updateTeamMember = (id, data) => {
  return api.put(`/tenant/users/${id}`, data);
};

export const deleteTeamMember = (id) => {
  return api.delete(`/tenant/users/${id}`);
};

export const inviteMember = createTeamMember; // Keep as alias

export const getAppointments = () => {
  return api.get('/tenant/appointments/');
};

export const createAppointment = (data) => {
  return api.post('/tenant/appointments/', data);
};

export const updateAppointment = (id, data) => {
  return api.put(`/tenant/appointments/${id}`, data);
};

export const getRevenueChart = () => {
  return api.get('/tenant/revenue-chart');
};

export const getNicheConfig = () => {
  return api.get('/tenant/niche-config');
};

// Master Module
export const getMasterEnvironmentContract = (slug) => api.get(`/master/ambientes/${slug}/contract`, { responseType: 'blob' });

// Delete Ambiente
export const deleteAmbiente = (slug) => {
  return api.delete(`/master/ambientes/${slug}`);
};

// Finance Module
export const getFinances = () => {
  return api.get('/tenant/finances');
};

export const getFinanceEntries = getFinances; // Alias for FinanceExtrato.jsx

export const createFinance = (data) => {
  return api.post('/tenant/finances', data);
};

export const updateFinanceStatus = (id, payload) => {
  return api.put(`/tenant/finances/${id}`, payload);
};

export const updateFinanceEntryStatus = (id, status) => {
  return api.put(`/tenant/finances/${id}`, { status });
};

export const deleteFinance = (id) => {
  return api.delete(`/tenant/finances/${id}`);
};

export const deleteFinanceEntry = deleteFinance; // Alias for FinanceExtrato.jsx
export const exportFinanceEntries = () => api.get('/tenant/export', { responseType: 'blob' });

export const getCategories = () => {
  return api.get('/tenant/categories');
};

export const createCategory = (data) => {
  return api.post('/tenant/categories', data);
};

export const updateCategory = (id, data) => {
  return api.put(`/tenant/categories/${id}`, data);
};

export const deleteCategory = (id) => {
  return api.delete(`/tenant/categories/${id}`);
};

export const getPaymentMethods = () => {
  return api.get('/tenant/payment-methods');
};

export const createPaymentMethod = (data) => {
  return api.post('/tenant/payment-methods', data);
};

export const updatePaymentMethod = (id, data) => {
  return api.put(`/tenant/payment-methods/${id}`, data);
};

export const deletePaymentMethod = (id) => {
  return api.delete(`/tenant/payment-methods/${id}`);
};

export const getCashFlowReport = () => {
  return api.get('/tenant/reports/cashflow');
};

export const getCustomerRanking = () => {
  return api.get('/tenant/reports/ranking-customers');
};

export const importFinances = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/tenant/finances/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const downloadFinanceTemplate = () => {
  return api.get('/tenant/finances/template', { responseType: 'blob' });
};

// Product Module
export const getProducts = () => {
  return api.get('/tenant/products');
};

export const getItems = getProducts; // Alias for ProductCatalog.jsx

export const createProduct = (data) => {
  return api.post('/tenant/products', data);
};

export const createItem = createProduct; // Alias for ProductCatalog.jsx

export const updateProduct = (id, data) => {
  return api.put(`/tenant/products/${id}`, data);
};

export const updateItem = updateProduct; // Alias for ProductCatalog.jsx

export const deleteProduct = (id) => {
  return api.delete(`/tenant/products/${id}`);
};

export const deleteItem = deleteProduct; // Alias for ProductCatalog.jsx

export const downloadProductTemplate = () => {
  return api.get('/tenant/products/template', { responseType: 'blob' });
};

export const exportItems = downloadProductTemplate; // Alias for ProductCatalog.jsx

export const importProductsExcel = (formData) => {
  return api.post('/tenant/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const importItems = importProductsExcel; // Alias for ProductCatalog.jsx

// Subscription Module
export const getPlans = () => api.get('/tenant/plans');
export const createPlan = (data) => api.post('/tenant/plans', data);
export const updatePlan = (id, data) => api.put(`/tenant/plans/${id}`, data);
export const getSubscriptions = () => api.get('/tenant/subscriptions');
export const createSubscription = (data) => api.post('/tenant/subscriptions', data);
export const updateSubscriptionStatus = (id, status) => api.put(`/tenant/subscriptions/${id}`, { status });
export const uploadSubscriptionContract = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/tenant/subscriptions/${id}/upload_signed_contract`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const signSubscription = (id) => api.put(`/tenant/subscriptions/${id}/sign`);
export const downloadContract = (id) => api.get(`/tenant/subscriptions/${id}/contract`, { responseType: 'blob' });
export const saveGoogleConfig = (data) => api.post('/tenant/appointments/config', data);
export const getAuthUrl = () => api.get('/tenant/appointments/auth-url');
export const googleCallback = (data) => api.post('/tenant/appointments/callback', data);
export const getCalendarInfo = () => api.get('/tenant/appointments/calendar-info');
export const getCustomerPlans = (customerId) => api.get(`/tenant/appointments/customer-plans/${customerId}`);
export const getServices = () => api.get('/tenant/services/');

// Professional Module
export const getProfessionals = () => api.get('/tenant/professionals/');
export const getProfessional = (id) => api.get(`/tenant/professionals/${id}`);
export const createProfessional = (data) => api.post('/tenant/professionals/', data);
export const updateProfessional = (id, data) => api.put(`/tenant/professionals/${id}`, data);
export const deleteProfessional = (id) => api.delete(`/tenant/professionals/${id}`);

// Supplier Module
export const getSuppliers = () => api.get('/tenant/suppliers/');
export const getSupplier = (id) => api.get(`/tenant/suppliers/${id}`);
export const getSupplierDebts = (id) => api.get(`/tenant/suppliers/${id}/debts`);
export const createSupplier = (data) => api.post('/tenant/suppliers/', data);
export const updateSupplier = (id, data) => api.put(`/tenant/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/tenant/suppliers/${id}`);

export const savePipelineStages = (stages) => api.post('/tenant/pipeline-stages', { stages });


export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export default api;
