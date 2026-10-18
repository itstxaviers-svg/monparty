import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4174/mosters-party/'
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shots = 'test-results/video-quality'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 35, soundOn: true }))
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
page.on('requestfailed', (request) => errors.push(`FAILED ${request.url()}: ${request.failure()?.errorText}`))

await page.goto(baseURL)
const video = page.locator('.source-video-scene--transition > video')
await video.waitFor({ state: 'visible' })
await video.evaluate(async (node) => {
  await new Promise((resolve) => {
    if (node.readyState >= 2) resolve()
    else node.addEventListener('loadeddata', resolve, { once: true })
  })
  node.currentTime = Math.min(1.5, node.duration / 2)
  await new Promise((resolve) => node.addEventListener('seeked', resolve, { once: true }))
  node.pause()
})

const details = await video.evaluate((node) => {
  const style = getComputedStyle(node)
  const box = node.getBoundingClientRect()
  return {
    source: node.currentSrc,
    videoWidth: node.videoWidth,
    videoHeight: node.videoHeight,
    objectFit: style.objectFit,
    renderedWidth: Math.round(box.width),
    renderedHeight: Math.round(box.height),
  }
})
if (details.videoWidth !== 1620 || details.videoHeight !== 1080) throw new Error(`Unexpected video resolution: ${details.videoWidth}x${details.videoHeight}`)
if (details.objectFit !== 'cover') throw new Error(`Video is still stretched: object-fit=${details.objectFit}`)
await page.screenshot({ path: `${shots}/slide-36-corrected.png` })

console.log(JSON.stringify({ errors, ...details, screenshot: `${shots}/slide-36-corrected.png` }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
