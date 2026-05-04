// CSD Post Engine — Main Runner v2
// Usage: node run.js morning [busy]
//        node run.js midday
//        node run.js night [busy]
//
// Output: ~/ClaudeOS/csd-engine/output/YYYY/MM/CSD-{TYPE}-{YYYY}-{MM}-{DD}.png
// Choosing Sobriety Daily — Big Al

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')
const sharp = require('sharp')
const config = require('./config')
const { getContent } = require('./pull')
const { buildImagePrompt, buildWhatsAppCaption, buildIGCaption } = require('./prompt-builder')

const BASE_URL = 'https://api.airtable.com/v0/' + config.AIRTABLE_BASE
const HEADERS = {
  'Authorization': 'Bearer ' + config.AIRTABLE_TOKEN,
  'Content-Type': 'application/json'
}

// --- Write record back to Airtable Daily Posts ---
async function createDailyPostRecord(content, filename, outputPath) {
  const today = new Date().toISOString().slice(0, 10)
  const postId = 'CSD-' + content.type.toUpperCase() + '-' + today

  const fields = {}
  fields[config.FIELDS.post_id] = postId
  fields[config.FIELDS.date] = today
  fields[config.FIELDS.time_block] = content.typeConfig.timeBlock
  fields[config.FIELDS.mode] = content.mode
  fields[config.FIELDS.quote_used] = content.quote
  fields[config.FIELDS.author] = content.author
  fields[config.FIELDS.theme_tag] = content.theme
  fields[config.FIELDS.context_text] = content.contextText
  fields[config.FIELDS.visual_category] = content.visual.category || ''
  fields[config.FIELDS.visual_style] = content.visual.style || ''
  fields[config.FIELDS.lighting_type] = content.visual.lighting || ''
  fields[config.FIELDS.repeat_risk] = content.repeatRisk
  fields[config.FIELDS.drive_file_name] = filename
  fields[config.FIELDS.automation_status] = 'Draft'
  fields[config.FIELDS.status] = 'Todo'

  try {
    const res = await fetch(BASE_URL + '/' + config.TABLES.daily_posts, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ fields })
    })
    if (!res.ok) {
      const err = await res.text()
      console.log('  Airtable write warning: ' + err)
      return null
    }
    const data = await res.json()
    console.log('  Airtable record created: ' + postId)
    return data.id
  } catch (e) {
    console.log('  Airtable write failed: ' + e.message)
    return null
  }
}

// --- Mark post as completed in Airtable ---
function markCompleted(recordId) {
  if (!recordId) return Promise.resolve()
  const fields = {}
  fields[config.FIELDS.automation_status] = 'Completed'
  fields[config.FIELDS.saved_to_drive] = true
  const body = JSON.stringify({ fields })
  const url = new URL(BASE_URL + '/' + config.TABLES.daily_posts + '/' + recordId)
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: { ...HEADERS, 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      res.resume()
      res.on('end', () => {
        console.log('  Airtable record marked Completed.')
        resolve()
      })
    })
    req.on('error', (e) => {
      console.log('  Mark completed warning: ' + e.message)
      resolve()
    })
    req.write(body)
    req.end()
  })
}

// --- Validate input ---
const type = (process.argv[2] || '').toLowerCase()
const mode = (process.argv[3] || 'normal').toLowerCase() === 'busy' ? 'Busy' : 'Normal'
const validTypes = ['morning', 'midday', 'night']

if (!type || !validTypes.includes(type)) {
  console.log('\n CSD Post Engine v2 — Choosing Sobriety Daily')
  console.log('----------------------------------------------')
  console.log('Usage:')
  console.log('  node run.js morning         Normal mode')
  console.log('  node run.js morning busy    Busy mode (poster + WhatsApp only)')
  console.log('  node run.js midday')
  console.log('  node run.js night')
  console.log('')
  process.exit(1)
}

// --- Main ---
async function main() {
  console.log('\n CSD Post Engine v2 — Choosing Sobriety Daily')
  console.log('==============================================')
  console.log('Type: ' + type.toUpperCase() + ' | Mode: ' + mode)
  console.log('Time: ' + new Date().toLocaleTimeString())
  console.log('')

  // 1. Pull content from Airtable pools
  console.log('Step 1/5 — Pulling content from Airtable...')
  const content = await getContent(type, mode)
  console.log('  Quote:   ' + content.quote.substring(0, 55) + '...')
  console.log('  Author:  ' + content.author)
  console.log('  Theme:   ' + content.theme)
  console.log('  Context: ' + (content.contextText || '').substring(0, 55))
  console.log('  Repeat Risk: ' + content.repeatRisk)
  if (content.repeatRisk === 'High') {
    console.log('  *** HIGH REPEAT RISK — review before posting ***')
  }
  console.log('')

  // 2. Build outputs
  console.log('Step 2/5 — Building prompts and captions...')
  const imagePrompt = buildImagePrompt(content)
  const whatsappCaption = buildWhatsAppCaption(content)
  const igCaption = buildIGCaption(content)
  console.log('  Done.')
  console.log('')

  // 3. Create output directory (canonical path)
  console.log('Step 3/5 — Setting up output directory...')
  const outputDir = config.getOutputDir()
  const filename = config.getFilename(type, 'png')
  const imagePath = path.join(outputDir, filename)
  const whatsappPath = path.join(outputDir, config.getFilename(type, 'whatsapp.txt'))
  const igPath = path.join(outputDir, config.getFilename(type, 'ig.txt'))
  const promptPath = path.join(outputDir, config.getFilename(type, 'prompt.txt'))

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log('  Created: ' + outputDir)
  } else {
    console.log('  Output dir: ' + outputDir)
  }

  // Save text files
  fs.writeFileSync(whatsappPath, whatsappCaption, 'utf8')
  fs.writeFileSync(igPath, igCaption, 'utf8')
  fs.writeFileSync(promptPath, imagePrompt, 'utf8')
  console.log('  Saved captions and prompt.')
  console.log('')

  // 4. Write record to Airtable (Draft state)
  console.log('Step 4/5 — Creating Airtable record...')
  const recordId = await createDailyPostRecord(content, filename, imagePath)
  console.log('')

  // 5. Run Nano Banana
  console.log('Step 5/5 — Generating image with Nano Banana...')

  // Write prompt to temp file — avoids ALL PowerShell quote escaping issues
  const tempPath = path.join(outputDir, '_temp.txt')
  fs.writeFileSync(tempPath, imagePrompt, 'utf8')

  let imageGenerated = false

  // Read prompt from file (avoids all PowerShell quote escaping issues)
  const promptText = fs.readFileSync(tempPath, 'utf8')

  // Nano Banana command: nano-banana /generate "prompt"
  // Prompt passed as single quoted argument via temp file read
  // Using execSync with shell:true so the CLI environment is correct
  try {
    const cleanPrompt = promptText.replace(/"/g, "'").replace(/\n/g, ' ')
    const cmd = 'gemini --yolo "/generate ' + cleanPrompt + '"'
    execSync(cmd, {
      stdio: 'inherit',
      cwd: path.join(require('os').homedir(), 'ClaudeOS'),
      shell: true
    })
    imageGenerated = true

    // Move generated file to canonical output path if Nano Banana saved to default location
    const defaultOut = path.join(require('os').homedir(), 'ClaudeOS', 'nanobanana-output')
    if (fs.existsSync(defaultOut)) {
      const files = fs.readdirSync(defaultOut)
        .filter(f => f.endsWith('.png'))
        .map(f => ({ f, t: fs.statSync(path.join(defaultOut, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t)
      if (files.length > 0) {
        fs.copyFileSync(path.join(defaultOut, files[0].f), imagePath)
        console.log('  Image saved to: ' + imagePath)
      }
    }
  } catch (e) {
    // command failed — fall through to manual instructions
  }

  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)

  if (!imageGenerated) {
    console.log('')
    console.log('  Could not auto-run Nano Banana.')
    console.log('  In Claude Code terminal, run:')
    console.log('')
    console.log('    nano-banana /generate "[paste prompt text here]"')
    console.log('')
    console.log('  Or open the prompt file and copy its contents:')
    console.log('    ' + promptPath)
    console.log('')
    console.log('  Nano Banana saves to: ~/ClaudeOS/nanobanana-output/')
    console.log('  Rename the output to: ' + filename)
    console.log('  Move it to: ' + outputDir)
  } else {
    await markCompleted(recordId)

    // Composite CSD logo onto top-right corner
    const logoSrc = path.join(__dirname, 'csd-logo.png')
    if (fs.existsSync(logoSrc) && fs.existsSync(imagePath)) {
      try {
        const base = sharp(imagePath)
        const meta = await base.metadata()
        const logoSize = Math.round(meta.width * 0.14) // 14% of image width
        const padding = Math.round(meta.width * 0.025)
        const logoBuffer = await sharp(logoSrc)
          .resize(logoSize, logoSize, { fit: 'inside' })
          .toBuffer()
        const logoLeft = meta.width - logoSize - padding
        await base
          .composite([{ input: logoBuffer, top: padding, left: logoLeft }])
          .toFile(imagePath + '.tmp.png')
        fs.renameSync(imagePath + '.tmp.png', imagePath)
        console.log('  Logo composited onto image.')
      } catch (e) {
        console.log('  Logo composite warning: ' + e.message)
      }
    }

    // Auto-open the image
    try {
      execSync('start "" "' + imagePath + '"', { shell: true })
      console.log('  Image opened automatically.')
    } catch (e) {
      console.log('  Image saved — open manually: ' + imagePath)
    }

    // Archive copy to Google Drive CSD Post v4 folder
    const driveArchive = path.join(
      'G:\\', 'My Drive', 'Choosing Sobriety Daily', 'CSD Output v4'
    )
    try {
      if (fs.existsSync(driveArchive)) {
        const archivePath = path.join(driveArchive, filename)
        fs.copyFileSync(imagePath, archivePath)
        console.log('  Archived to Drive: ' + archivePath)
      } else {
        console.log('  Drive archive folder not found — skipping archive copy.')
      }
    } catch (e) {
      console.log('  Drive archive warning: ' + e.message)
    }
  }

  // --- Summary ---
  console.log('')
  console.log('==============================================')
  console.log('CSD POST READY — ' + type.toUpperCase())
  console.log('==============================================')
  console.log('')
  console.log('OUTPUT FOLDER:')
  console.log('  ' + outputDir)
  console.log('')
  console.log('FILES:')
  console.log('  Image:    ' + filename)
  console.log('  WhatsApp: ' + path.basename(whatsappPath))
  console.log('  IG/Social:' + path.basename(igPath))
  console.log('  Prompt:   ' + path.basename(promptPath))
  console.log('')
  console.log('WHATSAPP CAPTION (copy below):')
  console.log('------')
  console.log(whatsappCaption)
  console.log('------')
  console.log('')
}

main().catch(function(err) {
  console.error('Engine error: ' + err.message)
  process.exit(1)
})
