import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4174/mosters-party/'
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shots = 'test-results/cafe-slides'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: chrome, headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 26, soundOn: true }))
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
page.on('requestfailed', (request) => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`FAILED ${request.url()}`) })

const scene = () => page.locator('.game-stage').getAttribute('data-scene')
const moveToSide = async (x) => {
  await page.mouse.move(x, 450)
  await page.waitForTimeout(240)
}

await page.goto(baseURL)
await page.locator('.cafe-order-scene').waitFor({ state: 'visible' })
await page.screenshot({ path: `${shots}/01-slide-27-witch-game.png` })

await moveToSide(20)
const previousOpacity = await page.getByRole('button', { name: 'Previous slide', exact: true }).evaluate((node) => getComputedStyle(node).opacity)
await page.screenshot({ path: `${shots}/02-left-navigation.png` })
await page.mouse.click(20, 450)
await page.waitForTimeout(120)
if (await scene() !== '25') throw new Error('Left sidebar did not open the previous slide')

await moveToSide(1580)
const nextOpacity = await page.getByRole('button', { name: 'Next slide', exact: true }).evaluate((node) => getComputedStyle(node).opacity)
await page.mouse.click(1580, 450)
await page.waitForTimeout(120)
if (await scene() !== '26') throw new Error('Right sidebar did not open the next slide')

await page.getByRole('button', { name: 'TOAST', exact: true }).click()
if (await page.locator('.is-feedback-wrong').count() !== 1) throw new Error('Wrong choice feedback did not appear')
await page.waitForTimeout(560)
await page.getByRole('button', { name: 'PEACH', exact: true }).click()
await page.locator('.cafe-reaction').waitFor({ state: 'visible' })
if (await page.locator('.cafe-food-choice:disabled').count() !== 6) throw new Error('Food choices did not lock after the correct answer')
await page.waitForTimeout(500)
await page.screenshot({ path: `${shots}/03-correct-reaction.png` })

const expected = new Map([
  [27, 'slide-28-ghost.mp4'], [28, 'toast'], [29, 'slide-30-raven.mp4'], [30, 'bacon'],
  [31, 'slide-32-vampire.mp4'], [32, 'juice'], [33, 'slide-34-troll.mp4'], [34, 'roll'],
  [35, 'slide-36-skeleton.mp4'], [36, 'melon'], [37, 'slide-38-full.mp4'],
])
for (const [targetScene, expectedContent] of expected) {
  await page.getByRole('button', { name: 'Next slide', exact: true }).click()
  await page.waitForTimeout(100)
  if (await scene() !== String(targetScene)) throw new Error(`Could not navigate to scene ${targetScene}`)
  if (expectedContent.endsWith('.mp4')) {
    const source = await page.locator('.source-video-scene video').getAttribute('src')
    if (!source?.endsWith(expectedContent)) throw new Error(`Wrong video on scene ${targetScene}: ${source}`)
  } else if (await page.getByRole('button', { name: expectedContent.toUpperCase(), exact: true }).count() !== 1) {
    throw new Error(`Correct food ${expectedContent} missing on scene ${targetScene}`)
  }
}
await page.screenshot({ path: `${shots}/04-slide-38-full-video.png` })

await page.getByRole('button', { name: 'Next slide', exact: true }).click()
await page.locator('.food-word-switcher').waitFor({ state: 'visible' })
await page.screenshot({ path: `${shots}/05-slide-39-switcher.png` })
await page.getByRole('button', { name: 'Choose a food word', exact: true }).click()
await page.waitForTimeout(380)
const firstWord = await page.locator('.food-word-display span').innerText()
const firstAudio = await page.evaluate(() => window.__playedMedia.at(-1))
if (!firstAudio?.toLowerCase().endsWith(`/food/${firstWord.toLowerCase()}.wav`)) throw new Error(`Word/audio mismatch: ${firstWord} / ${firstAudio}`)
await page.getByRole('button', { name: 'Choose a food word', exact: true }).click()
await page.waitForTimeout(380)
const secondWord = await page.locator('.food-word-display span').innerText()
if (secondWord === firstWord) throw new Error('The randomizer repeated the previous word immediately')
await page.screenshot({ path: `${shots}/06-slide-39-word.png` })
await page.getByRole('button', { name: 'NEXT', exact: true }).click()
if (await scene() !== '39') throw new Error('Slide 39 NEXT button did not advance')

console.log(JSON.stringify({ errors, previousOpacity, nextOpacity, firstWord, secondWord, finalScene: await scene(), screenshots: 6 }, null, 2))
await browser.close()
if (errors.length) process.exitCode = 1
