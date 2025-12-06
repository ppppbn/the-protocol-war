import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ScriptEditor from './pages/ScriptEditor'
import Leaderboard from './pages/Leaderboard'
import Story from './pages/Story'
import GodPower from './pages/GodPower'
import './index.css'

// Layout wrapper to conditionally show/hide header
function Layout({ children }) {
  const location = useLocation()
  const isStoryPage = location.pathname === '/story'
  const isGodPower = location.pathname === '/god-power'
  const isFullScreen = isStoryPage || isGodPower

  return (
    <div className="app">
      {/* Header - hidden on fullscreen pages */}
      {!isFullScreen && (
        <header className="header">
          <div className="container header-content">
            <div className="logo">
              <div className="logo-icon">⚡</div>
              <span className="logo-text">Protocol War</span>
            </div>
            <nav className="nav">
              <NavLink to="/story" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                The Story
              </NavLink>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
              <NavLink to="/editor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Deploy Agent
              </NavLink>
              <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Leaderboard
              </NavLink>
            </nav>
          </div>
        </header>
      )}

      {/* Floating nav for story page */}
      {isStoryPage && (
        <nav className="floating-nav">
          <NavLink to="/" className="floating-nav-link">← Back to Dashboard</NavLink>
        </nav>
      )}

      {/* Main Content */}
      <main className={`main-content ${isFullScreen ? 'no-padding' : ''}`}>
        <div className={isFullScreen ? '' : 'container'}>
          {children}
        </div>
      </main>

      {/* Footer - hidden on fullscreen pages */}
      {!isFullScreen && (
        <footer className="header" style={{ marginTop: 'auto', borderBottom: 'none', borderTop: '1px solid rgba(0, 255, 255, 0.1)' }}>
          <div className="container" style={{ textAlign: 'center', padding: '1rem' }}>
            <span className="terminal-text">NETWORK STATUS: ONLINE | AGENTS ACTIVE: --</span>
          </div>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/story" element={<Story />} />
          <Route path="/editor" element={<ScriptEditor />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/god-power" element={<GodPower />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
