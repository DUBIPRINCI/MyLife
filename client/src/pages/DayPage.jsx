import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { mediaUrl } from '../utils/media'
import { IconArrowLeft, IconChevronLeft, IconChevronRight, IconPlus, IconTrash } from '../components/Icons'
import { WEATHER_OPTIONS } from '../components/WeatherIcons'

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const WEEK   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']

function fmtDate(s) {
  const d = new Date(s + 'T00:00:00')
  return `${WEEK[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function shift(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function DayPage() {
  const { userId, date } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOwn = parseInt(userId) === user.id

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [weather, setWeather] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  useEffect(() => {
    setLoading(true)
    setWeather(null)
    Promise.all([
      api.get(`/entries/${userId}/${date}`),
      api.get(`/day-meta/${userId}/${date}`),
    ])
      .then(([entriesRes, metaRes]) => {
        setEntries(entriesRes.data)
        setWeather(metaRes.data.weather || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, date])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette entrée ?')) return
    try {
      await api.delete(`/entries/${id}`)
      setEntries(e => e.filter(x => x.id !== id))
    } catch {}
  }

  return (
    <div className="day-page">
      {/* Topbar */}
      <div className="day-topbar">
        <button className="day-topbar-back" onClick={() => navigate(-1)}>
          <IconArrowLeft />
          Retour
        </button>

        <div className="day-topbar-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fmtDate(date)}
            {weather && (() => {
              const w = WEATHER_OPTIONS.find(o => o.key === weather)
              return w ? (
                <span title={w.label} style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  <w.Icon size={18} />
                </span>
              ) : null
            })()}
          </span>
          {isToday && <small>Aujourd'hui</small>}
        </div>

        <div className="day-topbar-nav">
          <button onClick={() => navigate(`/day/${userId}/${shift(date, -1)}`)} title="Jour précédent">
            <IconChevronLeft />
          </button>
          <button onClick={() => navigate(`/day/${userId}/${shift(date, 1)}`)} title="Jour suivant">
            <IconChevronRight />
          </button>
        </div>
      </div>

      {/* Friend banner */}
      {!isOwn && (
        <div className="day-friend-banner">
          Vous consultez la journée d'un ami — lecture seule
        </div>
      )}

      {/* Entries */}
      <div className="day-entries">
        {loading && (
          <>
            <div className="skeleton skel-entry" />
            <div className="skeleton skel-entry" />
          </>
        )}

        {!loading && entries.length === 0 && (
          <div className="day-empty">
            <p>Rien pour cette journée</p>
            {isOwn && (
              <Link to={`/add/${date}`} className="btn">
                Ajouter un souvenir
              </Link>
            )}
          </div>
        )}

        {!loading && entries.map(entry => (
          <div key={entry.id} className="entry-card">
            {entry.type === 'text' && (
              <div className="entry-text-body">{entry.content}</div>
            )}

            {entry.type === 'photo' && (
              <div className="entry-media">
                <img
                  src={mediaUrl(entry.content)}
                  alt={entry.caption || ''}
                  onClick={() => setLightbox(mediaUrl(entry.content))}
                />
              </div>
            )}

            {entry.type === 'video' && (
              <div className="entry-media">
                <video controls src={mediaUrl(entry.content)} />
              </div>
            )}

            <div className="entry-footer">
              {entry.caption && (
                <span className="entry-caption">{entry.caption}</span>
              )}
              <span className="entry-time">{fmtTime(entry.created_at)}</span>
              {isOwn && (
                <button
                  className="entry-delete-btn"
                  onClick={() => handleDelete(entry.id)}
                  title="Supprimer"
                >
                  <IconTrash />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FAB — add to this day */}
      {isOwn && (
        <Link to={`/add/${date}`} className="fab" title="Ajouter">
          <IconPlus />
        </Link>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}
    </div>
  )
}
