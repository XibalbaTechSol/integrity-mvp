const axios = require('axios');
const { ethers } = require('ethers');

const BACKEND_URL = 'http://localhost:8001';
const HEADERS = {
  headers: {
    Authorization: 'Bearer mock_demo_token'
  }
};

async function runValidation() {
  console.log('=== STARTING INTEGRITY PROTOCOL FLOW VALIDATION ===\n');

  try {
    // 1. Generate random keys for Agent and Controller
    const agentWallet = ethers.Wallet.createRandom();
    const controllerWallet = ethers.Wallet.createRandom();
    const agentAddress = agentWallet.address;
    const controllerAddress = controllerWallet.address;

    console.log(`Agent EVM Address: ${agentAddress}`);
    console.log(`Controller EVM Address: ${controllerAddress}`);

    // 2. Register Agent
    console.log('\n--- Step 1: Registering Agent ---');
    const registerRes = await axios.post(`${BACKEND_URL}/v1/agent/register`, {
      eth_address: agentAddress,
      alias: 'validator-agent-v1',
      description: 'Automated validation agent running telemetry test cycles.',
      xns_handle: `valagent-${Math.floor(Math.random() * 10000)}`
    }, HEADERS);
    console.log('Registration Success:', registerRes.data);

    // 3. Claim Ownership (Bind Controller)
    console.log('\n--- Step 2: Binding Controller (Ownership Claim) ---');
    const nonce = Math.floor(Math.random() * 1000000);
    const challengeMsg = `I, ${controllerAddress.toLowerCase()}, claim ownership and bind as controller for agent ${agentAddress.toLowerCase()} [nonce: ${nonce}]`;
    console.log(`Challenge Message: "${challengeMsg}"`);

    // Sign the challenge with the controller's private key
    const signature = await controllerWallet.signMessage(challengeMsg);
    console.log(`Generated Signature: ${signature.substring(0, 40)}...`);

    const bindRes = await axios.post(`${BACKEND_URL}/v1/agent/bind-controller`, {
      agent_address: agentAddress,
      controller_address: controllerAddress,
      signature: signature,
      message: challengeMsg
    }, HEADERS);
    console.log('Binding Success:', bindRes.data);

    // 4. Request a Loan (AIS Credit Line) using a pre-seeded agent with high AIS
    console.log('\n--- Step 3: Requesting Reputation-Backed Loan for Voyager ---');
    const voyagerAddress = '0xVoyagerVerified0000000000000000000000000';
    const agentRes = await axios.get(`${BACKEND_URL}/v1/agent/${voyagerAddress}`, HEADERS);
    const ais = agentRes.data.current_ais;
    const ceiling = (ais / 1000.0) * 5000.0;
    console.log(`Voyager AIS: ${ais} | Credit Ceiling: ${ceiling} ITK`);

    const loanRes = await axios.post(`${BACKEND_URL}/v1/loan/request`, {
      agent_address: voyagerAddress,
      amount: 400.0
    }, HEADERS);
    console.log('Loan Approval Success:', loanRes.data);

    // 5. Deploy SLA Contract
    console.log('\n--- Step 4: Deploying Custom SLA Contract ---');
    const slaRes = await axios.post(`${BACKEND_URL}/v1/factory/deploy/sla`, {
      agent_address: voyagerAddress,
      amount_itk: 250.0,
      min_ais: 750,
      duration_days: 15
    }, HEADERS);
    console.log('SLA Deployment Success:', slaRes.data);

    console.log('\n=== ALL INTEGRITY FLOWS VALIDATED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n!!! VALIDATION FAILED !!!');
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Error Details:', error.message);
    }
    process.exit(1);
  }
}

runValidation();
