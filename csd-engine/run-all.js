// CSD Post Engine — Daily All-Posts Runner
// Runs morning, midday, and night posts sequentially with a 3-minute gap.
// Usage: node run-all.js
// Output lands in G:\My Drive\Choosing Sobriety Daily\CSD Output v4

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const GAP_MINUTES = 3
const DRIVE_FOLDER = path.join('G:\\', 'My Drive', 'Choosing Sobriety Daily', 'CSD Output v4')

function today() {
  return new Date().toISOString().slice(0, 10)
}

function wait(minutes) {
  return new Promise(resolve => {
    let remaining = minutes * 60
    const interval = setInterval(() => {
      process.stdout.write('\r  Waiting ' + remaining + 's before next post...')
      remaining--
      if (remaining < 0) {
        clearInterval(interval)
        process.stdout.write('\n')
        resolve()
      }
    }, 1000)
  })
}

function runPost(type) {
  console.log('\n')
  console.log('██████████████████████████████████████████████')
  console.log('  RUNNING: ' + type.toUpperCase())
  console.log('██████████████████████████████████████████████')
  execSync('node run.js ' + type, {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  })
}

async function main() {
  console.log('\n CSD Daily All-Posts Runner')
  console.log('============================================')
  console.log(' Date:  ' + today())
  console.log(' Posts: Morning → Midday → Night')
  console.log(' Gap:   ' + GAP_MINUTES + ' minutes between each')
  console.log('============================================')

  try { runPost('morning') } catch (e) { console.log('  Morning failed: ' + e.message) }
  await wait(GAP_MINUTES)

  try { runPost('midday') } catch (e) { console.log('  Midday failed: ' + e.message) }
  await wait(GAP_MINUTES)

  try { runPost('night') } catch (e) { console.log('  Night failed: ' + e.message) }

  // Drive confirmation
  console.log('\n')
  console.log('============================================')
  console.log(' DRIVE CONFIRMATION')
  console.log('============================================')
  const date = today()
  const types = ['MORNING', 'MIDDAY', 'NIGHT']
  let allLanded = true

  types.forEach(type => {
    const filename = 'CSD-' + type + '-' + date + '.png'
    const drivePath = path.join(DRIVE_FOLDER, filename)
    if (fs.existsSync(drivePath)) {
      console.log('  ✓ ' + filename)
    } else {
      console.log('  ✗ MISSING: ' + filename)
      allLanded = false
    }
  })

  console.log('')
  if (allLanded) {
    console.log(' All 3 posts landed in Drive. Ready to post.')
  } else {
    console.log(' WARNING: Some files missing from Drive — check output above.')
  }
  console.log(' Drive folder: ' + DRIVE_FOLDER)
  console.log('============================================\n')
}

main().catch(e => {
  console.error('Runner error: ' + e.message)
  process.exit(1)
})
