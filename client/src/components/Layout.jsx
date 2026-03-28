import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IconGrid, IconGridFill, IconPlus, IconPlusFill, IconPeople, IconPeopleFill, IconPerson, IconPersonFill } from './Icons'

function avatarColor(name = '') {
  const palette = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fca5a5', '#c4b5fd', '#fbcfe8']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length
  return palette[h]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function NavItem({ to, end, label, Icon, IconFill }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
      {({ isActive }) => (
        <>
          {isActive ? <IconFill /> : <Icon />}
          <span className="sidebar-item-label">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function BottomItem({ to, end, label, Icon, IconFill }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
      {({ isActive }) => (isActive ? <IconFill /> : <Icon />)}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const bg = avatarColor(user?.username)
  const ini = initials(user?.displayName || user?.username || '')

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-short">M</span>
          <span className="sidebar-logo-full">MyLife</span>
        </div>
        <div className="sidebar-nav">
          <NavItem to="/" end label="Calendrier" Icon={IconGrid} IconFill={IconGridFill} />
          <NavItem to="/add" label="Ajouter" Icon={IconPlus} IconFill={IconPlusFill} />
          <NavItem to="/friends" label="Amis" Icon={IconPeople} IconFill={IconPeopleFill} />
          <NavItem to="/profile" label="Profil" Icon={IconPerson} IconFill={IconPersonFill} />
        </div>
        <div className="sidebar-bottom">
          <div
            className="sidebar-avatar"
            style={{ background: bg }}
            onClick={() => navigate('/profile')}
            title={user?.displayName || user?.username}
          >
            {ini}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="page-content">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        <BottomItem to="/" end label="Calendrier" Icon={IconGrid} IconFill={IconGridFill} />
        <NavLink
          to="/add"
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          {({ isActive }) => (isActive ? <IconPlusFill /> : <IconPlus />)}
        </NavLink>
        <BottomItem to="/friends" label="Amis" Icon={IconPeople} IconFill={IconPeopleFill} />
        <BottomItem to="/profile" label="Profil" Icon={IconPerson} IconFill={IconPersonFill} />
      </nav>
    </div>
  )
}
