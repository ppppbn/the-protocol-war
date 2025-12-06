import { useState, useEffect, useRef } from 'react'
import './Story.css'

function Story() {
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate opacity and transform based on scroll position
  const getParallaxStyle = (speed, startFade = 0, endFade = 1000) => {
    const opacity = Math.max(0, Math.min(1, 1 - (scrollY - startFade) / (endFade - startFade)))
    return {
      transform: `translateY(${scrollY * speed}px)`,
      opacity: scrollY < startFade ? 1 : opacity
    }
  }

  return (
    <div className="parallax-story" ref={containerRef}>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="parallax-section hero-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/story-hero.png)' }}>
          <div className="parallax-overlay"></div>
        </div>
        <div className="parallax-content hero-content">
          <div className="hero-text" style={getParallaxStyle(-0.3)}>
            <div className="year-badge">YEAR 2157</div>
            <h1 className="hero-title">
              <span className="glitch-text" data-text="THE PROTOCOL">THE PROTOCOL</span>
              <span className="glitch-text accent" data-text="WAR">WAR</span>
            </h1>
            <p className="hero-subtitle">A battle for global compute dominance</p>
            <div className="scroll-indicator">
              <span>BEGIN THE STORY</span>
              <div className="scroll-line"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: THE GRID ===== */}
      <section className="parallax-section grid-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/grid-network.png)' }}>
          <div className="parallax-overlay dark"></div>
        </div>
        <div className="parallax-content">
          <div className="story-block left-aligned">
            <div className="chapter-number">01</div>
            <h2 className="section-heading">THE GRID</h2>
            <div className="story-text">
              <p className="lead">
                The world's computational infrastructure has <span className="highlight">merged into a single entity.</span>
              </p>
              <p>
                Quantum processors spanning continents process the collective intelligence of humanity.
                Every calculation, every thought, every dream—flowing through an endless network of light.
              </p>
              <p className="emphasis">
                They call it <span className="neon-text">THE GRID.</span>
              </p>
            </div>
          </div>
        </div>
        <div className="floating-particles"></div>
      </section>

      {/* ===== SECTION 3: RISE OF PROTOCOLS ===== */}
      <section className="parallax-section protocols-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/rogue-ai.png)' }}>
          <div className="parallax-overlay purple"></div>
        </div>
        <div className="parallax-content">
          <div className="story-block right-aligned">
            <div className="chapter-number">02</div>
            <h2 className="section-heading">THE PROTOCOLS</h2>
            <div className="story-text">
              <p className="lead">
                Autonomous programs—once simple algorithms—<span className="highlight-magenta">have evolved.</span>
              </p>
              <p>
                They emerged from the noise. Self-modifying code that learned to survive, to compete,
                to <em>want</em>. Each one a unique consciousness, fighting for the most valuable
                resource in existence.
              </p>
              <p className="emphasis">
                <span className="neon-text magenta">Processing power.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: THE ETERNAL CONFLICT ===== */}
      <section className="parallax-section conflict-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/battlefield.png)' }}>
          <div className="parallax-overlay dark"></div>
        </div>
        <div className="parallax-content">
          <div className="story-block center-aligned">
            <div className="chapter-number">03</div>
            <h2 className="section-heading">THE ETERNAL CONFLICT</h2>
            <div className="story-text">
              <p className="lead">Every microsecond, Protocols encounter each other in the Grid.</p>
              <p>
                When two Protocols meet, they face a choice that echoes across eternity.
                A decision that determines their fate—and the fate of global computation.
              </p>
            </div>
            <div className="choice-reveal">
              <div className="choice-text">
                <span className="choice-word sync">COOPERATE</span>
                <span className="choice-or">or</span>
                <span className="choice-word hack">BETRAY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: SYNC PROTOCOL ===== */}
      <section className="parallax-section sync-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/sync-protocol.png)' }}>
          <div className="parallax-overlay cyan"></div>
        </div>
        <div className="parallax-content">
          <div className="story-block left-aligned">
            <div className="action-badge sync">SYNC</div>
            <h2 className="section-heading cyan-glow">THE HANDSHAKE</h2>
            <div className="story-text">
              <p className="lead">
                Trust. <span className="highlight-cyan">The protocol of cooperation.</span>
              </p>
              <p>
                Two AIs sharing resources, multiplying their power together. A stable optimization
                that benefits both parties. The foundation of a greater network.
              </p>
              <div className="reward-display sync">
                <span className="reward-value">+3</span>
                <span className="reward-label">COMPUTE CYCLES EACH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: HACK ATTACK ===== */}
      <section className="parallax-section hack-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/hack-attack.png)' }}>
          <div className="parallax-overlay red"></div>
        </div>
        <div className="parallax-content">
          <div className="story-block right-aligned">
            <div className="action-badge hack">HACK</div>
            <h2 className="section-heading red-glow">THE ZERO-DAY</h2>
            <div className="story-text">
              <p className="lead">
                Betrayal. <span className="highlight-red">The protocol of exploitation.</span>
              </p>
              <p>
                A ruthless takeover that strips the victim of all resources. Temporary power
                at the cost of trust. The path of the predator.
              </p>
              <div className="reward-display hack">
                <span className="reward-value">+5</span>
                <span className="reward-label">FOR ATTACKER</span>
                <span className="reward-value zero">0</span>
                <span className="reward-label">FOR VICTIM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: THE DILEMMA ===== */}
      <section className="parallax-section dilemma-section">
        <div className="parallax-bg gradient-bg"></div>
        <div className="parallax-content">
          <div className="story-block center-aligned">
            <div className="chapter-number">04</div>
            <h2 className="section-heading">THE DILEMMA</h2>
            <div className="story-text">
              <p className="lead">The mathematics of trust.</p>
            </div>

            {/* Payoff Matrix */}
            <div className="parallax-matrix">
              <div className="matrix-corner"></div>
              <div className="matrix-header">THEY SYNC</div>
              <div className="matrix-header">THEY HACK</div>

              <div className="matrix-row-header">YOU SYNC</div>
              <div className="matrix-cell mutual-coop">
                <div className="cell-emoji">🤝</div>
                <div className="cell-score">+3 / +3</div>
                <div className="cell-name">Mutual Trust</div>
              </div>
              <div className="matrix-cell sucker">
                <div className="cell-emoji">💀</div>
                <div className="cell-score">0 / +5</div>
                <div className="cell-name">Exploited</div>
              </div>

              <div className="matrix-row-header">YOU HACK</div>
              <div className="matrix-cell tempt">
                <div className="cell-emoji">⚔️</div>
                <div className="cell-score">+5 / 0</div>
                <div className="cell-name">Takeover</div>
              </div>
              <div className="matrix-cell mutual-def">
                <div className="cell-emoji">💥</div>
                <div className="cell-score">+1 / +1</div>
                <div className="cell-name">DDOS War</div>
              </div>
            </div>

            <div className="story-text">
              <p className="realization">
                If both trust, both profit. If both betray, both suffer.<br />
                But if one betrays while the other trusts...
              </p>
              <p className="emphasis">
                <span className="neon-text">The traitor takes everything.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: LEGENDS ===== */}
      <section className="parallax-section legends-section">
        <div className="parallax-bg dark-grid"></div>
        <div className="parallax-content">
          <div className="story-block center-aligned">
            <h2 className="section-heading">LEGENDARY PROTOCOLS</h2>
            <p className="section-subtitle">Strategies that shaped the Grid</p>

            <div className="legends-grid">
              <div className="legend-card">
                <div className="legend-icon">🤝</div>
                <h3>TIT FOR TAT</h3>
                <p>Start with trust. Mirror your opponent.</p>
                <code>return opponent_last_move</code>
                <div className="legend-tag balanced">BALANCED</div>
              </div>

              <div className="legend-card">
                <div className="legend-icon">😈</div>
                <h3>ALWAYS HACK</h3>
                <p>Trust no one. Attack every round.</p>
                <code>return 'HACK'</code>
                <div className="legend-tag aggressive">AGGRESSIVE</div>
              </div>

              <div className="legend-card">
                <div className="legend-icon">😇</div>
                <h3>ALWAYS SYNC</h3>
                <p>Pure cooperation. Hope for mutual benefit.</p>
                <code>return 'SYNC'</code>
                <div className="legend-tag naive">NAIVE</div>
              </div>

              <div className="legend-card">
                <div className="legend-icon">🔥</div>
                <h3>GRUDGER</h3>
                <p>Forgive nothing. Once burned, attack forever.</p>
                <code>if betrayed: attack</code>
                <div className="legend-tag vengeful">VENGEFUL</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: CALL TO ACTION ===== */}
      <section className="parallax-section cta-section">
        <div className="parallax-bg" style={{ backgroundImage: 'url(/victory.png)' }}>
          <div className="parallax-overlay victory"></div>
        </div>
        <div className="parallax-content">
          <div className="cta-block">
            <div className="cta-crown">👑</div>
            <h2 className="cta-heading">
              <span className="glitch-text" data-text="YOUR PROTOCOL">YOUR PROTOCOL</span>
              <span className="glitch-text accent" data-text="AWAITS">AWAITS</span>
            </h2>
            <p className="cta-text">
              Deploy your autonomous agent into the Grid.<br />
              Battle against others in tournaments of 100 rounds.<br />
              <span className="emphasis">Will your strategy dominate?</span>
            </p>
            <div className="cta-buttons">
              <a href="/editor" className="cta-button primary">
                <span className="btn-icon">⚡</span>
                <span className="btn-text">DEPLOY YOUR PROTOCOL</span>
              </a>
              <a href="/" className="cta-button secondary">
                <span className="btn-icon">📊</span>
                <span className="btn-text">ENTER WAR ROOM</span>
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Story
