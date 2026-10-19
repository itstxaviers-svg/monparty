import { constants, readFileSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readdir, rename, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const imageRoot = resolve('public/assets/images')
const backupRoot = resolve('archive/media-originals-2026-10-19/images')
const apply = process.argv.includes('--apply')

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.error?.message}`)
  return result.stdout
}

function pngChunks(file) {
  const bytes = readFileSync(file)
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null
  const chunks = new Set()
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset)
    chunks.add(bytes.toString('ascii', offset + 4, offset + 8))
    offset += length + 12
  }
  return chunks
}

function pixelHash(file) {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-f', 'framemd5', '-'])
    .split('\n').find((line) => line.startsWith('0,'))?.split(',').at(-1)?.trim()
}

async function pngsIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? pngsIn(path) : entry.name.endsWith('.png') ? [path] : []
  }))
  return nested.flat().sort()
}

const temporaryRoot = apply ? await mkdtemp(join(tmpdir(), 'monparty-png-')) : null
let oldBytes = 0
let newBytes = 0

for (const file of await pngsIn(imageRoot)) {
  const name = relative(imageRoot, file)
  const chunks = pngChunks(file)
  if (!chunks) {
    console.log(`SKIP ${name}: not actually a PNG file`)
    continue
  }
  // A PNG colour profile/gamma can affect its appearance even when the decoded pixels match.
  if (['iCCP', 'sRGB', 'gAMA', 'cHRM'].some((chunk) => chunks.has(chunk))) {
    console.log(`SKIP ${name}: colour metadata`)
    continue
  }

  const backup = join(backupRoot, name)
  try {
    await stat(backup)
    console.log(`SKIP ${name}: backup already exists`)
    continue
  } catch { /* not previously optimized */ }

  if (!apply) {
    console.log(`CANDIDATE ${name}`)
    continue
  }

  const candidate = join(temporaryRoot, name.replaceAll('/', '__'))
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-frames:v', '1', '-pred', 'mixed', '-update', '1', candidate])
  const original = await stat(file)
  const optimized = await stat(candidate)
  const originalHash = pixelHash(file)
  if (!originalHash || originalHash !== pixelHash(candidate)) throw new Error(`Pixel mismatch for ${name}`)
  if (optimized.size >= original.size * 0.95) {
    console.log(`KEEP ${name}: ${(original.size / 1_000_000).toFixed(2)} → ${(optimized.size / 1_000_000).toFixed(2)} MB`)
    continue
  }

  await mkdir(dirname(backup), { recursive: true })
  const sibling = `${file}.optimized.tmp`
  await copyFile(candidate, sibling, constants.COPYFILE_EXCL)
  await rename(file, backup)
  try {
    await rename(sibling, file)
  } catch (error) {
    await rename(backup, file)
    throw error
  }
  oldBytes += original.size
  newBytes += optimized.size
  console.log(`OPTIMIZED ${name}: ${(original.size / 1_000_000).toFixed(2)} → ${(optimized.size / 1_000_000).toFixed(2)} MB, pixels identical`)
}

if (apply) console.log(`TOTAL: ${(oldBytes / 1_000_000).toFixed(2)} → ${(newBytes / 1_000_000).toFixed(2)} MB; originals in ${backupRoot}`)
