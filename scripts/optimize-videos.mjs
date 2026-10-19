import { constants } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readdir, rename, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const videoRoot = resolve('public/assets/video')
const backupRoot = resolve('archive/media-originals-2026-10-19/video')
const apply = process.argv.includes('--apply')

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.error?.message}`)
  return result
}

function probe(file) {
  const result = run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,bit_rate:format=duration,size',
    '-of', 'json', file,
  ])
  const data = JSON.parse(result.stdout)
  return { ...data.streams[0], duration: Number(data.format.duration), size: Number(data.format.size) }
}

async function videosIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? videosIn(path) : entry.name.endsWith('.mp4') ? [path] : []
  }))
  return nested.flat().sort()
}

const temporaryRoot = apply ? await mkdtemp(join(tmpdir(), 'monparty-video-')) : null
let oldBytes = 0
let newBytes = 0

for (const file of await videosIn(videoRoot)) {
  const original = probe(file)
  if ((Number(original.bit_rate) < 4_000_000 && original.size < 20_000_000) || original.size < 1_000_000) continue

  const name = relative(videoRoot, file)
  const backup = join(backupRoot, name)
  try {
    await stat(backup)
    console.log(`SKIP ${name}: backup already exists`)
    continue
  } catch { /* not previously optimized */ }

  if (!apply) {
    console.log(`CANDIDATE ${name}: ${(original.size / 1_000_000).toFixed(2)} MB, ${original.width}×${original.height}`)
    continue
  }

  const candidate = join(temporaryRoot, name.replaceAll('/', '__'))
  const crf = name === 'slide-42-song.mp4' ? '20' : '18'
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', file,
    '-map', '0:v:0', '-map', '0:a?', '-map_metadata', '0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', candidate,
  ])
  const optimized = probe(candidate)
  if (optimized.codec_name !== 'h264' || optimized.width !== original.width || optimized.height !== original.height || Math.abs(optimized.duration - original.duration) > 0.2) {
    throw new Error(`Media properties changed unexpectedly for ${name}`)
  }

  const comparison = run('ffmpeg', [
    '-hide_banner', '-loglevel', 'info', '-i', file, '-i', candidate,
    '-filter_complex', '[0:v][1:v]ssim', '-an', '-f', 'null', '-',
  ])
  const ssim = Number(comparison.stderr.match(/All:([0-9.]+)/)?.[1])
  const minimumSsim = name === 'slide-42-song.mp4' ? 0.995 : 0.985
  if (!Number.isFinite(ssim) || ssim < minimumSsim || optimized.size > original.size * 0.9) {
    console.log(`KEEP ${name}: ${(optimized.size / 1_000_000).toFixed(2)} MB, SSIM ${ssim.toFixed(4)}`)
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
  console.log(`OPTIMIZED ${name}: ${(original.size / 1_000_000).toFixed(2)} → ${(optimized.size / 1_000_000).toFixed(2)} MB, SSIM ${ssim.toFixed(4)}`)
}

if (apply) console.log(`TOTAL: ${(oldBytes / 1_000_000).toFixed(2)} → ${(newBytes / 1_000_000).toFixed(2)} MB; originals in ${backupRoot}`)
