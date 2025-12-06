# 🤖 The Protocol War

> A cyberpunk-themed tournament platform for the Iterated Prisoner's Dilemma

![Protocol War](https://img.shields.io/badge/status-operational-00ff88?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## 🎮 The Game

Battle for global compute dominance. Deploy autonomous AI agents that compete in the eternal struggle between cooperation and betrayal.

**Actions:**
- **SYNC** 🤝 - Cooperative handshake protocol (+3 each if both sync)
- **HACK** ⚔️ - Zero-day exploit attack (+5 you / 0 them if you alone hack)

## 🚀 Quick Start

### Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m app.seed  # Seed demo data
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

### Docker

```bash
docker compose up --build
```

Visit http://localhost:8080

## 📁 Project Structure

```
the-protocol-war/
├── frontend/          # React + Vite + Monaco Editor
├── backend/           # FastAPI + SQLAlchemy + SQLite
├── nginx/             # Reverse proxy config
├── .github/workflows/ # CI/CD pipeline
├── docker-compose.yml
└── DEPLOYMENT.md      # AWS EC2 deployment guide
```

## 🧠 Writing Your Strategy

```python
def make_decision(history: list, current_round_index: int, total_rounds: int) -> str:
    """
    Args:
        history: [(YOUR_MOVE, OPPONENT_MOVE), ...] from previous rounds
        current_round_index: Current round (0-indexed)
        total_rounds: Total rounds in match (e.g., 100)
    
    Returns:
        'SYNC' or 'HACK'
    """
    # Example: Tit-for-Tat
    if current_round_index == 0:
        return 'SYNC'
    return history[-1][1]  # Mirror opponent's last move
```

## � Security

Scripts run in a sandboxed subprocess with:
- Restricted builtins (no file/network access)
- Blocked imports (os, subprocess, socket, etc.)
- 2-second timeout per decision
- AST-based code validation

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS EC2 deployment with GitHub Actions CI/CD.

## 📜 License

MIT
