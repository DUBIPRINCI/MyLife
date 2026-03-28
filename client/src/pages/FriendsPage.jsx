import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

function avatarColor(name = '') {
  const p = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fca5a5', '#c4b5fd', '#fbcfe8']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % p.length
  return p[h]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function FriendsPage() {
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [username, setUsername] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = () => {
    api.get('/friends').then(r => setFriends(r.data)).catch(() => {})
    api.get('/friends/requests').then(r => setRequests(r.data)).catch(() => {})
  }

  useEffect(load, [])

  const sendRequest = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await api.post('/friends/request', { username })
      setMsg('Demande envoyée !')
      setUsername('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    }
  }

  const accept = async (id) => { await api.post(`/friends/accept/${id}`); load() }
  const reject = async (id) => { await api.post(`/friends/reject/${id}`); load() }
  const remove = async (id) => {
    if (!confirm('Retirer cet ami ?')) return
    await api.delete(`/friends/${id}`)
    load()
  }

  return (
    <div className="friends-page">
      <h1 className="page-title">Amis</h1>

      {/* Add friend */}
      <form className="search-row" onSubmit={sendRequest}>
        <input
          className="form-input"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur..."
          required
        />
        <button className="btn" type="submit">Ajouter</button>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {msg && <div className="success-msg">{msg}</div>}

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="friends-section">
          <p className="section-label">Demandes reçues</p>
          {requests.map(r => (
            <div key={r.friendshipId} className="friend-card">
              <div className="friend-avatar" style={{ background: avatarColor(r.username) }}>
                {initials(r.displayName || r.username)}
              </div>
              <div className="friend-info">
                <div className="friend-name">{r.displayName || r.username}</div>
                <div className="friend-username">@{r.username}</div>
              </div>
              <div className="friend-actions">
                <button className="btn btn-sm" onClick={() => accept(r.friendshipId)}>Accepter</button>
                <button className="btn btn-sm btn-ghost" onClick={() => reject(r.friendshipId)}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="friends-section">
        <p className="section-label">Mes amis ({friends.length})</p>
        {friends.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: '12px 0' }}>
            Aucun ami pour l'instant. Recherchez quelqu'un par son nom d'utilisateur.
          </p>
        )}
        {friends.map(f => (
          <div key={f.friendshipId} className="friend-card">
            <div className="friend-avatar" style={{ background: avatarColor(f.username) }}>
              {initials(f.displayName || f.username)}
            </div>
            <div className="friend-info">
              <div className="friend-name">{f.displayName || f.username}</div>
              <div className="friend-username">@{f.username}</div>
            </div>
            <div className="friend-actions">
              <button className="btn btn-sm" onClick={() => navigate(`/user/${f.id}`)}>
                Calendrier
              </button>
              <button className="btn btn-sm btn-ghost btn-danger" onClick={() => remove(f.friendshipId)}>
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
