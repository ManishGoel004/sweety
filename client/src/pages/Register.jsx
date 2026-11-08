import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../api';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Same rules as the server, so the user gets feedback straight away
  function validate() {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Please enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const message = validate();
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>🩸 Sweety</h1>
        <p className="muted">Create your account</p>

        {error && <p className="error" role="alert">{error}</p>}

        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} autoComplete="name" />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
        />
        <small className="muted">At least 6 characters</small>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
