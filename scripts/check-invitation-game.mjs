import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const shots = 'test-results/invitation-game'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 4, soundOn: true }))
  window.__playedMedia = []
  const nativePlay = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (...args) {
    window.__playedMedia.push(this.currentSrc || this.src)
    return nativePlay.apply(this, args)
  }
})
const page = await context.newPage()
page.setDefaultTimeout(10_000)
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

const begin = async () => {
  await page.getByRole('button', { name: 'Open the mailbox' }).click()
  await page.getByRole('button', { name: 'Open the invitation' }).click()
  await page.locator('.invitation-card img').waitFor({ state: 'visible' })
}

const playCycle = async () => {
  const order = []
  for (let round = 0; round < 11; round += 1) {
    const image = await page.locator('.invitation-card img').getAttribute('src')
    const target = image.split('/').at(-1).split('.')[0]
    order.push(target)
    if (await page.locator('.game-stage').getAttribute('data-scene') !== '4') throw new Error(`Round ${round + 1} left the unified game`)
    if (await page.getByRole('button', { name: target[0].toUpperCase() + target.slice(1), exact: true }).isEnabled()) {
      throw new Error(`Monster choices are enabled before listening in round ${round + 1}`)
    }

    await page.getByRole('button', { name: 'Listen to the invitation' }).click()
    const welcome = await page.evaluate(() => window.__playedMedia.at(-1))
    if (!welcome.endsWith(`${target}-welcome.wav`)) throw new Error(`Wrong invitation voice in round ${round + 1}: ${welcome}`)

    if (round === 0) {
      const wrong = ['troll', 'skeleton', 'witch', 'vampire', 'ghost', 'raven'].find((id) => id !== target)
      await page.getByRole('button', { name: wrong[0].toUpperCase() + wrong.slice(1), exact: true }).click()
      const boo = await page.evaluate(() => window.__playedMedia.at(-1))
      if (!boo.endsWith(`${target}-boo.wav`)) throw new Error(`Wrong feedback sound: ${boo}`)
    }

    await page.getByRole('button', { name: target[0].toUpperCase() + target.slice(1), exact: true }).click()
    const correct = await page.evaluate(() => window.__playedMedia.at(-1))
    if (!correct.endsWith(`${target}-br.wav`)) throw new Error(`Wrong success sound in round ${round + 1}: ${correct}`)
    if (round === 0) await page.screenshot({ path: `${shots}/02-first-round.png` })

    if (round === 10) await page.locator('.invitation-game-over').waitFor({ state: 'visible' })
    else await page.waitForFunction((previousImage) => document.querySelector('.invitation-card img')?.getAttribute('src') !== previousImage, image)
  }
  if (new Set(order.slice(0, 6)).size !== 6 || new Set(order.slice(6)).size !== 5 || order[5] === order[6]) {
    throw new Error(`The 11 invitations are not shuffled into two non-repeating cycles: ${order.join(', ')}`)
  }
  return order
}

try {
  await page.goto(baseURL)
  await page.getByRole('button', { name: 'Open the mailbox' }).waitFor({ state: 'visible' })
  if (await page.locator('.project-slide-menu__grid button').count() !== 30) throw new Error('Slides 5–18 are not grouped in the menu')
  await page.screenshot({ path: `${shots}/01-mailbox.png` })
  await begin()
  await page.mouse.move(18, 450)
  await page.getByRole('button', { name: 'Slides 5–18: Invitation game' }).click()
  await page.getByRole('button', { name: 'Open the mailbox' }).waitFor({ state: 'visible' })
  await begin()
  const firstOrder = await playCycle()
  await page.screenshot({ path: `${shots}/03-game-over.png` })

  await page.getByRole('button', { name: 'Start again' }).click()
  await page.getByRole('button', { name: 'Open the mailbox' }).waitFor({ state: 'visible' })
  await begin()
  const replayOrder = await playCycle()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.locator('.game-stage[data-scene="18"] .source-video-scene').waitFor({ state: 'visible' })

  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(JSON.stringify({ game: 'slides 5–18', roundsPerPlay: 11, replay: true, nextSlide: 19, firstOrder, replayOrder, screenshots: 3 }, null, 2))
} finally {
  await browser.close()
}
