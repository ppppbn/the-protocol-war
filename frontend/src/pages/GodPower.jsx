import { useState, useEffect } from 'react'
import './GodPower.css'
import API_URL from '../config'

function GodPower() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('godpower_token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  // Fetch status when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchStatus()
      fetchTournaments()
      fetchAgents()
    }
  }, [isAuthenticated, token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Login failed')
      }

      const data = await response.json()
      setToken(data.token)
      localStorage.setItem('godpower_token', data.token)
      setIsAuthenticated(true)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setIsAuthenticated(false)
    localStorage.removeItem('godpower_token')
    setStatus(null)
    setTournaments([])
    setAgents([])
  }

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.status === 401) {
        handleLogout()
        return
      }
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tournaments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTournaments(data)
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }

  const toggleAgent = async (agentId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/agents/${agentId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setMessage(data.message)
        fetchAgents()
      }
    } catch (err) {
      setMessage('Failed to toggle agent status')
    }
  }

  const triggerTournament = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/api/admin/trigger-tournament`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setMessage(data.message)
      if (data.success) {
        fetchTournaments()
        fetchStatus()
      }
    } catch (err) {
      setMessage('Failed to trigger tournament')
    } finally {
      setLoading(false)
    }
  }

  const toggleScheduler = async (pause) => {
    setLoading(true)
    try {
      const endpoint = pause ? 'pause-scheduler' : 'resume-scheduler'
      await fetch(`${API_URL}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchStatus()
    } catch (err) {
      setMessage('Failed to toggle scheduler')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A'
    return new Date(isoString).toLocaleString()
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="godpower-container">
        <div className="godpower-login">
          <div className="login-icon">👁️</div>
          <h1 className="login-title">GOD POWER</h1>
          <p className="login-subtitle">Administrative Access Required</p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="password-input"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
            </button>
          </form>

          <a href="/" className="back-link">← Return to The Network</a>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="godpower-container">
      <div className="godpower-dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="admin-icon">👁️</span>
            <h1>GOD POWER</h1>
          </div>
          <button onClick={handleLogout} className="logout-button">LOGOUT</button>
        </header>

        {/* Status Section */}
        <section className="dashboard-section">
          <h2>⚡ Scheduler Status</h2>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Status</div>
              <div className={`status-value ${status?.scheduler_running ? 'active' : 'paused'}`}>
                {status?.scheduler_running ? '🟢 RUNNING' : '🔴 PAUSED'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Next Tournament</div>
              <div className="status-value">
                {status?.next_tournament ? formatDate(status.next_tournament) : 'N/A'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Server Time (UTC)</div>
              <div className="status-value">
                {status?.current_time ? formatDate(status.current_time) : 'Loading...'}
              </div>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="dashboard-section">
          <h2>🎮 Controls</h2>
          {message && (
            <div className={`message ${message.includes('success') || message.includes('activated') || message.includes('deactivated') ? 'success' : 'info'}`}>
              {message}
            </div>
          )}
          <div className="controls-grid">
            <button
              onClick={triggerTournament}
              className="control-button primary"
              disabled={loading}
            >
              <span className="btn-icon">⚔️</span>
              <span className="btn-text">TRIGGER TOURNAMENT NOW</span>
            </button>

            <button
              onClick={() => toggleScheduler(!status?.scheduler_running)}
              className={`control-button ${status?.scheduler_running ? 'danger' : 'success'}`}
              disabled={loading}
            >
              <span className="btn-icon">{status?.scheduler_running ? '⏸️' : '▶️'}</span>
              <span className="btn-text">
                {status?.scheduler_running ? 'PAUSE SCHEDULER' : 'RESUME SCHEDULER'}
              </span>
            </button>

            <button
              onClick={() => { fetchStatus(); fetchTournaments(); fetchAgents(); }}
              className="control-button secondary"
              disabled={loading}
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-text">REFRESH DATA</span>
            </button>
          </div>
        </section>

        {/* Agent Management */}
        <section className="dashboard-section">
          <h2>🤖 Agent Management</h2>
          <div className="agents-table">
            <div className="table-header agents-header">
              <span>ID</span>
              <span>Name</span>
              <span>Owner</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {agents.length === 0 ? (
              <div className="empty-state">No agents registered</div>
            ) : (
              agents.map(agent => (
                <div key={agent.id} className={`table-row ${agent.is_active ? 'active' : 'inactive'}`}>
                  <span>#{agent.id}</span>
                  <span className="agent-name">{agent.name}</span>
                  <span>{agent.owner}</span>
                  <span>
                    <span className={`status-badge ${agent.is_active ? 'active' : 'inactive'}`}>
                      {agent.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </span>
                  <span>
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={`toggle-button ${agent.is_active ? 'deactivate' : 'activate'}`}
                    >
                      {agent.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Tournaments */}
        <section className="dashboard-section">
          <h2>📊 Recent Tournaments</h2>
          <div className="tournaments-table">
            <div className="table-header">
              <span>ID</span>
              <span>Status</span>
              <span>Started</span>
              <span>Completed</span>
              <span>Matches</span>
            </div>
            {tournaments.length === 0 ? (
              <div className="empty-state">No tournaments yet</div>
            ) : (
              tournaments.map(t => (
                <div key={t.id} className={`table-row ${t.status}`}>
                  <span>#{t.id}</span>
                  <span className={`status-badge ${t.status}`}>{t.status.toUpperCase()}</span>
                  <span>{formatDate(t.started_at)}</span>
                  <span>{formatDate(t.completed_at)}</span>
                  <span>{t.match_count}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="dashboard-footer">
          <a href="/" className="back-link">← Return to The Network</a>
        </footer>
      </div>
    </div>
  )
}

export default GodPower
