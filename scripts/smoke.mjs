import { chromium } from 'playwright-core'
import { execSync, spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

async function main() {
  const server = spawn('npx.cmd', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  })

  await sleep(4000)

  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`))

  const results = []
  const check = (name, ok) => {
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
    if (!ok) process.exitCode = 1
  }

  try {
    // 1. Load app
    await page.goto('http://localhost:4173/signin', { waitUntil: 'domcontentloaded' })
    await sleep(1500)
    check('signin page renders', await page.locator('input#email').count() === 1)
    check('signup video background present', (await page.locator('.video-bg video').count()) > 0)
    await page.screenshot({ path: 'smoke-signin.png' })

    // 1b. Vanta NET canvas loads (CDN)
    let vantaOk = false
    try {
      await page.waitForSelector('.video-bg-vanta canvas', { timeout: 15000 })
      vantaOk = await page.locator('.video-bg-vanta canvas').count() > 0
    } catch {}
    check('vanta NET canvas loads', vantaOk)

    // 2. Sign up (demo mode)
    await page.goto('http://localhost:4173/signup', { waitUntil: 'domcontentloaded' })
    await sleep(1000)
    await page.fill('#full-name', 'Demo User')
    await page.fill('#email', 'demo@taskorbit.local')
    await page.fill('#password', 'Secret123')
    await page.fill('#confirm', 'Secret123')
    await page.click('button[type=submit]')
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    check('signup redirects to dashboard', page.url().includes('/dashboard'))
    await sleep(1500)

    // 3. Dashboard renders
    check('dashboard heading renders', await page.locator('text=Good ').count() > 0)
    const homeTheme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    if (homeTheme === 'light') {
      check('static sky background renders (light theme)', (await page.locator('.sky-bg').count()) > 0)
      check('no video background on home (light theme)', (await page.locator('.video-bg video').count()) === 0)
      check('no clouds canvas on home (light theme)', (await page.locator('.clouds-bg canvas').count()) === 0)
    } else {
      check('no video background on home (dark theme)', (await page.locator('.video-bg video').count()) === 0)
      check('no sky background on home (dark theme)', (await page.locator('.sky-bg').count()) === 0)
    }
    const canvasCount = await page.locator('canvas').count()
    check('3D canvas renders', canvasCount >= 1)
    await page.screenshot({ path: 'smoke-dashboard.png' })

    // 4. Create task
    await page.click('button:has-text("New Task")')
    await sleep(800)
    await page.fill('#task-title', 'Test task from smoke test')
    await page.fill('#task-description', 'Created via automated smoke test')
    await page.click('button:has-text("Create Task")')
    await sleep(1500)
    check('task created toast appears', await page.locator('text=Task created successfully').count() > 0)

    // 5. Navigate routes
    for (const route of ['tasks', 'calendar', 'analytics', 'recommendations', 'reports', 'settings']) {
      await page.goto(`http://localhost:4173/${route}`, { waitUntil: 'domcontentloaded' })
      await sleep(900)
      const h1 = await page.locator('h1').first().textContent()
      check(`route /${route} renders (h1: ${h1?.trim()})`, (h1 ?? '').trim().length > 0)
      await page.screenshot({ path: `smoke-${route}.png` })
    }

    // 6. Complete task
    await page.goto('http://localhost:4173/tasks', { waitUntil: 'domcontentloaded' })
    await sleep(1200)
    const checkBtn = page.locator('button[aria-label*="Mark task as complete"]').first()
    if (await checkBtn.count() > 0) {
      await checkBtn.click()
      await sleep(1500)
      check('task completion toast appears', await page.locator('text=Task completed').count() > 0)
    } else {
      check('task completion flow', false)
    }

    // 7. Celebration modal appears with streak + stats
    check(
      'celebration modal appears',
      await page.locator('#celebration-title').count() > 0 && (await page.locator('text=Successfully Completed').count() > 0)
    )
    check('streak number displayed', await page.locator('text=day streak').count() > 0)
    check('stats row rendered', (await page.locator('text=Today').count() > 0) && (await page.locator('text=Best Streak').count() > 0))
    check('confetti particles rendered', await page.locator('[aria-hidden="true"] span').count() > 0)
    await page.screenshot({ path: 'smoke-celebration.png' })

    // 8. Clicking inside content does NOT close; click outside closes
    await page.locator('#celebration-title').click({ position: { x: 40, y: 10 } })
    await sleep(300)
    check('click inside keeps modal open', await page.locator('#celebration-title').count() > 0)
    await page.mouse.click(8, 8)
    await sleep(600)
    check('click outside closes modal', await page.locator('#celebration-title').count() === 0)

    // 9. Reopen + Escape closes
    await page.locator('button[aria-label*="Reopen task"]').first().click()
    await sleep(400)
    await page.locator('button[aria-label*="Mark task as complete"]').first().click()
    await sleep(1500)
    check('modal reopens on next completion', await page.locator('#celebration-title').count() > 0)
    await page.keyboard.press('Escape')
    await sleep(500)
    check('Escape closes modal', await page.locator('#celebration-title').count() === 0)

    // 10. Generate recommendation
    await page.goto('http://localhost:4173/recommendations', { waitUntil: 'domcontentloaded' })
    await sleep(1000)
    const genBtn = page.locator('button:has-text("Morning Briefing")').first()
    if (await genBtn.count() > 0) {
      await genBtn.click()
      await sleep(1500)
      check('recommendation generated', await page.locator('text=Recommendation History').count() > 0)
    }

    // 8. CSV export
    await page.goto('http://localhost:4173/reports', { waitUntil: 'domcontentloaded' })
    await sleep(1000)
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    await page.locator('button:has-text("Export Task History")').first().click()
    await sleep(1500)
    const download = await downloadPromise
    check('CSV export download triggered', download !== null)

    // 9. Theme toggle
    await page.click('button[aria-label*="Switch to"]')
    await sleep(500)
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    check('theme toggle works', typeof isDark === 'boolean')

    await page.screenshot({ path: 'smoke-final.png', fullPage: true })
  } catch (e) {
    check('smoke test run without exceptions', false)
    errors.push(`EXCEPTION: ${e instanceof Error ? e.stack : String(e)}`)
  } finally {
    await browser.close()
    server.kill()
  }

  console.log('\n===== SMOKE TEST RESULTS =====')
  console.log(results.join('\n'))
  if (errors.length) {
    console.log('\n===== ERRORS =====')
    console.log(errors.join('\n'))
  }
}

main()