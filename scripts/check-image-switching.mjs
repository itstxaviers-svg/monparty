import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4175/monparty/'
const shots = 'test-results/image-switching'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.addInitScript((scene) => {
    localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene, soundOn: true }))
  }, 0)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  await page.goto(baseURL)

  const backgroundIsPreserved = await page.locator('.source-scene').evaluate((element) => getComputedStyle(element).backgroundSize === 'cover')
  if (!backgroundIsPreserved) throw new Error('Slide background is not scaled proportionally')
  await page.screenshot({ path: `${shots}/cover.png` })
  await page.getByRole('button', { name: 'NEXT' }).click()
  await page.waitForFunction(() => ['witch', 'skeleton', 'troll', 'vampire', 'ghost', 'raven'].every((id) =>
    performance.getEntriesByType('resource').some((entry) => entry.name.endsWith(`/characters/${id}.webp`) && entry.responseEnd > 0)))
  await page.getByRole('button', { name: 'NEXT' }).click()
  const characters = await page.locator('.source-character img').evaluateAll((images) => images.map((image) => ({
    loaded: image.complete && image.naturalWidth > 0,
    fit: getComputedStyle(image).objectFit,
  })))
  if (characters.length !== 6 || characters.some((image) => !image.loaded || image.fit !== 'contain')) {
    throw new Error(`Characters were delayed or stretched: ${JSON.stringify(characters)}`)
  }
  await page.screenshot({ path: `${shots}/meet.png` })
  await context.close()

  const gameContext = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await gameContext.addInitScript((scene) => {
    localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene, soundOn: true }))
  }, 4)
  const gamePage = await gameContext.newPage()
  gamePage.on('pageerror', (error) => errors.push(error.message))
  gamePage.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  await gamePage.goto(baseURL)
  await gamePage.waitForFunction(() => ['witch', 'skeleton', 'troll', 'vampire', 'ghost', 'raven'].every((id) =>
    performance.getEntriesByType('resource').some((entry) => entry.name.endsWith(`/invitation/${id}.webp`) && entry.responseEnd > 0)))
  await gamePage.getByRole('button', { name: 'Open the mailbox' }).click()
  await gamePage.getByRole('button', { name: 'Open the invitation' }).click()
  const card = gamePage.locator('.invitation-card img')
  const firstImage = await card.getAttribute('src')
  const firstLoaded = await card.evaluate((image) => image.complete && image.naturalWidth > 0)
  if (!firstLoaded) throw new Error('First invitation image appeared late')
  const correctMonster = firstImage.split('/').pop().replace('.webp', '')
  await gamePage.getByRole('button', { name: 'Listen to the invitation' }).click()
  const wrongMonster = ['witch', 'skeleton', 'troll', 'vampire', 'ghost', 'raven'].find((id) => id !== correctMonster)
  await gamePage.locator(`[data-monster="${wrongMonster}"]`).click()
  if (!(await gamePage.locator(`[data-monster="${wrongMonster}"]`).getAttribute('class')).includes('is-wrong')) {
    throw new Error('Wrong-answer feedback is missing')
  }
  await gamePage.locator(`[data-monster="${correctMonster}"]`).click()
  await gamePage.waitForFunction((source) => document.querySelector('.invitation-card img')?.getAttribute('src') !== source, firstImage)
  const nextLoaded = await card.evaluate((image) => image.complete && image.naturalWidth > 0)
  if (!nextLoaded) throw new Error('Next invitation image appeared late')
  await gamePage.screenshot({ path: `${shots}/invitation-next.png` })
  await gameContext.close()

  if (errors.length) throw new Error(errors.join('; '))
  console.log('PASS: proportional scene art; six characters and next invitation appear already loaded')
} finally {
  await browser.close()
}
