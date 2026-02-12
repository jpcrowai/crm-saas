import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ChevronLeft, ChevronRight, LogOut, Briefcase, Users, Calendar as CalendarIcon, DollarSign, Activity, Settings, Package, Layers, FileText, Shield, Building, ChevronDown
} from 'lucide-react';
import '../styles/sidebar.css';
import { useAuth } from '../context/AuthContext';
import { exitTenant, API_URL } from '../services/api';
import logoFull from '../assets/branding/logo_full.png';
import logoIcon from '../assets/branding/logo_icon.png';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReturnToMaster = async (e) => {
    e.preventDefault();
    try {
      const response = await exitTenant();
      login(response.data.access_token);
      navigate('/');
    } catch (error) {
      console.error("Failed to exit tenant", error);
      navigate('/'); // Fallback
    }
  };

  const isMaster = user?.role_global === 'master';
  const inTenantContext = user?.tenant_slug;

  const allMenuItems = isMaster
    ? [
      {
        label: 'Ambientes',
        icon: <Briefcase size={20} />,
        path: '/',
        onClick: inTenantContext ? handleReturnToMaster : undefined
      },
      { label: 'Minha Conta', icon: <Briefcase size={20} />, path: '/profile' }
    ]
    : [
      { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/', module: 'dashboard' },
      { label: 'Pipeline', icon: <Briefcase size={20} />, path: '/pipeline', module: 'leads_pipeline' },
      { label: 'Agenda', icon: <CalendarIcon size={20} />, path: '/calendar', module: 'agenda' },
      {
        label: 'Serviços',
        icon: <Layers size={20} />,
        isGroup: true,
        subItems: [
          { label: 'Profissionais', icon: <Briefcase size={18} />, path: '/professionals', module: 'equipe' },
          { label: 'Fornecedores', icon: <Building size={18} />, path: '/suppliers', module: 'equipe' },
          { label: 'Produtos', icon: <Package size={18} />, path: '/products', module: 'produtos' },
          { label: 'Planos', icon: <Layers size={18} />, path: '/plans', module: 'assinaturas' },
          { label: 'Assinaturas', icon: <FileText size={18} />, path: '/subscriptions', module: 'assinaturas' },
        ]
      },
      { label: 'Clientes', icon: <Users size={20} />, path: '/customers', module: 'clientes' },
      { label: 'Financeiro', icon: <DollarSign size={20} />, path: '/finances', module: 'financeiro' },
      { label: 'Relatórios', icon: <Activity size={20} />, path: '/reports', module: 'dashboard' },
      { label: 'Equipe', icon: <Shield size={20} />, path: '/team', module: 'equipe' },
      { label: 'Minha Conta', icon: <Settings size={20} />, path: '/profile' }
    ];

  const menuItems = allMenuItems.filter(item => {
    if (isMaster) return true;
    if (item.isGroup) {
      // Show group if any subitem is enabled
      return item.subItems.some(sub => (user?.modulos_habilitados || []).includes(sub.module));
    }
    if (!item.module) return true;
    return (user?.modulos_habilitados || []).includes(item.module);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{
        padding: collapsed ? '1rem 0.5rem' : '1.5rem 1.25rem',
        flexDirection: collapsed ? 'column-reverse' : 'row',
        height: collapsed ? 'auto' : '70px',
        gap: collapsed ? '1rem' : '0'
      }}>
        <div className="logo-area" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '10px',
          width: '100%',
          overflow: 'hidden'
        }}>
          {inTenantContext ? (
            user?.logo_url ? (
              <img
                src={`${API_URL}${user.logo_url}`}
                alt="Tenant Logo"
                style={{ height: '32px', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="logo-icon-fallback" style={{ minWidth: '32px', height: '32px', background: 'var(--gold-500)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                {user?.nome_empresa?.charAt(0) || 'T'}
              </div>
            )
          ) : (
            <img
              src={collapsed ? logoIcon : logoFull}
              alt="CRMaster Logo"
              style={{
                height: collapsed ? '36px' : '38px',
                width: 'auto',
                objectFit: 'contain',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
          )}

          {!collapsed && inTenantContext && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className="logo-text" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--white)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.nome_empresa || user?.tenant_slug}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ambiente</span>
            </div>
          )}
        </div>
        <button className="collapse-btn" onClick={toggleSidebar}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (item.isGroup) {
            const isAnySubActive = item.subItems.some(sub => location.pathname === sub.path);
            const visibleSubItems = item.subItems.filter(sub => (user?.modulos_habilitados || []).includes(sub.module));

            return (
              <div key={item.label} className={`nav-group ${servicesOpen || isAnySubActive ? 'open' : ''}`}>
                <button
                  className={`nav-item group-toggle ${isAnySubActive ? 'active' : ''}`}
                  onClick={() => setServicesOpen(!servicesOpen)}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="label">{item.label}</span>
                      <ChevronDown size={14} className="arrow" />
                    </>
                  )}
                </button>
                {(servicesOpen || isAnySubActive) && !collapsed && (
                  <div className="sub-menu">
                    {visibleSubItems.map(sub => (
                      <Link
                        key={sub.label}
                        to={sub.path}
                        className={`sub-nav-item ${location.pathname === sub.path ? 'active' : ''}`}
                      >
                        <span className="icon-sm">{sub.icon}</span>
                        <span className="label-sm">{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              {!collapsed && <span className="label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && isMaster && inTenantContext && (
          <div style={{
            margin: '0 1rem 1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid var(--gold-500)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-400)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '4px' }}>
              <Shield size={14} /> Sessão Master
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.6rem', textTransform: 'uppercase' }}>Nicho</div>
              <div style={{ fontWeight: 700, color: 'var(--white)' }}>{user?.nicho_nome || 'Não definido'}</div>
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.6rem', textTransform: 'uppercase' }}>Plano / Status</div>
              <div style={{ fontWeight: 700, color: 'var(--white)' }}>
                {user?.plan?.toUpperCase()} | <span style={{ color: user?.payment_status === 'paid' ? 'var(--success)' : 'var(--error)' }}>{user?.payment_status?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}
        {!collapsed && (
          <div style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
            <p className="user-role">{isMaster ? (inTenantContext ? "MASTER EM AMBIENTE" : "ADMINISTRADOR GLOBAL") : "USUÁRIO"}</p>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
