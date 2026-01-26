import logoFull from '../assets/branding/logo_full.png';

const LoginMaster = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await loginMaster(email, password);
      login(response.data.access_token);
      navigate('/master/ambientes');
    } catch (err) {
      setError('Credenciais inválidas. Verifique seus dados.');
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
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
      padding: '2rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '3rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img
            src={logoFull}
            alt="CRMaster"
            style={{ height: '50px', objectFit: 'contain', marginBottom: '1rem' }}
          />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px' }}>Painel Administrativo</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Gestão Global CRMaster</p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', color: '#991B1B', padding: '0.75rem',
            borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem',
            border: '1px solid #FECACA'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder="nome@exemplo.com"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%', height: '52px', fontSize: '1rem',
              fontWeight: 700, borderRadius: '12px'
            }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : (
              <>Entrar no Painel <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: '#0F172A', textDecoration: 'none', fontWeight: 500 }}>
            &larr; Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginMaster;
