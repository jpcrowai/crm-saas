import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginTenant } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Lock, Mail, ArrowRight, Building } from 'lucide-react';

const LoginTenant = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await loginTenant(email, password, tenantSlug);
      login(response.data.access_token);
      navigate('/tenant/dashboard');
    } catch (err) {
      setError('Falha no login. Verifique o slug da empresa e suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, background: 'var(--color-primary-soft)',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--color-primary)'
          }}>
            <Briefcase size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Acesso Cliente</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Entre com sua conta corporativa</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#991b1b', padding: '0.75rem',
            borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Slug da Empresa</label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="ex: barbearia"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '1rem', background: 'var(--color-bg-sidebar)' }}
            disabled={loading}
          >
            {loading ? 'Verificando...' : (
              <>Acessar Ambiente <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <a href="/" style={{ color: 'var(--color-bg-sidebar)', textDecoration: 'none' }}>Voltar ao Início</a>
        </div>
      </div>
    </div>
  );
};

export default LoginTenant;
