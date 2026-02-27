import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, LayoutDashboard, Briefcase, Calendar as CalendarIcon, DollarSign, Settings, Activity, Package, Building, Layers, FileText, Users } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeNavItem, setActiveNavItem] = useState(null)
  const { user } = useAuth()
  const location = useLocation()

  // Sync active nav item with current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveNavItem('dash');
    else if (path === '/calendar') setActiveNavItem('agenda');
    else if (['/pipeline', '/customers'].includes(path)) setActiveNavItem('leads');
    else if (['/professionals', '/commissions', '/suppliers'].includes(path)) setActiveNavItem('equipe');
    else if (['/products', '/plans', '/subscriptions'].includes(path)) setActiveNavItem('produtos');
    else if (['/finances', '/reports'].includes(path)) setActiveNavItem('finance');
    else if (['/team', '/profile'].includes(path)) setActiveNavItem('conta');
    else setActiveNavItem(null);
    setActiveGroup(null);
  }, [location.pathname]);

  const handleGroupNav = (groupId) => {
    if (activeNavItem === groupId && activeGroup === groupId) {
      setActiveGroup(null);
      setActiveNavItem(null);
    } else {
      setActiveNavItem(groupId);
      setActiveGroup(groupId);
    }
  };

  const handleLinkNav = (navId) => {
    setActiveNavItem(navId);
    setActiveGroup(null);
  };

  // Check if payment is overdue (for tenant users only)
  const isOverdue = user?.payment_status === 'overdue'
  const daysUntilShutdown = 7

  return (
    <div
      className="app-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--navy-950)',
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
        className="main-content"
        style={{
          flex: 1,
          background: 'var(--navy-950)',
          color: 'var(--white)',
          position: 'relative'
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
                    {activeGroup === 'leads' ? 'Vendas / CRM' :
                      activeGroup === 'equipe' ? 'Equipe & Operações' :
                        activeGroup === 'produtos' ? 'Produtos & Assinaturas' :
                          activeGroup === 'finance' ? 'Gestão Financeira' : 'Configurações'}
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

                {activeGroup === 'equipe' && (
                  <>
                    <Link to="/professionals" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Users size={18} /> <span>Profissionais</span>
                    </Link>
                    <Link to="/commissions" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <DollarSign size={18} /> <span>Comissões</span>
                    </Link>
                    <Link to="/suppliers" className="action-sheet-item" onClick={() => setActiveGroup(null)}>
                      <Building size={18} /> <span>Fornecedores</span>
                    </Link>
                  </>
                )}

                {activeGroup === 'produtos' && (
                  <>
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

              {/* Dashboard */}
              <Link
                to="/"
                className={`mobile-nav-item ${activeNavItem === 'dash' ? 'active' : ''}`}
                onClick={() => handleLinkNav('dash')}
              >
                <LayoutDashboard size={24} />
              </Link>

              {/* Vendas */}
              <button
                className={`mobile-nav-item ${activeNavItem === 'leads' ? 'active' : ''}`}
                onClick={() => handleGroupNav('leads')}
              >
                <Briefcase size={24} />
              </button>

              {/* Agenda */}
              <Link
                to="/calendar"
                className={`mobile-nav-item ${activeNavItem === 'agenda' ? 'active' : ''}`}
                onClick={() => handleLinkNav('agenda')}
              >
                <CalendarIcon size={24} />
              </Link>

              {/* Equipe */}
              <button
                className={`mobile-nav-item ${activeNavItem === 'equipe' ? 'active' : ''}`}
                onClick={() => handleGroupNav('equipe')}
              >
                <Users size={24} />
              </button>

              {/* Produtos */}
              <button
                className={`mobile-nav-item ${activeNavItem === 'produtos' ? 'active' : ''}`}
                onClick={() => handleGroupNav('produtos')}
              >
                <Package size={24} />
              </button>

              {/* Financeiro */}
              <button
                className={`mobile-nav-item ${activeNavItem === 'finance' ? 'active' : ''}`}
                onClick={() => handleGroupNav('finance')}
              >
                <DollarSign size={24} />
              </button>

              {/* Conta - Direct Link */}
              <Link
                to="/profile"
                className={`mobile-nav-item ${activeNavItem === 'conta' ? 'active' : ''}`}
                onClick={() => handleLinkNav('conta')}
              >
                <Settings size={24} />
              </Link>

            </div>
          </nav>
        </>
      )}

      {/* For Master on Mobile, simple Nav */}
      {user?.role_global === 'master' && !user?.tenant_slug && (window.innerWidth <= 768) && (
        <nav className="mobile-nav">
          <div className="mobile-nav-content">
            <Link to="/" className={`mobile-nav-item ${activeNavItem === 'dash' ? 'active' : ''}`} onClick={() => handleLinkNav('dash')}>
              <span className="nav-icon"><Briefcase size={20} /></span>
              <span className="nav-label">AMBIENTES</span>
            </Link>
            <Link to="/profile" className={`mobile-nav-item ${activeNavItem === 'conta' ? 'active' : ''}`} onClick={() => handleLinkNav('conta')}>
              <span className="nav-icon"><Settings size={20} /></span>
              <span className="nav-label">PERFIL</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}

export default MainLayout
