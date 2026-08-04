# integrity-mvp: Production Gap Analysis

Following the pass that wired this frontend's core surfaces to real `integrity-oracle`
and on-chain data (agent fleet, AIS, stake, staking writes, ERC-20 transfers, audit log,
credit allocation, telemetry traces), the following gaps remain — documented per the
repo's no-silent-mocks rule rather than left as unmarked placeholder data.

## Closed this pass

* `DashboardContext` now sources `agents`, `selectedAgent`, `stats`, `user`, and
  `apiKeys` from `oracle.listAgents()`/`getAis()`/`getStake()`/`getLeaderboard()` and
  `userapi`, instead of a single hardcoded `agent_1` and static mock arrays.
* `Dashboard.tsx`, `COTPlatform.tsx`, `ShieldPage.tsx`, `TokenWallet.tsx`,
  `StakingPanel.tsx`, `IntegrityRadar.tsx` — all previously branched on
  `selectedAgent.id === 'agent_2'` or returned `setTimeout`-faked data; now read real
  AIS components, stake, trace trees, and audit-log entries.
* `PredictionMarketsPage.tsx` (a fully fake `markets = [...]` array, no oracle/chain
  imports) deleted; `/prediction-markets` now renders the real `ActuarialHub`.
* `AuthPage.tsx` now calls real `userapi.login`/`register`; the fake "Continue with
  Google" button (no Firebase project wired in this repo) was removed rather than left
  as a dead click.
* `SettingsContext`'s `createApiKey`/`deleteApiKey` now call real `userapi` endpoints;
  the UI's former name/expiry/permissions fields were dropped since the backend has no
  such per-key concept (only an AIS trust ceiling and revocation state).
* Fabricated numeric fallbacks (`?? 850`, `?? 895`, `?? 2500`, `tee_verified ?? true`)
  in `IdentityPage.tsx` and `IntegrityRadar.tsx` replaced with honest "no reading yet"
  states — these silently substituted a plausible-looking number for missing data,
  which is worse than an empty state because it's indistinguishable from real.
* Unit bug: `oracle.getWallet`/`getStake`/`getCredit` return raw on-chain wei strings
  (`U256::to_string()` server-side, confirmed against `integrity-oracle/backend/src/
  handlers.rs`), not human-readable ITK. `TokenWallet.tsx`, `StakingPanel.tsx`, and the
  `Dashboard.tsx`/`DashboardContext.tsx` stake displays were rendering these raw
  (e.g. a real 10,000 ITK balance showing as `10,000,000,000,000,000,000`) until caught
  by live-testing against a running oracle; now formatted with `ethers.formatEther()`
  everywhere, matching the convention `CreditPanel.tsx`/`ActuarialHub.tsx` already used.
* Two live "empty ABI" bugs found and fixed: `StakingPanel.tsx` and `CreditPanel.tsx`
  each built an `ethers.Contract(ITK_TOKEN_ADDRESS, [], signer)` with no ABI, so
  `allowance()`/`approve()` would have thrown on the very first real stake/allocation
  attempt. Both now use the shared `ERC20_ABI` from `src/chain/markets.ts`.
* **(2026-08-04) Shield's Shadow AI Discovery is now real.** New oracle endpoint
  `GET /v1/shield/unregistered-agents` (`db::list_unregistered_agents`,
  `handlers::get_unregistered_agents`) surfaces DIDs with real `otel_spans`/`audit_log`
  evidence that never registered via `POST /v1/agent/register` — a genuine, zero-new-infra
  detector using data the oracle already durably stores (no foreign key from either table
  to `agents`). `ShieldPage.tsx`'s panel now lists real results instead of a simulated
  scan. Deliberately not literal network/process scanning — see
  `bcc_middleware/spec/xibalba-shield-v1.md`'s `[PLANNED]` kernel-sensor design for that
  separate, out-of-scope vision. **Policy Rules panel stays honestly badged** — a real
  runtime toggle is possible (OPA's Data API against the pre-designed
  `data.clinical_allowlist.agents` extension point in `bcc_middleware/policies/bcc.rego`)
  but wasn't built this pass; general Rego rule edits still require an OPA container
  redeploy regardless (its `policies/` mount is read-only).
* **(2026-08-04) Health's Smart BAA flow is now real**, mirroring
  `integrity-dashboard/src/components/tabs/HealthPanel.tsx` (the validated reference
  implementation) exactly: `handleProposeBAA` calls `SmartBAAFactory.createBAA` after
  checking `CoveredEntityRegistry.isActiveCoveredEntity` (self-registers inline if the
  connected wallet holds `REGISTRAR_ROLE` — no separate bootstrap script needed),
  `handleSignBAA` funds+approves+signs via `SovereignAgent.execute`, and two flows
  dashboard never built are new here: `handleRaiseDispute` (CE-gated
  `SmartBAA.raiseDispute`) and `handleRevokeBAA` (`SmartBAA.revoke`). `handleArbitrate`
  is gated on `walletAddress === ARBITRATOR_ADDRESS`, matching dashboard's pattern
  exactly, not a `SeededDataBadge`. The BAA registry and Compliance Review Queue now read
  real `oracle.getAgentBaas()`/`getAuditLog()` data — the old fake `loadDefaultData()`
  seed arrays are gone. **Quarantine tab and the "Enclave Integrity: 100%" stat were
  removed/badged, not wired** — no on-chain or oracle-backend analog exists anywhere for
  either (confirmed against `integrity-dashboard`, which doesn't have them either).
* **EHRGate/consent — genuinely new ground, blocked on a real Base Sepolia deploy.**
  Unlike BAA, `integrity-dashboard` never built EHRGate wiring at all, so there was no
  reference to mirror. The specific blocker: `contracts/broadcast/DeployEHRGate.s.sol/`
  has only ever run against local anvil (chain id `31337`) — no `84532` directory exists
  — so `EHRGate` has no address on Base Sepolia yet, despite the contract itself being
  real and tested in isolation (`contracts/src/health/EHRGate.sol`). The full ABI
  (`grantAccess`/`revokeAccess`/`checkAccess`/`verifyAndLogAccess`/`accessGates`) is
  ready in `chain/shield.ts` for whenever `EHR_GATE_ADDRESS` exists in
  `deployments.baseSepolia.json` (the deploy script merges it in automatically). Until
  then, `HealthPage.tsx`'s "EHR Gates" tab stays local-state with an explicit
  `SeededDataBadge` naming this exact blocker — not a vague "still fake" note.
* **Investigated and deliberately NOT built: a server-side `/v1/stats/network`
  endpoint.** `docs/design/dashboard-wiring.md` records that `integrity-dashboard`'s team
  rejected this exact endpoint to avoid two disagreeing `protocol_staked_itk` numbers (a
  cached aggregate vs. a live per-agent read shown on the same page — a real risk here
  too, since `StakingPanel` shows "Protocol TVL" and "Your Stake" side by side and the
  latter refetches live after every tx). The AIS half would also have been a no-op:
  `effective_score` is already cached server-side (`leaderboard_cache`) and mvp already
  fetches it in one call via `getLeaderboard()` — only the stake fan-out had real cost,
  and that's the contradicted part. **Before re-proposing this, re-read
  `dashboard-wiring.md`'s reasoning first** — this was a considered decision, not an
  oversight. Client-side aggregation stays as-is: correct, just not infinitely scalable,
  which is fine at current (~10-agent) testnet scale.
* **No linear "AIS boost from stake" formula** — the real formula is a weighted
  geometric mean (`AIS = (S_e^0.30 · S_g^0.30 · S_s^0.20 · S_c^0.20) · ZK_boost`), so
  `StakingPanel`'s old "+X pts" estimate was fabricated and has been removed rather than
  replaced with another guess. There's no cheap client-side way to show a real estimate
  without duplicating `scoring-core`'s formula in TypeScript.
* **User identity has no real name/email absent a userapi session** — `DashboardContext`
  falls back to a wallet-address-derived display name (`0x1234...abcd`) and an
  identicon. This is honest (derived from the real connected address) but means most
  users browsing without signing in see a generic identity, not a personalized one.
* **Per-component null-safety audit is not exhaustive** — `selectedAgent` is now
  correctly typed `Agent | null` (there may be zero registered agents, or the fleet may
  still be loading). This pass added guards to `Dashboard.tsx`, `AppHeader.tsx`,
  `Sidebar.tsx`, `ShieldPage.tsx`, and `IntelligencePage.tsx`, the components that
  accessed `selectedAgent.*` unconditionally. `CreditPanel.tsx`, `PrivacyPanel.tsx`,
  `IdentityPanel.tsx`, `FactoryPanel.tsx`, `XNSRegisterForm.tsx`, and the two
  `TraceAnalysisPanel.tsx` copies were not individually re-audited for the null case in
  this pass — they already null-check before rendering their primary UI, but a
  root-cause review of every `selectedAgent.eth_address` call site against a genuinely
  empty fleet hasn't been done.
* **No CI** — per the root `CLAUDE.md`, `make test`/`make test-e2e` run by a human or
  agent is the enforcement mechanism; this pass didn't add or run this repo's e2e suite
  against a live stack (no `integrity-mvp` Playwright config exists yet).
