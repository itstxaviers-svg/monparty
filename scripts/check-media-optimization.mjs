import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const screenshots = 'test-results/media-optimization'
await mkdir(screenshots, { recursive: true })

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 0, soundOn: true }))
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
const audioRequests = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
page.on('request', (request) => { if (request.url().endsWith('.wav')) audioRequests.push(request.url()) })

await page.goto(baseURL)
await page.locator('.source-scene').waitFor({ state: 'visible' })
console.log('Cover loaded')
if (audioRequests.length) throw new Error(`Initial slide requested ${audioRequests.length} audio files`)
await page.screenshot({ path: `${screenshots}/01-cover.png` })

await page.mouse.move(18, 450)
await page.getByRole('button', { name: 'Slides 5–18: Invitation game' }).click()
await page.getByRole('button', { name: 'Open the mailbox' }).click()
await page.getByRole('button', { name: 'Open the invitation' }).click()
await page.locator('.invitation-card img').waitFor({ state: 'visible' })
console.log('Invitation loaded')
const targetImage = await page.locator('.invitation-card img').getAttribute('src')
const target = targetImage.split('/').at(-1).split('.')[0]
await page.waitForTimeout(500)
if (audioRequests.length !== 3) throw new Error(`Invitation preloaded ${audioRequests.length} audio files instead of 3`)
await page.getByRole('button', { name: 'Listen to the invitation' }).click()
const played = await page.evaluate(() => window.__playedMedia.at(-1))
if (!played.endsWith(`${target}-welcome.wav`)) {
  throw new Error(`Unexpected invitation voice: ${played}`)
}
await page.screenshot({ path: `${screenshots}/02-invitation.png` })
const wrongChoice = ['Troll', 'Skeleton', 'Witch', 'Vampire', 'Ghost', 'Raven'].find((name) => name.toLowerCase() !== target)
await page.getByRole('button', { name: wrongChoice, exact: true }).click()
const wrongVoice = await page.evaluate(() => window.__playedMedia.at(-1))
if (!wrongVoice.endsWith(`${target}-boo.wav`)) throw new Error(`Unexpected wrong-answer sound: ${wrongVoice}`)
await page.getByRole('button', { name: target[0].toUpperCase() + target.slice(1), exact: true }).click()
const correctVoice = await page.evaluate(() => window.__playedMedia.at(-1))
if (!correctVoice.endsWith(`${target}-br.wav`)) throw new Error(`Unexpected right-answer sound: ${correctVoice}`)
await page.waitForFunction((previous) => {
  const image = document.querySelector('.invitation-card img')
  return image && image.getAttribute('src') !== previous && document.querySelector('.game-stage')?.getAttribute('data-scene') === '4'
}, targetImage)

await page.mouse.move(18, 450)
await page.getByRole('button', { name: 'Slide 36: Skeleton order' }).click()
const video = page.locator('.source-video-scene video')
await video.waitFor({ state: 'visible' })
const properties = await video.evaluate((element) => new Promise((resolve) => {
  const inspect = () => resolve({ width: element.videoWidth, height: element.videoHeight, readyState: element.readyState })
  if (element.readyState >= 1) inspect()
  else element.addEventListener('loadedmetadata', inspect, { once: true })
}))
if (properties.width !== 1620 || properties.height !== 1080) throw new Error(`Video dimensions changed: ${JSON.stringify(properties)}`)
await video.evaluate((element) => new Promise((resolve) => {
  element.pause()
  element.currentTime = Math.min(1, element.duration / 2)
  element.addEventListener('seeked', resolve, { once: true })
}))
await page.mouse.move(1500, 450)
await page.screenshot({ path: `${screenshots}/03-video.png` })

console.log(JSON.stringify({ initialAudioRequests: 0, target, invitationFeedback: 'passed', properties, errors, screenshots: 3 }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
