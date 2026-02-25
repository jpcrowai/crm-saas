import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginMaster, loginTenant } from '../../services/api';
import { Mail, Lock, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Basic validation before starting
    const currentSlug = (tenantSlug || '').trim().toLowerCase();
    if (!currentSlug) {
      setError('Por favor, informe o identificador da empresa (ou "master").');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (currentSlug === 'master') {
        response = await loginMaster(email, password);
      } else {
        response = await loginTenant(email, password, currentSlug);
      }

      if (response && response.data && response.data.access_token) {
        login(response.data.access_token);
        navigate('/');
      } else {
        throw new Error('Resposta do servidor inválida');
      }
    } catch (err) {
      console.error('Login attempt failed:', err);
      const apiError = err.response?.data?.detail;
      const message = apiError || err.message || 'Falha no acesso. Verifique suas credenciais.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-luxury">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <ShieldCheck size={32} />
          </div>
          <h1>Acesso ao Ecossistema</h1>
          <p>Entre com suas credenciais corporativas.</p>
          <small style={{ opacity: 0.3, fontSize: '0.65rem' }}>v2.2</small>
        </div>

        {error && (
          <div className="auth-error-badge">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
          <div className="form-group-luxury">
            <label>Identificador da Empresa (Slug)</label>
            <div className="input-with-icon">
              <Building size={18} className="icon" />
              <input
                type="text"
                placeholder="ex: barbearia ou master"
                value={tenantSlug}
                onChange={e => setTenantSlug(e.target.value)}
                required
                autoComplete="organization"
              />
            </div>
          </div>

          <div className="form-group-luxury">
            <label>E-mail</label>
            <div className="input-with-icon">
              <Mail size={18} className="icon" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group-luxury">
            <label>Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-auth-submit"
            disabled={loading}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Validando...' : (
              <>
                Acessar Sistema <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Dificuldades no acesso? Contate o administrador do seu ambiente.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

