import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/monparty/'
const shots = 'test-results/memory-style'
await mkdir(shots, { recursive: true })

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
await context.addInitScript(() => {
  localStorage.setItem('monsterPartyOriginalSave_v2', JSON.stringify({ scene: 23, soundOn: false }))
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })

try {
  await page.goto(baseURL)
  const cards = page.locator('.source-memory-grid button')
  if (await cards.count() !== 12) throw new Error('Memory game does not show 12 cards')
  await page.screenshot({ path: `${shots}/01-closed-cards.png` })

  const pair = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('.source-memory-grid button')]
    const picture = elements.findIndex((card) => card.querySelector('.source-card-front img'))
    const label = elements[picture].querySelector('.source-card-front img').alt
    const word = elements.findIndex((card) => card.querySelector('.source-card-front b')?.textContent === label)
    return { picture, word, label }
  })
  if (pair.picture < 0 || pair.word < 0) throw new Error('Matching picture and word were not found')

  await cards.nth(pair.picture).click()
  await cards.nth(pair.word).click()
  await page.locator('.source-memory-grid button.is-matched').first().waitFor({ state: 'visible' })
  await page.screenshot({ path: `${shots}/02-matched-pair.png` })

  const style = await page.evaluate(() => ({
    backFont: getComputedStyle(document.querySelector('.source-card-back')).fontFamily,
    wordFont: getComputedStyle(document.querySelector('.source-card-front b')).fontFamily,
    backBackground: getComputedStyle(document.querySelector('.source-card-back')).backgroundImage,
    frontBackground: getComputedStyle(document.querySelector('.source-card-front')).backgroundImage,
  }))
  if (!style.backFont.includes('Irish') || !style.wordFont.includes('Irish')) throw new Error(`Wrong card fonts: ${JSON.stringify(style)}`)
  if (await page.locator('.source-memory-grid button.is-matched').count() !== 2) throw new Error('Matching pair was not kept open')
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)

  console.log(JSON.stringify({ cards: 12, matchedPair: pair.label, fonts: [style.backFont, style.wordFont], screenshots: 2, errors }, null, 2))
} finally {
  await browser.close()
}
