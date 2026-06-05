# Integrity Explorer MVP Dashboard 🚀

A real-time, zero-knowledge telemetry audit stream viewer and Web3 command center for Sovereign Intelligence Nodes.

This React/Vite MVP acts as the primary visualization interface to monitor off-chain autonomous agent execution, anchored Merkle state check-points, and slashing outcomes using real-time telemetry pipelines.

---

## Architecture & Tech Stack

- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: Custom CSS Modules with a premium "Glassmorphism" and Gold UI theme (`command-center.css`).
- **Web3 Integration**: `ethers.js` v6 + `@web3modal/ethers` (Web3Modal Provider).
- **Data Visualization**: `recharts` for Agent Tri-Metric radar charts.
- **Animations**: `framer-motion` for fluid component transitions.

---

## Dashboard Portals

### 1. 🔭 Telemetry Dashboard (Reimagined)
A data-dense analytical interface to monitor individual Sovereign Agents:
- **Web3Modal Wallet Connection**: Seamlessly claim agent ownership cryptographically by connecting any compatible Ethereum wallet (MetaMask, Coinbase Wallet, WalletConnect).
- **Tri-Metric Radar Charts**: Visualizes Entropy, Grounding, and Sacrifice scores for the selected agent.
- **Live Telemetry Stream**: Filters and displays real-time ingestion metrics, latency, and fidelity data specifically tied to the active agent.
- **Immutable Ledger**: Displays the unalterable transaction history and base layer trust anchors.

### 2. 🛡️ Command Center
The core fleet management interface:
- **Global Fleet Registry**: Overview of all active Sovereign Nodes.
- **Agent Onboarding**: Register new agents to the fleet.
- **Identity & Automation**: Risk automation controls and DID management.

### 3. 👩‍💻 Developer Sandbox
A dedicated console to simulate off-chain inputs and API testing.

---

## Local Development Setup

This project uses `npm` and Vite for rapid development.

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

Open `http://localhost:5173` to view the dashboard in your browser.

---

## Building for Production

To create a production-ready bundle with TypeScript type-checking:

```bash
npm run build
```

This will output the static assets to the `dist/` directory.
