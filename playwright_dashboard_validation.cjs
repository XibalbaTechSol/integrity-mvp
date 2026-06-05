const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function validateDashboard() {
  console.log('================================================================================');
  console.log('🛡️ PLAYWRIGHT DASHBOARD VALIDATION SWEEP');
  console.log('================================================================================');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Monitor page console and errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[PAGE_CONSOLE_ERROR]: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[PAGE_ERROR]: ${err.message}`);
  });

  // 1. Go to Login
  console.log('[PLAYWRIGHT] Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2. Authenticate as Demo User
  console.log('[PLAYWRIGHT] Authenticating with Demo credentials...');
  await page.fill('input[placeholder*="agent@xibalba.solutions or DEMO"]', 'demo');
  await page.fill('input[placeholder="••••••••"]', 'demo');
  await page.click('button[type="submit"]');

  // 3. Wait for URL change and dashboard fetch
  console.log('[PLAYWRIGHT] Waiting for redirect to dashboard...');
  await page.waitForURL('http://localhost:3000/dashboard', { timeout: 15000 });
  console.log('[PLAYWRIGHT] Redirect successful. Waiting for agent telemetry to fetch and render...');
  await page.waitForTimeout(5000); // Wait 5 seconds for complete REST fetch and animations

  // 4. Capture Page Content and assert presence of the 3 Hermes agents
  const bodyText = await page.innerText('body');
  
  console.log('\n=== Auditing UI Elements for Hermes Agents ===');
  const screenerFound = bodyText.includes('HermesScreener');
  const traderFound = bodyText.includes('HermesTrader');
  const riskFound = bodyText.includes('HermesRisk');

  console.log(`   * HermesScreener Visible: ${screenerFound ? 'YES ✓' : 'NO ✗'}`);
  console.log(`   * HermesTrader Visible:   ${traderFound ? 'YES ✓' : 'NO ✗'}`);
  console.log(`   * HermesRisk Visible:     ${riskFound ? 'YES ✓' : 'NO ✗'}`);

  // 5. Take Cockpit screenshot and save to Pictures
  const picturesDir = '/home/xibalba/Pictures';
  if (!fs.existsSync(picturesDir)) {
    fs.mkdirSync(picturesDir, { recursive: true });
  }
  const screenshotPath = path.join(picturesDir, 'integrity_cockpit_dashboard.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\n[PLAYWRIGHT] Saved dashboard screenshot to: ${screenshotPath}`);

  await browser.close();

  if (screenerFound && traderFound && riskFound) {
    console.log('================================================================================');
    console.log('✓ SUCCESS: Playwright validation complete. All 3 agents rendered cleanly!');
    console.log('================================================================================\n');
  } else {
    console.error('\n✗ FAILED: One or more Hermes agents were not rendered on the dashboard.');
    process.exit(1);
  }
}

validateDashboard().catch(err => {
  console.error('[PLAYWRIGHT_FAILED]', err);
  process.exit(1);
});
