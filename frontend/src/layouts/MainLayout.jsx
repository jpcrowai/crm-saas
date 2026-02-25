import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, LayoutDashboard, Briefcase, Calendar as CalendarIcon, DollarSign, Settings, Activity, Package, Building, Layers, FileText, Users } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null) // Controls the 'floating' sub-menu
  const { user } = useAuth()
  const location = useLocation()

  // Check if payment is overdue (for tenant users only)
  const isOverdue = user?.payment_status === 'overdue'
  const daysUntilShutdown = 7 // Configurable: days until environment is disabled

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        background: 'var(--navy-900)',
      }}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--navy-900)',
            color: 'white',
            border: '1px solid var(--gold-500)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'white',
            },
          },
        }}
      />

      <main
        style={{
          flex: 1,
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--navy-950)',
          color: 'var(--white)',
          overflowY: 'auto',
        }}
      >
        {/* Payment Warning Banner */}
        {isOverdue && (
          <div style={{
            background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
          }}>
            <AlertTriangle size={20} />
            <span>
              ⚠️ <strong>Atenção!</strong> Seu pagamento está em atraso.
              Regularize em até <strong>{daysUntilShutdown} dias</strong> para evitar a desativação do seu ambiente.
            </span>
            <a
              href="mailto:suporte@seucrm.com?subject=Pagamento%20em%20Atraso"
              style={{
                marginLeft: 'auto',
                padding: '0.4rem 1rem',
                background: 'white',
                color: '#dc2626',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              Falar com Suporte
            </a>
          </div>
        )}

        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      {(user?.role_global !== 'master' || user?.tenant_slug) && (window.innerWidth <= 768) && (
        <>
          {/* FLOATING SUB-MENU (ACTION SHEET) */}
          {activeGroup && (
            <div
              className="mobile-action-sheet"
              onClick={() => setActiveGroup(null)}
              style={{
                position: 'fixed',
                bottom: '65px',
                left: 0,
                right: 0,
                top: 0,
                background: 'rgba(2, 6, 23, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 999,
                display: 'flex',
                alignItems: 'flex-end'
              }}
            >
              <div
                className="action-sheet-content"
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'var(--navy-800)',
                  borderTop: '2px solid var(--gold-500)',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  animation: 'slideUp 0.3s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {activeGroup === 'leads' ? 'Vendas & CRM' :
                      activeGroup === 'finance' ? 'Gestão Financeira' :
                        activeGroup === 'services' ? 'Serviços & Catálogo' : 'Configurações'}
                  </span>
                </div>

                {activeGroup === 'leads' && (
                  <>
                    <Link to="/pipeline" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Briefcase size={18} /> <span>Pipeline / Funil</span>
                    </Link>
                    <Link to="/customers" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Briefcase size={18} /> <span>Base de Clientes</span>
                    </Link>
                  </>
                )}

                {activeGroup === 'services' && (
                  <>
                    <Link to="/professionals" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Users size={18} /> <span>Profissionais (Equipe)</span>
                    </Link>
                    <Link to="/suppliers" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Building size={18} /> <span>Fornecedores</span>
                    </Link>
                    <Link to="/products" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Package size={18} /> <span>Catálogo de Produtos</span>
                    </Link>
                    <Link to="/plans" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Layers size={18} /> <span>Gestão de Planos</span>
                    </Link>
                    <Link to="/subscriptions" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <FileText size={18} /> <span>Assinaturas Ativas</span>
                    </Link>
                  </>
                )}

                {activeGroup === 'finance' && (
                  <>
                    <Link to="/finances" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <DollarSign size={18} /> <span>Lançamentos (Caixa)</span>
                    </Link>
                    <Link to="/reports" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Activity size={18} /> <span>Relatórios de Performance</span>
                    </Link>
                  </>
                )}

                {activeGroup === 'account' && (
                  <>
                    <Link to="/team" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Settings size={18} /> <span>Equipe & Acessos</span>
                    </Link>
                    <Link to="/profile" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Settings size={18} /> <span>Minha Conta (Perfil)</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          <nav className="mobile-nav">
            <div className="mobile-nav-content">
              <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setActiveGroup(null)}>
                <LayoutDashboard size={20} />
                <span>DASH</span>
              </Link>

              <button
                className={`mobile-nav-item ${activeGroup === 'leads' ? 'active' : ''}`}
                onClick={() => setActiveGroup(activeGroup === 'leads' ? null : 'leads')}
              >
                <Briefcase size={20} />
                <span>VENDAS</span>
              </button>

              <Link to="/calendar" className={`mobile-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`} onClick={() => setActiveGroup(null)}>
                <CalendarIcon size={20} />
                <span>AGENDA</span>
              </Link>

              <button
                className={`mobile-nav-item ${activeGroup === 'services' ? 'active' : ''}`}
                onClick={() => setActiveGroup(activeGroup === 'services' ? null : 'services')}
              >
                <Package size={20} />
                <span>SERVIÇOS</span>
              </button>

              <button
                className={`mobile-nav-item ${activeGroup === 'finance' ? 'active' : ''}`}
                onClick={() => setActiveGroup(activeGroup === 'finance' ? null : 'finance')}
              >
                <DollarSign size={20} />
                <span>FINANC</span>
              </button>

              <button
                className={`mobile-nav-item ${activeGroup === 'account' ? 'active' : ''}`}
                onClick={() => setActiveGroup(activeGroup === 'account' ? null : 'account')}
              >
                <Settings size={20} />
                <span>CONTA</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* For Master on Mobile, simple Nav */}
      {user?.role_global === 'master' && !user?.tenant_slug && (window.innerWidth <= 768) && (
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Briefcase size={20} />
              <span>AMBIENTES</span>
            </Link>
            <Link to="/profile" className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <Settings size={20} />
              <span>MEU PERFIL</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}

export default MainLayout
