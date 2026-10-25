import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shots = 'test-results/final-slides'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 40, soundOn: true }))
})

const page = await context.newPage()
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

const scene = () => page.locator('.game-stage').getAttribute('data-scene')
const videoInfo = () => page.locator('.source-video-scene video').evaluate((video) => ({
  source: video.currentSrc,
  width: video.videoWidth,
  height: video.videoHeight,
  readyState: video.readyState,
}))
const waitForMetadata = () => page.locator('.source-video-scene video').evaluate((video) => new Promise((resolve) => {
  if (video.readyState >= 1) resolve()
  else video.addEventListener('loadedmetadata', resolve, { once: true })
}))
const seekTo = (seconds) => page.locator('.source-video-scene video').evaluate((video, time) => new Promise((resolve) => {
  video.pause()
  video.currentTime = time
  if (Math.abs(video.currentTime - time) < 0.05 && video.readyState >= 2) resolve()
  else video.addEventListener('seeked', resolve, { once: true })
}), seconds)

await page.goto(baseURL)
await page.locator('.source-video-scene video').waitFor({ state: 'visible' })
await waitForMetadata()
if (await page.locator('.project-slide-menu__grid button').count() !== 30) throw new Error('Slide menu does not group slides 5–18 into one game')
const troll = await videoInfo()
if (!troll.source.endsWith('/assets/video/slide-41-troll.mp4') || troll.width !== 1280 || troll.height !== 704) throw new Error(`Wrong slide 41 video: ${JSON.stringify(troll)}`)
await seekTo(4)
await page.screenshot({ path: `${shots}/01-slide-41-troll-video.png` })

await page.getByRole('button', { name: 'NEXT', exact: true }).click()
await waitForMetadata()
if (await scene() !== '41') throw new Error('Slide 41 did not advance to slide 42')
const song = await videoInfo()
if (!song.source.endsWith('/assets/video/slide-42-song.mp4') || song.width !== 1920 || song.height !== 1080) throw new Error(`Wrong slide 42 video: ${JSON.stringify(song)}`)
if (!await page.locator('.source-video-scene video').evaluate((video) => video.autoplay)) throw new Error('Slide 42 song is not configured to autoplay')
await seekTo(5)
await page.screenshot({ path: `${shots}/02-slide-42-song.png` })

await page.getByRole('button', { name: 'NEXT', exact: true }).click()
await page.locator('.final-scene').waitFor({ state: 'visible' })
if (await scene() !== '42') throw new Error('Slide 42 did not advance to slide 43')
await page.screenshot({ path: `${shots}/03-slide-43-final.png` })
console.log(JSON.stringify({ errors, menuEntries: 30, troll, song, finalScene: await scene(), screenshots: 3 }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
