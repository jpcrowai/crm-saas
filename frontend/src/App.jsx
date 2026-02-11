import { Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard'
import MasterAmbientes from './pages/MasterAmbientes'
import MatcherAmbientes from './pages/MasterAmbientes'
import Profile from './pages/Profile'
import Pipeline from './pages/Pipeline'
import Customers from './pages/Customers'
import Team from './pages/Team'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import FinanceExtrato from './pages/FinanceExtrato'
import ImportLeads from './pages/ImportLeads'
import FinanceSettings from './pages/FinanceSettings'
import ProductCatalog from './pages/ProductCatalog'
import Plans from './pages/Plans'
import Subscriptions from './pages/Subscriptions'
import GoogleCallback from './pages/GoogleCallback'
import Professionals from './pages/Professionals'
import Suppliers from './pages/Suppliers'
import PrivateRoute from './routes/PrivateRoute'
import ModuleRoute from './routes/ModuleRoute'
import { useAuth } from './context/AuthContext'

const RoleBasedHome = () => {
  const { user } = useAuth();
  if (!user) return null;

  // If Master AND NOT inside a specific tenant context -> Show Master View
  if (user.role_global === 'master' && !user.tenant_slug) {
    return <MasterAmbientes />;
  }

  // If Tenant User OR Master inside a Tenant -> Show Dashboard
  return <Dashboard />;
};

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />

      {/* Rotas privadas */}
      <Route element={<MainLayout />}>
        <Route path="/" element={
          <PrivateRoute>
            <RoleBasedHome />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/pipeline" element={
          <PrivateRoute>
            <ModuleRoute module="leads_pipeline">
              <Pipeline />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/customers" element={
          <PrivateRoute>
            <ModuleRoute module="clientes">
              <Customers />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/team" element={
          <PrivateRoute>
            <ModuleRoute module="equipe">
              <Team />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/professionals" element={
          <PrivateRoute>
            <ModuleRoute module="equipe">
              <Professionals />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/suppliers" element={
          <PrivateRoute>
            <ModuleRoute module="equipe">
              <Suppliers />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/calendar" element={
          <PrivateRoute>
            <ModuleRoute module="agenda">
              <Calendar />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/reports" element={
          <PrivateRoute>
            <ModuleRoute module="dashboard">
              <Reports />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/finances" element={
          <PrivateRoute>
            <ModuleRoute module="financeiro">
              <FinanceExtrato />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/import-leads" element={
          <PrivateRoute>
            <ModuleRoute module="leads_pipeline">
              <ImportLeads />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/finances/settings" element={
          <PrivateRoute>
            <ModuleRoute module="financeiro">
              <FinanceSettings />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/products" element={
          <PrivateRoute>
            <ModuleRoute module="produtos">
              <ProductCatalog />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/plans" element={
          <PrivateRoute>
            <ModuleRoute module="assinaturas">
              <Plans />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/subscriptions" element={
          <PrivateRoute>
            <ModuleRoute module="assinaturas">
              <Subscriptions />
            </ModuleRoute>
          </PrivateRoute>
        } />
        <Route path="/google-callback" element={
          <PrivateRoute>
            <GoogleCallback />
          </PrivateRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
