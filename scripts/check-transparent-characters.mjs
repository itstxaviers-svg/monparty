import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const shots = 'test-results/transparent-characters'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  for (const { scene, selector, label } of [
    { scene: 2, selector: '.source-character', label: 'meet' },
    { scene: 19, selector: '.feelings-actor', label: 'feelings' },
  ]) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
    await context.addInitScript((initialScene) => {
      localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: initialScene, soundOn: true }))
    }, scene)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
    await page.goto(baseURL)
    await page.locator(`${selector} img`).first().waitFor({ state: 'visible' })
    await page.waitForFunction((characterSelector) => [...document.querySelectorAll(`${characterSelector} img`)].every((img) => img.complete && img.naturalWidth > 0), selector)
    const count = await page.locator(`${selector} img`).count()
    const opaqueVideos = await page.locator(`${selector} video`).count()
    if (count !== 6 || opaqueVideos !== 0 || errors.length) throw new Error(`${label}: images=${count}, videos=${opaqueVideos}, errors=${errors.join('; ')}`)
    await page.screenshot({ path: `${shots}/${label}.png` })
    console.log(`${label}: six transparent-image assets loaded; no opaque character videos`)
    await context.close()
  }
} finally {
  await browser.close()
}
