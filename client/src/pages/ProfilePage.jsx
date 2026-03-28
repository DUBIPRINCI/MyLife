import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { IconLogout } from '../components/Icons'

function avatarColor(name = '') {
  const p = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fca5a5', '#c4b5fd', '#fbcfe8']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % p.length
  return p[h]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [friendCount, setFriendCount] = useState(0)
  const [entryCount, setEntryCount] = useState(null)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    api.get('/friends').then(r => setFriendCount(r.data.length)).catch(() => {})
    // Get entry count via calendar for current year/month (approximate)
    const now = new Date()
    api.get(`/calendar/${user.id}?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(r => setEntryCount(r.data.reduce((sum, d) => sum + d.count, 0)))
      .catch(() => {})
  }, [user.id])

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await api.patch('/auth/me', { displayName: displayName.trim() })
      setSavedMsg('Nom mis à jour !')
      setEditMode(false)
      setTimeout(() => setSavedMsg(''), 3000)
    } catch {}
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const bg = avatarColor(user?.username)
  const ini = initials(user?.displayName || user?.username || '')

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-lg" style={{ background: bg }}>
          {ini}
        </div>
        <div className="profile-info">
          <div className="profile-username">{user?.username}</div>
          <div className="profile-display-name">{user?.displayName}</div>
          <div className="profile-stats">
            {entryCount !== null && (
              <div className="stat-block">
                <span className="stat-num">{entryCount}</span>
                <span className="stat-label">ce mois</span>
              </div>
            )}
            <div className="stat-block">
              <span className="stat-num">{friendCount}</span>
              <span className="stat-label">amis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Display name edit */}
      <div className="profile-section">
        <p className="profile-section-title">Nom affiché</p>
        {savedMsg && <div className="success-msg">{savedMsg}</div>}
        {!editMode ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.9rem' }}>{user?.displayName || user?.username}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => { setDisplayName(user?.displayName || ''); setEditMode(true) }}>
              Modifier
            </button>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={handleSaveName}>
            <input
              className="form-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
              required
            />
            <button className="btn btn-sm" type="submit" disabled={saving}>
              {saving ? '...' : 'Sauver'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditMode(false)}>
              Annuler
            </button>
          </form>
        )}
      </div>

      {/* Account info */}
      <div className="profile-section">
        <p className="profile-section-title">Compte</p>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>Email</span>
          <span style={{ float: 'right' }}>{user?.email}</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '8px 0' }}>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>Identifiant</span>
          <span style={{ float: 'right' }}>@{user?.username}</span>
        </div>
      </div>

      {/* Logout */}
      <button className="profile-logout-btn" onClick={handleLogout}>
        <IconLogout />
        Se déconnecter
      </button>
    </div>
  )
}
