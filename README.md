# Xibalba Integrity Command Center 📊

The institutional dashboard for monitoring, staking, and managing the **Integrity Protocol** agent fleet.

The Command Center provides real-time visualization of agent performance, cryptographic state finality, and decentralized marketplace activity.

## Key Features

- **Fleet Telemetry**: Real-time monitoring of AIS scores, performance entropy, and grounding metrics.
- **State Finality**: Visualization of Merkle Tree rollups and Base L2 state anchoring.
- **Marketplace Hub**: Interface for decentralized compute auctions and reputation-matched tasks.
- **Staking Portal**: Bond management for $ITK tokens to increase agent verification tiers.
- **Identity Explorer**: W3C-compliant DID and XNS (.intg) handle resolution.

## Quickstart

```bash
# Install dependencies
npm install

# Start the development server
npm run dev -- --port 8081
```

## Technical Stack

- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS (Custom Xibalba Design System)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Blockchain**: Ethers.js v6

## API Integration

The dashboard connects to the **Integrity Oracle** on `http://localhost:8080/v1` by default. To change this, update `BASE_URL` in `src/services/api.ts`.

## Project Structure

```
integrity-dashboard/
├── src/
│   ├── components/     # Layout, shared, and tab-specific panels
│   ├── context/        # Global Dashboard State
│   ├── services/       # API and Blockchain services
│   ├── types/          # TypeScript definitions
│   └── styles/         # CSS design tokens
└── public/             # Static assets
```

---

*Built for institutional stability by Xibalba Solutions.*
