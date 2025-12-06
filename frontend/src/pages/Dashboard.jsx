import { useState, useEffect } from 'react'
import API_URL from '../config'

function Dashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeTournaments: 0,
    matchesPlayed: 0,
    topScore: 0
  })
  const [recentMatches, setRecentMatches] = useState([])
  const [tournamentRunning, setTournamentRunning] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch scripts count
      const scriptsRes = await fetch(`${API_URL}/api/scripts/`)
      const scripts = await scriptsRes.json()

      // Fetch leaderboard for match data
      const leaderboardRes = await fetch(`${API_URL}/api/leaderboard/`)
      const leaderboard = await leaderboardRes.json()

      // Fetch tournaments
      const tournamentsRes = await fetch(`${API_URL}/api/tournaments/`)
      const tournaments = await tournamentsRes.json()

      setStats({
        totalAgents: scripts.length,
        activeTournaments: tournaments.length,
        matchesPlayed: leaderboard.reduce((sum, e) => sum + e.matches_played, 0) / 2,
        topScore: leaderboard[0]?.total_score || 0
      })

      // Get latest tournament matches
      if (tournaments.length > 0) {
        const latestRes = await fetch(`${API_URL}/api/tournaments/${tournaments[0].id}`)
        const latest = await latestRes.json()
        setRecentMatches(latest.matches?.slice(0, 5) || [])
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const startTournament = async () => {
    setTournamentRunning(true)
    setMessage(null)

    try {
      const res = await fetch(`${API_URL}/api/tournaments/start`, {
        method: 'POST'
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ type: 'success', text: `🏆 ${data.message}` })
        fetchStats() // Refresh data
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.detail })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Is the backend running?' })
    } finally {
      setTournamentRunning(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="page-title">
        <h1>WAR ROOM</h1>
        <p className="page-subtitle terminal-prefix">Command center for network operations</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`card ${message.type === 'success' ? 'status-active' : 'status-error'}`}
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            textAlign: 'center',
            background: message.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 0, 85, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)'}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAgents}</div>
          <div className="stat-label">Active Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeTournaments}</div>
          <div className="stat-label">Tournaments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.floor(stats.matchesPlayed)}</div>
          <div className="stat-label">Matches Played</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.topScore}</div>
          <div className="stat-label">High Score</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions Card */}
        <div className="card">
          <h3 className="card-title">⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="/editor" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              🤖 Deploy New Agent
            </a>
            <button
              className="btn btn-secondary"
              onClick={startTournament}
              disabled={tournamentRunning}
              style={{ opacity: tournamentRunning ? 0.6 : 1 }}
            >
              {tournamentRunning ? '⏳ Running...' : '🏆 Start Tournament'}
            </button>
            <a href="/leaderboard" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              📊 View Leaderboard
            </a>
          </div>
        </div>

        {/* Recent Matches Card */}
        <div className="card">
          <h3 className="card-title">📡 Recent Battles</h3>
          {recentMatches.length === 0 ? (
            <div className="terminal-text" style={{ lineHeight: '2' }}>
              <div className="terminal-prefix">No matches yet...</div>
              <div className="terminal-prefix">Start a tournament to begin!</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem' }}>
              {recentMatches.map((match, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(0, 255, 255, 0.1)'
                  }}
                >
                  <span style={{ color: match.score1 > match.score2 ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                    {match.script1}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {match.score1} - {match.score2}
                  </span>
                  <span style={{ color: match.score2 > match.score1 ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                    {match.script2}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Protocol Info Card */}
        <div className="card">
          <h3 className="card-title">📋 Protocol Rules</h3>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--neon-green)' }}>SYNC</strong> - Cooperative handshake protocol
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--neon-red)' }}>HACK</strong> - Zero-day exploit attack
            </p>
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem'
            }}>
              <div>SYNC + SYNC = +3 / +3</div>
              <div>HACK + SYNC = +5 / +0</div>
              <div>SYNC + HACK = +0 / +5</div>
              <div>HACK + HACK = +1 / +1</div>
            </div>
          </div>
        </div>

        {/* Top Agents Preview */}
        <div className="card">
          <h3 className="card-title">👑 Network Status</h3>
          <div className="terminal-text" style={{ lineHeight: '2' }}>
            <div className="terminal-prefix">System operational</div>
            <div className="terminal-prefix">Agents deployed: {stats.totalAgents}</div>
            <div className="terminal-prefix">Tournament engine: READY</div>
            <div className="terminal-prefix">Network dominance: CONTESTED</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
