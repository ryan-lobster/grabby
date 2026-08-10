/**
 * Records a short clean clip of the laptop preview for the jsoncms labs page.
 *
 * Usage:
 *   node scripts/record-labs.mjs [baseUrl]
 *
 * Defaults to the production deploy with lobster.digital on a muted (#e8e4f7) bg.
 */
import { chromium } from 'playwright'
import { mkdir, rename, readdir, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../.recordings')
const MUTED = 'e8e4f7' // --muted / --pale-violet from jsoncms lobster theme
const BASE =
  process.argv[2] ||
  `https://macbook-preview.lobsterdigital.app/?scene=macbook&url=https://lobster.digital&bg=%23${MUTED}&open=1&hideUi=1`
const DURATION_MS = 12_000
const VIEWPORT = { width: 1280, height: 800 }

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
})
const page = await context.newPage()
console.log('Opening', BASE)
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 })
// Let the lid open + iframe settle, then hold for the clip.
await page.waitForTimeout(2500)
await page.waitForTimeout(DURATION_MS)
await context.close()
await browser.close()

const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith('.webm'))
if (!files.length) throw new Error('No webm recorded')
const webm = join(OUT_DIR, files[0])
const namedWebm = join(OUT_DIR, 'macbook-preview.webm')
await rename(webm, namedWebm)

const mp4 = join(OUT_DIR, 'macbook-preview.mp4')
await run('ffmpeg', [
  '-y',
  '-i',
  namedWebm,
  '-an',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '25',
  '-vf',
  'scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2',
  '-movflags',
  '+faststart',
  mp4,
])

console.log('Wrote', mp4)
