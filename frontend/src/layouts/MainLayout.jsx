import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, LayoutDashboard, Briefcase, Calendar as CalendarIcon, DollarSign, Settings } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
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
        width: '100vw',
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
      {(user?.role_global !== 'master' || user?.tenant_slug) && (
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>DASH</span>
            </Link>
            <Link to="/pipeline" className={`mobile-nav-item ${location.pathname === '/pipeline' ? 'active' : ''}`}>
              <Briefcase size={20} />
              <span>LEADS</span>
            </Link>
            <Link to="/calendar" className={`mobile-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}>
              <CalendarIcon size={20} />
              <span>AGENDA</span>
            </Link>
            <Link to="/finances" className={`mobile-nav-item ${location.pathname === '/finances' ? 'active' : ''}`}>
              <DollarSign size={20} />
              <span>FINANCE</span>
            </Link>
            <Link to="/profile" className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <Settings size={20} />
              <span>CONTA</span>
            </Link>
          </div>
        </nav>
      )}

      {/* For Master on Mobile, simple Nav */}
      {user?.role_global === 'master' && !user?.tenant_slug && (
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
