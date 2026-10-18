import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4174/mosters-party/'
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shots = 'test-results/dobble'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 39, soundOn: true }))
  window.__playedMedia = []
  const nativePlay = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (...args) {
    window.__playedMedia.push(this.currentSrc || this.src)
    return nativePlay.apply(this, args)
  }
})

const page = await context.newPage()
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

const score = async (player) => Number(await page.locator(`.dobble-score--${player === 0 ? 'one' : 'two'} strong`).innerText())
const lives = async (player) => Number((await page.locator(`.dobble-lives--${player === 0 ? 'one' : 'two'}`).getAttribute('aria-label')).match(/(\d+) lives/)[1])
const symbols = async (side) => page.locator(`.dobble-card--${side} .dobble-symbol`).evaluateAll((nodes) => nodes.map((node) => node.dataset.symbol))
const chooseShared = async (player) => {
  const left = await symbols('left')
  const right = await symbols('right')
  const shared = left.find((id) => right.includes(id))
  await page.locator(`.dobble-card--${player === 0 ? 'left' : 'right'} .dobble-symbol[data-symbol="${shared}"]`).click()
}

await page.goto(baseURL)
await page.locator('.dobble-scene').waitFor({ state: 'visible' })
await page.screenshot({ path: `${shots}/01-slide-40-start.png` })
await page.locator('.dobble-start').click()
if (await page.locator('.dobble-symbol').count() !== 10) throw new Error('The first Dobble round does not contain 10 symbols')
await page.screenshot({ path: `${shots}/02-slide-40-round.png` })

const left = await symbols('left')
const right = await symbols('right')
const wrong = left.find((id) => !right.includes(id))
await page.locator(`.dobble-card--left .dobble-symbol[data-symbol="${wrong}"]`).click()
await page.locator('.dobble-feedback--wrong').waitFor({ state: 'visible' })
if (await lives(0) !== 1 || await score(1) !== 1) throw new Error('Wrong answer did not remove Player 1 life and award Player 2')
await page.waitForTimeout(1050)

await chooseShared(1)
await page.locator('.dobble-feedback--correct').waitFor({ state: 'visible' })
if (await score(1) !== 2) throw new Error('Correct answer did not award Player 2')
await page.waitForTimeout(1050)

for (let index = 0; index < 3; index += 1) {
  await chooseShared(index % 2)
  await page.waitForTimeout(1050)
}
await page.locator('.dobble-result').waitFor({ state: 'visible' })
await page.screenshot({ path: `${shots}/03-slide-40-result.png` })
await page.getByRole('button', { name: 'NEXT', exact: true }).click()
if (await page.locator('.game-stage').getAttribute('data-scene') !== '40') throw new Error('Dobble NEXT did not advance to slide 41')

console.log(JSON.stringify({ errors, finalScores: [await score(0), await score(1)], finalScene: await page.locator('.game-stage').getAttribute('data-scene'), screenshots: 3 }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
