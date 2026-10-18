import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4174/mosters-party/'
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shots = 'test-results/slide-menu'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 39, soundOn: true }))
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

await page.goto(baseURL)
await page.locator('.project-slide-menu').waitFor({ state: 'visible' })
if (await page.locator('.project-nav').count() !== 0) throw new Error('Old arrow navigation is still present')
if (await page.locator('.project-slide-menu__grid button').count() !== 43) throw new Error('Slide menu does not contain all 43 slides')
await page.screenshot({ path: `${shots}/01-menu-hidden.png` })

await page.mouse.move(20, 450)
await page.locator('.project-slide-menu__panel').waitFor({ state: 'visible' })
const current = page.locator('.project-slide-menu__grid button[aria-current="page"]')
if (await current.innerText() !== '40') throw new Error('Current slide number is not highlighted')
await page.screenshot({ path: `${shots}/02-menu-open.png` })

await page.getByRole('button', { name: 'Slide 24: Memory game', exact: true }).click()
if (await page.locator('.game-stage').getAttribute('data-scene') !== '23') throw new Error('Slide number did not open the selected slide')
await page.mouse.move(800, 450)
await page.screenshot({ path: `${shots}/03-slide-24-selected.png` })

console.log(JSON.stringify({ errors, buttons: 43, selectedSlide: 24, screenshots: 3 }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
