import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { mediaUrl } from '../utils/media'
import { IconChevronLeft, IconChevronRight, IconArrowLeft } from '../components/Icons'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

function pad(n) { return String(n).padStart(2, '0') }
function dateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

function avatarColor(name = '') {
  const p = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fca5a5', '#c4b5fd', '#fbcfe8']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % p.length
  return p[h]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { userId } = useParams()
  const targetId = userId ? parseInt(userId) : user.id
  const isOwn = targetId === user.id
  const navigate = useNavigate()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [dayData, setDayData] = useState({}) // date → { count, preview_url }
  const [friends, setFriends] = useState([])
  const [friendName, setFriendName] = useState('')

  // Fetch calendar data
  useEffect(() => {
    api.get(`/calendar/${targetId}?year=${year}&month=${month + 1}`)
      .then((res) => {
        const map = {}
        res.data.forEach((d) => { map[d.date] = { count: d.count, preview: d.preview_url } })
        setDayData(map)
      })
      .catch(() => {})
  }, [targetId, year, month])

  // Fetch friends list (only on own calendar)
  useEffect(() => {
    if (isOwn) {
      api.get('/friends').then((r) => setFriends(r.data)).catch(() => {})
    }
  }, [isOwn])

  // If viewing a friend, get their name
  useEffect(() => {
    if (!isOwn) {
      api.get('/friends').then((r) => {
        const f = r.data.find(fr => fr.id === targetId)
        if (f) setFriendName(f.displayName || f.username)
      }).catch(() => {})
    }
  }, [isOwn, targetId])

  // Build calendar cells
  let startDay = new Date(year, month, 1).getDay() - 1
  if (startDay < 0) startDay = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Pad to full row
  while (cells.length % 7 !== 0) cells.push(null)

  const numRows = cells.length / 7
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const prev = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
  const next = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)

  return (
    <div className="calendar-page">
      {/* Topbar */}
      <div className="calendar-topbar">
        {isOwn ? (
          <span className="calendar-topbar-title">MyLife</span>
        ) : (
          <div className="calendar-topbar-friend">
            <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
              <IconArrowLeft />
            </button>
            <h2>{friendName || `Utilisateur`}</h2>
          </div>
        )}

        <div className="month-nav">
          <button className="month-nav-btn" onClick={prev}><IconChevronLeft /></button>
          <span className="month-nav-label">{MONTHS[month]} {year}</span>
          <button className="month-nav-btn" onClick={next}><IconChevronRight /></button>
        </div>

        {isOwn && (
          <button
            className="btn btn-sm"
            onClick={() => {
              setYear(now.getFullYear())
              setMonth(now.getMonth())
            }}
          >
            Ce mois
          </button>
        )}
      </div>

      {/* Friends stories row (own calendar only) */}
      {isOwn && (
        <div className="stories-row">
          {/* Own "add today" story */}
          <Link to={`/add/${todayStr}`} className="story-item">
            <div className="story-avatar story-add-avatar">+</div>
            <span className="story-name">Aujourd'hui</span>
          </Link>

          {/* Friends */}
          {friends.map((f) => (
            <div
              key={f.id}
              className={`story-item${f.postedToday ? ' has-new' : ''}`}
              onClick={() => navigate(`/user/${f.id}`)}
            >
              <div
                className="story-avatar"
                style={{ background: avatarColor(f.username) }}
              >
                {initials(f.displayName || f.username)}
              </div>
              <span className="story-name">{f.displayName || f.username}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-day-headers">
          {DAYS.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
        </div>

        <div
          className="calendar-days"
          style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
        >
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="cal-cell empty" />

            const ds = dateStr(year, month, day)
            const data = dayData[ds]
            const count = data?.count || 0
            const preview = data?.preview || null
            const isToday = ds === todayStr
            const hasPhoto = !!preview
            const dots = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3

            return (
              <div
                key={ds}
                className={`cal-cell${isToday ? ' is-today' : ''}${hasPhoto ? ' has-photo' : ''}`}
                onClick={() => navigate(`/day/${targetId}/${ds}`)}
              >
                {hasPhoto && (
                  <>
                    <div
                      className="cal-cell-bg"
                      style={{ backgroundImage: `url(${mediaUrl(preview)})` }}
                    />
                    <div className="cal-cell-overlay" />
                  </>
                )}
                <span className="cal-cell-num">{day}</span>
                {dots > 0 && !hasPhoto && (
                  <div className="cal-cell-dots">
                    {Array.from({ length: dots }).map((_, j) => (
                      <span key={j} className="cal-dot" />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
