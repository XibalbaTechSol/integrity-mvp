export const ITK_TOKEN_ADDRESS = "0x2fE2D055Ac894538CCFB2146eA18a604f874FDEE";
export const REPUTATION_REGISTRY_ADDRESS = "0x765D12651DA806239675911d1908b02189DeEc88";
export const INTEGRITY_PROTOCOL_ADDRESS = "0x93e705c63c3c6F517B6fa214CA115c9cF222f75E"; // StateAnchor as main protocol entry
export const XIBALBA_AGENT_ADDRESS = "0x79eDf9d21F55a658636DFb3465Ba9bbA009f9D84";




export const NO_CODE_FACTORY_ADDRESS = "0x2e35aDd0ec480A301B02aF2619a55cE6d790d3a8";

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const RPC_URL = "https://sepolia.base.org";

export const IS_PRODUCTION = false; // Toggle for Mainnet migration

export const API_BASE = import.meta.env.VITE_API_BASE || 
  (typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://127.0.0.1:8080" 
    : "https://integrity-protocol-backend.onrender.com");


