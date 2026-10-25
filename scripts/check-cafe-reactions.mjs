import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const shots = 'test-results/cafe-reactions'
const cases = [
  { id: 'witch', scene: 26, food: 'PEACH', file: 'food-reaction-wi.mp4' },
  { id: 'ghost', scene: 28, food: 'TOAST', file: 'food-reaction-gh.mp4' },
  { id: 'raven', scene: 30, food: 'BACON', file: 'food-reaction-r.mp4' },
  { id: 'vampire', scene: 32, food: 'JUICE', file: 'food-reaction-v.mp4' },
  { id: 'troll', scene: 34, food: 'ROLL', file: 'food-reaction-tr.mp4' },
  { id: 'skeleton', scene: 36, food: 'MELON', file: 'food-reaction-sk.mp4' },
]

await mkdir(shots, { recursive: true })
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const errors = []

try {
  for (const entry of cases) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
    await context.addInitScript((scene) => {
      localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene, soundOn: true }))
      window.__playedMedia = []
      const nativePlay = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function (...args) {
        window.__playedMedia.push(this.currentSrc || this.src)
        return nativePlay.apply(this, args)
      }
    }, entry.scene)
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(`${entry.id}: ${error.message}`))
    page.on('response', (response) => { if (response.status() >= 400) errors.push(`${entry.id}: ${response.status()} ${response.url()}`) })

    await page.goto(baseURL)
    await page.locator('.cafe-order-scene').waitFor({ state: 'visible' })
    const wrongFood = entry.food === 'TOAST' ? 'PEACH' : 'TOAST'
    await page.getByRole('button', { name: wrongFood, exact: true }).click()
    if (await page.locator('.cafe-reaction').count() !== 0) throw new Error(`${entry.id}: reaction appeared after a wrong choice`)
    const wrongAudio = await page.evaluate(() => window.__playedMedia.at(-1))
    if (!wrongAudio?.endsWith('-boo.wav')) throw new Error(`${entry.id}: wrong feedback audio: ${wrongAudio}`)

    await page.getByRole('button', { name: entry.food, exact: true }).click()
    const reaction = page.locator('.cafe-reaction')
    await reaction.waitFor({ state: 'visible' })
    const source = await reaction.getAttribute('src')
    if (!source?.endsWith(entry.file)) throw new Error(`${entry.id}: wrong reaction file: ${source}`)
    await page.waitForFunction(() => {
      const video = document.querySelector('.cafe-reaction')
      return video && video.readyState >= 2 && video.currentTime > 2
    })
    if (await page.locator('.cafe-food-choice:disabled').count() !== 6) throw new Error(`${entry.id}: food choices were not locked`)
    const correctAudio = await page.evaluate(() => window.__playedMedia.filter((source) => source.endsWith('-br.wav')).at(-1))
    if (!correctAudio?.endsWith(`${entry.id}-br.wav`)) throw new Error(`${entry.id}: correct feedback audio: ${correctAudio}`)
    await page.screenshot({ path: `${shots}/${entry.id}.png` })

    await page.getByRole('button', { name: 'NEXT', exact: true }).click()
    if (await page.locator('.game-stage').getAttribute('data-scene') !== String(entry.scene + 1)) {
      throw new Error(`${entry.id}: NEXT did not advance to the following slide`)
    }
    await context.close()
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(JSON.stringify({ monsters: cases.map((entry) => entry.id), wrongAnswerAudio: true, reactionsPlay: true, nextSlides: true, screenshots: cases.length, errors }, null, 2))
} finally {
  await browser.close()
}
