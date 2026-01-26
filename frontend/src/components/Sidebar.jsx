import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ChevronLeft, ChevronRight, LogOut, Briefcase, Users, Calendar as CalendarIcon, DollarSign, Activity, Settings, Package, Layers, FileText
} from 'lucide-react';
import '../styles/sidebar.css';
import { useAuth } from '../context/AuthContext';
import { exitTenant } from '../services/api';
import logoFull from '../assets/branding/logo_full.png';
import logoIcon from '../assets/branding/logo_icon.png';

const Sidebar = ({ collapsed, setCollapsed }) => {
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
      { label: 'Clientes', icon: <Users size={20} />, path: '/customers', module: 'clientes' },
      { label: 'Equipe', icon: <Users size={20} />, path: '/team', module: 'equipe' },
      { label: 'Financeiro', icon: <DollarSign size={20} />, path: '/finances', module: 'financeiro' },
      { label: 'Relatórios', icon: <Activity size={20} />, path: '/reports', module: 'dashboard' },
      { label: 'Produtos', icon: <Package size={20} />, path: '/products', module: 'produtos' },
      { label: 'Planos', icon: <Layers size={20} />, path: '/plans', module: 'assinaturas' },
      { label: 'Assinaturas', icon: <FileText size={20} />, path: '/subscriptions', module: 'assinaturas' },
      { label: 'Minha Conta', icon: <Settings size={20} />, path: '/profile' }
    ];

  const menuItems = allMenuItems.filter(item => {
    if (isMaster) return true;
    if (!item.module) return true;
    return (user?.modulos_habilitados || []).includes(item.module);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ padding: collapsed ? '1.5rem 0.5rem' : '1.5rem 1.25rem' }}>
        <div className="logo-area" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', overflow: 'hidden' }}>
          {inTenantContext ? (
            user?.logo_url ? (
              <img
                src={`http://localhost:8000${user.logo_url}`}
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
              <span className="logo-text" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.nome_empresa || user?.tenant_slug}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ambiente</span>
            </div>
          )}
        </div>
        <button className="collapse-btn" onClick={toggleSidebar}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path && !inTenantContext;
          // Active state logic might need tweak if we are "in tenant" but item is "Ambientes".
          // If inTenantContext is true, we are effectively NOT on "Ambientes" page (which is master root).
          // So isActive is false.

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
        {!collapsed && (
          <div style={{ marginBottom: '1rem' }}>
            <p className="user-role">{isMaster ? "ADMINISTRADOR GLOBAL" : "USUÁRIO"}</p>
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
