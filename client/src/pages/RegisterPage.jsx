import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.displayName)
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const upd = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>MyLife</h1>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input className="form-input" value={form.username} onChange={upd('username')} required autoFocus />
          </div>
          <div className="form-group">
            <label>Nom affiché</label>
            <input className="form-input" value={form.displayName} onChange={upd('displayName')} placeholder="Optionnel" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={form.email} onChange={upd('email')} required />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Mot de passe</label>
            <input className="form-input" type="password" value={form.password} onChange={upd('password')} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        <p className="auth-switch" style={{ marginTop: 20 }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
