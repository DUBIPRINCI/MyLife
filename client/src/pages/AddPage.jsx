import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { IconArrowLeft, IconText, IconCamera, IconVideo, IconTrash } from '../components/Icons'
import { WEATHER_OPTIONS } from '../components/WeatherIcons'

let nextId = 1

export default function AddPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { date: dateParam } = useParams()

  const defaultDate = dateParam || new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(defaultDate)

  // Accumulated items to publish
  const [items, setItems] = useState([])

  // Draft state (current item being composed)
  const [draftType, setDraftType] = useState('text')
  const [draftText, setDraftText] = useState('')
  const [draftFile, setDraftFile] = useState(null)
  const [draftPreview, setDraftPreview] = useState(null)
  const [draftCaption, setDraftCaption] = useState('')

  // Météo du jour (optionnel)
  const [weather, setWeather] = useState(null)

  // Publish state
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')

  const fileRef = useRef(null)
  const textRef = useRef(null)

  // Switch type and reset draft
  const switchType = (t) => {
    setDraftType(t)
    setDraftText('')
    setDraftFile(null)
    setDraftPreview(null)
    setDraftCaption('')
    setError('')
    if (t !== 'text') {
      setTimeout(() => fileRef.current?.click(), 80)
    } else {
      setTimeout(() => textRef.current?.focus(), 80)
    }
  }

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setDraftFile(f)
    if (f.type.startsWith('image/')) setDraftPreview(URL.createObjectURL(f))
    else setDraftPreview(null)
    // Reset input so same file can be reselected
    e.target.value = ''
  }

  // Validate if current draft is ready to add
  const draftReady = () => {
    if (draftType === 'text') return draftText.trim().length > 0
    return !!draftFile
  }

  // Add current draft to items list
  const addItem = () => {
    if (!draftReady()) return
    const id = nextId++
    if (draftType === 'text') {
      setItems(prev => [...prev, { id, type: 'text', content: draftText.trim() }])
    } else {
      setItems(prev => [...prev, {
        id,
        type: draftType,
        file: draftFile,
        previewUrl: draftPreview,
        caption: draftCaption.trim(),
      }])
    }
    // Reset draft
    setDraftText('')
    setDraftFile(null)
    setDraftPreview(null)
    setDraftCaption('')
    // Keep same type selected, refocus
    if (draftType === 'text') setTimeout(() => textRef.current?.focus(), 50)
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addItem()
  }

  // Publish all items
  const publishAll = async () => {
    // Auto-add current draft if ready
    const finalItems = [...items]
    if (draftReady()) {
      const id = nextId++
      if (draftType === 'text') {
        finalItems.push({ id, type: 'text', content: draftText.trim() })
      } else {
        finalItems.push({ id, type: draftType, file: draftFile, previewUrl: draftPreview, caption: draftCaption.trim() })
      }
    }

    if (finalItems.length === 0) return
    setError('')
    setPublishing(true)
    setProgress({ done: 0, total: finalItems.length })

    // Sauvegarder la météo si sélectionnée
    if (weather) {
      try { await api.post('/day-meta', { date, weather }) } catch {}
    }

    for (let i = 0; i < finalItems.length; i++) {
      const item = finalItems[i]
      try {
        const fd = new FormData()
        fd.append('date', date)
        fd.append('type', item.type)
        if (item.type === 'text') {
          fd.append('content', item.content)
        } else {
          fd.append('file', item.file)
          if (item.caption) fd.append('caption', item.caption)
        }
        await api.post('/entries', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setProgress({ done: i + 1, total: finalItems.length })
      } catch (err) {
        setError(`Erreur sur l'entrée ${i + 1} : ${err.response?.data?.error || err.message}`)
        setPublishing(false)
        return
      }
    }

    navigate(`/day/${user.id}/${date}`)
  }

  const totalCount = items.length + (draftReady() ? 1 : 0)

  return (
    <div className="add-page">
      {/* Topbar */}
      <div className="add-topbar">
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.85rem' }}
          onClick={() => navigate(-1)}
        >
          <IconArrowLeft /> Annuler
        </button>
        <h2>Nouvelle entrée</h2>
        <button
          className="btn btn-sm"
          style={{
            background: totalCount > 0 && !publishing ? 'var(--accent)' : 'var(--border)',
            color: totalCount > 0 && !publishing ? '#fff' : 'var(--muted)',
            border: 'none',
          }}
          onClick={publishAll}
          disabled={totalCount === 0 || publishing}
        >
          {publishing
            ? `${progress.done}/${progress.total}…`
            : `Publier${totalCount > 0 ? ` (${totalCount})` : ''}`}
        </button>
      </div>

      <div className="add-body">
        {error && <div className="error-msg">{error}</div>}

        {/* Date */}
        <div className="add-date-row">
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>Date</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Météo */}
        <div className="weather-selector">
          <span className="weather-selector-label">Météo</span>
          <div className="weather-options">
            {WEATHER_OPTIONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                title={label}
                className={`weather-btn${weather === key ? ' selected' : ''}`}
                onClick={() => setWeather(w => w === key ? null : key)}
              >
                <Icon size={20} />
                {weather === key && <span className="weather-btn-label">{label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Items already in list */}
        {items.length > 0 && (
          <div className="draft-items-list">
            {items.map(item => (
              <div key={item.id} className="draft-item">
                <div className="draft-item-icon">
                  {item.type === 'text' && <IconText />}
                  {item.type === 'photo' && <IconCamera />}
                  {item.type === 'video' && <IconVideo />}
                </div>
                <div className="draft-item-body">
                  {item.type === 'text' && (
                    <div className="draft-item-text">{item.content}</div>
                  )}
                  {item.type === 'photo' && (
                    <>
                      {item.previewUrl
                        ? <img className="draft-item-thumb" src={item.previewUrl} alt="" />
                        : <div className="draft-item-filename">{item.file.name}</div>
                      }
                      {item.caption && <div className="draft-item-caption">{item.caption}</div>}
                    </>
                  )}
                  {item.type === 'video' && (
                    <>
                      <div className="draft-item-filename">🎬 {item.file.name}</div>
                      {item.caption && <div className="draft-item-caption">{item.caption}</div>}
                    </>
                  )}
                </div>
                <button className="draft-item-remove" onClick={() => removeItem(item.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="draft-composer">
          {/* Type pills */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <div className="add-type-row">
              <button
                className={`add-type-pill${draftType === 'text' ? ' selected' : ''}`}
                onClick={() => switchType('text')}
              >
                <IconText /> Texte
              </button>
              <button
                className={`add-type-pill${draftType === 'photo' ? ' selected' : ''}`}
                onClick={() => switchType('photo')}
              >
                <IconCamera /> Photo
              </button>
              <button
                className={`add-type-pill${draftType === 'video' ? ' selected' : ''}`}
                onClick={() => switchType('video')}
              >
                <IconVideo /> Vidéo
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept={draftType === 'photo' ? 'image/*' : 'video/*'}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Content */}
          <div className="draft-composer-inner">
            {draftType === 'text' && (
              <textarea
                ref={textRef}
                className="add-textarea"
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Qu'est-ce qui s'est passé ?"
                autoFocus
              />
            )}

            {(draftType === 'photo' || draftType === 'video') && (
              <>
                {!draftFile ? (
                  <div className="add-file-drop" onClick={() => fileRef.current?.click()}>
                    {draftType === 'photo' ? <IconCamera /> : <IconVideo />}
                    <span>Cliquer pour choisir {draftType === 'photo' ? 'une photo' : 'une vidéo'}</span>
                  </div>
                ) : (
                  <div className="add-preview">
                    {draftPreview
                      ? <img src={draftPreview} alt="" />
                      : <div style={{ padding: '12px', background: 'var(--surface)', fontSize: '0.82rem', color: 'var(--muted)' }}>
                          🎬 {draftFile.name}
                        </div>
                    }
                    <button className="add-change-file" onClick={() => fileRef.current?.click()}>
                      Changer
                    </button>
                  </div>
                )}
                {draftFile && (
                  <input
                    className="add-caption"
                    type="text"
                    value={draftCaption}
                    onChange={e => setDraftCaption(e.target.value)}
                    placeholder="Légende (optionnel)"
                  />
                )}
              </>
            )}
          </div>

          {/* Add to list button */}
          <div className="draft-composer-actions">
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
              {draftType === 'text' ? 'Ctrl+Entrée' : ''}
            </span>
            <button
              className="btn btn-sm"
              onClick={addItem}
              disabled={!draftReady()}
              style={{ opacity: draftReady() ? 1 : 0.4 }}
            >
              + Ajouter à la liste
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
