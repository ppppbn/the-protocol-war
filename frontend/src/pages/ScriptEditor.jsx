import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import API_URL from '../config'

const DEFAULT_CODE = `def make_decision(history: list, current_round_index: int, total_rounds: int) -> str:
    """
    Decides the next move in the Protocol War.
    
    Args:
        history: List of (YOUR_MOVE, OPPONENT_MOVE) tuples from previous rounds
        current_round_index: Current round (0-indexed)
        total_rounds: Total rounds in this match (e.g., 100)
    
    Returns:
        'SYNC' for cooperation or 'HACK' for attack
    """
    # --- TIT-FOR-TAT STRATEGY ---
    # Start cooperative, then mirror opponent's last move
    
    if current_round_index == 0:
        return 'SYNC'
    
    # Mirror opponent's last move
    opponent_last_move = history[-1][1]
    return opponent_last_move
`

function ScriptEditor() {
  const [scriptName, setScriptName] = useState('')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])

  // Validate on code change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim()) {
        validateCode(code)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [code])

  const validateCode = async (codeToValidate) => {
    setValidating(true)
    try {
      const response = await fetch(`${API_URL}/api/scripts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToValidate })
      })

      if (response.ok) {
        const data = await response.json()
        setValidationErrors(data.errors || [])
      }
    } catch (err) {
      // Silently fail validation on network error
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    if (!scriptName.trim()) {
      setMessage({ type: 'error', text: 'Please enter an agent name' })
      return
    }

    if (validationErrors.length > 0) {
      setMessage({ type: 'error', text: 'Please fix validation errors before deploying' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/api/scripts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          name: scriptName,
          code: code
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '🚀 Agent deployed successfully!' })
        setScriptName('')
      } else {
        const error = await response.json()
        if (error.detail?.errors) {
          setValidationErrors(error.detail.errors)
          setMessage({ type: 'error', text: 'Deployment failed: validation errors' })
        } else {
          setMessage({ type: 'error', text: error.detail || 'Deployment failed' })
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Is the backend running?' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="script-editor">
      <div className="page-title">
        <h1>DEPLOY AGENT</h1>
        <p className="page-subtitle terminal-prefix">Upload your autonomous agent to join the Protocol War</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        {/* Code Editor */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="code-editor-header">
            <span className="code-editor-title">agent_strategy.py</span>
            <div className="code-editor-status">
              {validating ? (
                <>
                  <span className="status-dot" style={{ background: 'var(--neon-orange)', animation: 'none' }}></span>
                  <span>Validating...</span>
                </>
              ) : validationErrors.length > 0 ? (
                <>
                  <span className="status-dot" style={{ background: 'var(--neon-red)', animation: 'none' }}></span>
                  <span style={{ color: 'var(--neon-red)' }}>{validationErrors.length} error(s)</span>
                </>
              ) : (
                <>
                  <span className="status-dot"></span>
                  <span>Valid</span>
                </>
              )}
            </div>
          </div>
          <Editor
            height="500px"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div style={{
              background: 'rgba(255, 0, 85, 0.1)',
              borderTop: '1px solid var(--neon-red)',
              padding: '1rem',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              <div style={{
                color: 'var(--neon-red)',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                fontSize: '0.85rem'
              }}>
                ⚠️ VALIDATION ERRORS
              </div>
              {validationErrors.map((err, idx) => (
                <div key={idx} style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.25rem'
                }}>
                  • {err}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Deploy Form */}
          <div className="card">
            <h3 className="card-title">🚀 Deployment Config</h3>

            <div className="form-group">
              <label className="form-label">Agent Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., NightHawk_v2"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
              />
            </div>

            {message && (
              <div
                className={`status-badge ${message.type === 'success' ? 'status-active' : 'status-error'}`}
                style={{ marginBottom: '1rem', display: 'block', textAlign: 'center', padding: '0.75rem' }}
              >
                {message.text}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', opacity: (saving || validationErrors.length > 0) ? 0.6 : 1 }}
              onClick={handleSave}
              disabled={saving || validationErrors.length > 0}
            >
              {saving ? '⏳ Deploying...' : validationErrors.length > 0 ? '❌ Fix Errors First' : '⚡ Deploy Agent'}
            </button>
          </div>

          {/* Security Info */}
          <div className="card">
            <h3 className="card-title">🔒 Security Rules</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--neon-red)' }}>Blocked:</strong>
              </div>
              <ul style={{ paddingLeft: '1rem', marginBottom: '1rem' }}>
                <li>os, sys, subprocess</li>
                <li>socket, requests, urllib</li>
                <li>file operations (open, io)</li>
                <li>exec, eval, compile</li>
              </ul>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--neon-green)' }}>Allowed:</strong>
              </div>
              <ul style={{ paddingLeft: '1rem' }}>
                <li>random module</li>
                <li>math operations</li>
                <li>list/dict/set</li>
              </ul>
            </div>
          </div>

          {/* API Reference */}
          <div className="card">
            <h3 className="card-title">📖 API Reference</h3>
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              <code style={{
                display: 'block',
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap'
              }}>
                {`def make_decision(
  history: list,
  current_round_index: int,
  total_rounds: int
) -> str`}
              </code>

              <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <strong>Returns:</strong> 'SYNC' or 'HACK'
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScriptEditor
