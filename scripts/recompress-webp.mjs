import { readdir, readFile, rename, stat, unlink } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve('public/assets/images')
const apply = process.argv.includes('--apply')

async function webpFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? webpFiles(path) : entry.name.endsWith('.webp') ? [path] : []
  }))
  return files.flat().sort()
}

async function visiblePixelsMatch(original, candidate) {
  const a = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const b = await sharp(candidate).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return false
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] !== b.data[i + 3]) return false
    if (a.data[i + 3] > 0 && (
      a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]
    )) return false
  }
  return true
}

let oldBytes = 0
let newBytes = 0
for (const file of await webpFiles(root)) {
  const source = await readFile(file)
  const metadata = await sharp(source).metadata()
  if (metadata.icc) {
    console.log(`SKIP ${relative(root, file)}: embedded color profile`)
    continue
  }
  const encoded = await sharp(source).webp({ lossless: true, effort: 6 }).toBuffer()
  if (encoded.length >= source.length) continue
  const name = relative(root, file)
  if (apply) {
    const temp = `${file}.optimized.tmp.webp`
    await sharp(source).webp({ lossless: true, effort: 6 }).toFile(temp)
    try {
      if (!await visiblePixelsMatch(file, temp)) throw new Error(`Pixel verification failed: ${name}`)
      await rename(temp, file)
    } finally {
      try { await stat(temp); await unlink(temp) } catch { /* renamed */ }
    }
  }
  oldBytes += source.length
  newBytes += encoded.length
  console.log(`${apply ? 'OPTIMIZED' : 'CANDIDATE'} ${name}: ${(source.length / 1024).toFixed(0)} → ${(encoded.length / 1024).toFixed(0)} KiB`)
}
console.log(`TOTAL: ${(oldBytes / 1024 / 1024).toFixed(2)} → ${(newBytes / 1024 / 1024).toFixed(2)} MiB${apply ? ' (lossless, alpha verified)' : ' potential'}`)
