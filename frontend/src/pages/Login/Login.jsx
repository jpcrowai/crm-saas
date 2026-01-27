import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginMaster, loginTenant } from '../../services/api';
import { Mail, Lock, Building, ArrowRight, ShieldCheck, User } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isMaster) {
        response = await loginMaster(email, password);
      } else {
        if (!tenantSlug) throw new Error("Informe o slug da empresa");
        response = await loginTenant(email, password, tenantSlug);
      }

      login(response.data.access_token);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-luxury">
        <div className="auth-header">
          <div className="auth-logo-icon">
            {isMaster ? <ShieldCheck size={32} /> : <Building size={32} />}
          </div>
          <h1>{isMaster ? 'Painel Master' : 'Acesso ao CRM'}</h1>
          <p>{isMaster ? 'Gestão administrativa global' : 'Bem-vindo de volta! Entre em sua conta.'}</p>
        </div>

        {error && (
          <div className="auth-error-badge">
            {error}
          </div>
        )}

        <div className="auth-type-toggle">
          <button
            type="button"
            className={!isMaster ? 'active' : ''}
            onClick={() => setIsMaster(false)}
          >
            <User size={16} /> Cliente
          </button>
          <button
            type="button"
            className={isMaster ? 'active' : ''}
            onClick={() => setIsMaster(true)}
          >
            <ShieldCheck size={16} /> Master
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isMaster && (
            <div className="form-group-luxury">
              <label>Identificador da Empresa</label>
              <div className="input-with-icon">
                <Building size={18} className="icon" />
                <input
                  type="text"
                  placeholder="ex: barbearia"
                  value={tenantSlug}
                  onChange={e => setTenantSlug(e.target.value)}
                  required={!isMaster}
                />
              </div>
            </div>
          )}

          <div className="form-group-luxury">
            <label>E-mail Corporativo</label>
            <div className="input-with-icon">
              <Mail size={18} className="icon" />
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
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
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-auth-submit" disabled={loading}>
            {loading ? 'Validando...' : (
              <>
                Entrar no Sistema <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Esqueceu sua senha? Entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
