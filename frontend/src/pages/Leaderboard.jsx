import { useState, useEffect } from 'react'
import API_URL from '../config'

function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchLeaderboard()

    // Auto-refresh every 10 seconds if enabled
    let interval
    if (autoRefresh) {
      interval = setInterval(fetchLeaderboard, 10000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard/`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1'
    if (rank === 2) return 'rank-2'
    if (rank === 3) return 'rank-3'
    return ''
  }

  const getRankEmoji = (rank) => {
    if (rank === 1) return '👑'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  const formatTime = (date) => {
    if (!date) return '--'
    return date.toLocaleTimeString()
  }

  return (
    <div className="leaderboard-page">
      <div className="page-title">
        <h1>GLOBAL LEADERBOARD</h1>
        <p className="page-subtitle terminal-prefix">Network dominance rankings</p>
      </div>

      {/* Controls Bar */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchLeaderboard}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            🔄 Refresh
          </button>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-refresh (10s)
          </label>
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          Last updated: {formatTime(lastUpdated)}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <p>No tournament data yet.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Deploy agents and run a tournament to see rankings.
            </p>
            <a href="/" className="btn btn-primary" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
              Go to Dashboard
            </a>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Agent</th>
                <th>Operator</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Win Rate</th>
                <th>Avg Score</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.username}-${entry.script_name}`}>
                  <td className={getRankClass(entry.rank)}>
                    <strong style={{ fontSize: '1.1rem' }}>{getRankEmoji(entry.rank)}</strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                      {entry.script_name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{entry.username}</td>
                  <td>{entry.matches_played}</td>
                  <td>
                    <span style={{ color: 'var(--neon-green)' }}>{entry.wins}</span>
                  </td>
                  <td>
                    <span style={{
                      color: entry.matches_played > 0
                        ? (entry.wins / entry.matches_played >= 0.5 ? 'var(--neon-green)' : 'var(--neon-orange)')
                        : 'var(--text-muted)'
                    }}>
                      {entry.matches_played > 0
                        ? `${Math.round(entry.wins / entry.matches_played * 100)}%`
                        : '--'}
                    </span>
                  </td>
                  <td>{entry.avg_score.toFixed(1)}</td>
                  <td>
                    <strong style={{ color: 'var(--neon-magenta)', fontSize: '1.1rem' }}>
                      {entry.total_score}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Scoring Legend */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">📊 Scoring System</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--neon-green)',
              fontWeight: 'bold',
              marginBottom: '0.25rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🤝</span> SYNC + SYNC
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              +3 each — Stable Optimization
            </div>
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--neon-red)',
              fontWeight: 'bold',
              marginBottom: '0.25rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚔️</span> HACK + SYNC
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              +5 / +0 — Takeover / Formatted
            </div>
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--neon-orange)',
              fontWeight: 'bold',
              marginBottom: '0.25rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>💥</span> HACK + HACK
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              +1 each — DDOS War
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
