import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginMaster, loginTenant } from '../../services/api';
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
        // For tenant login, we need a slug. 
        // If the user's design doesn't have a slug field, we might need to ask or assume.
        // The previous design had it. I'll add a toggle or simple field if missing.
        // For now, let's assume if it's not master, we need a slug.
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
      <div className="auth-card">
        <h1>CRM SaaS</h1>
        <p>Entre para continuar</p>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setIsMaster(false)}
            style={{ background: !isMaster ? 'var(--gold-500)' : '#eee', color: !isMaster ? '#fff' : '#333' }}
          >
            Sou Cliente
          </button>
          <button
            type="button"
            onClick={() => setIsMaster(true)}
            style={{ background: isMaster ? 'var(--gold-500)' : '#eee', color: isMaster ? '#fff' : '#333' }}
          >
            Sou Master
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isMaster && (
            <input
              type="text"
              placeholder="Slug da Empresa"
              value={tenantSlug}
              onChange={e => setTenantSlug(e.target.value)}
              required={!isMaster}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
