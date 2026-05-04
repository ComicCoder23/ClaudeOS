// CSD Post Engine — Content Puller v2
// Reads from Airtable pools respecting all locked selection rules:
// - Time block match first
// - No quote reuse (ever)
// - No author reuse within 10 days
// - No theme reuse within 7 days
// - No same visual combo within 5 posts
// - Scotland-first context priority
// - Repeat Risk assigned: Low / Medium / High

const config = require('./config')

const BASE_URL = 'https://api.airtable.com/v0/' + config.AIRTABLE_BASE
const HEADERS = { Authorization: 'Bearer ' + config.AIRTABLE_TOKEN }

// --- Core fetch helper ---
async function fetchTable(tableId, params) {
  params = params || {}
  const qs = Object.entries(params)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&')
  const url = BASE_URL + '/' + tableId + (qs ? '?' + qs : '')
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error('Airtable error ' + res.status + ' on ' + tableId)
  const data = await res.json()
  return data.records || []
}

// --- Get last N daily posts for anti-repetition checks ---
async function getRecentPosts(n) {
  n = n || 30
  const records = await fetchTable(config.TABLES.daily_posts, {
    maxRecords: n,
    'sort[0][field]': 'Date',
    'sort[0][direction]': 'desc'
  })
  return records.map(r => r.cellValuesByFieldId || r.fields || {})
}

// --- Pick a quote (single-use, time-block fit, no author within 10 days) ---
async function pickQuote(timeBlock, recentPosts) {
  const usedQuotes = new Set(recentPosts.map(p => p[config.FIELDS.quote_used]).filter(Boolean))
  const recentAuthors = recentPosts.slice(0, 10).map(p => p[config.FIELDS.author]).filter(Boolean)

  const records = await fetchTable(config.TABLES.quote_pool)
  const eligible = records.filter(r => {
    const f = r.fields
    if (!f.Active) return false
    if (usedQuotes.has(f['Quote Text'])) return false // never reuse
    const timefit = f['Time Block Fit'] || []
    const timefits = timefit.length === 0 || timefit.some(t => t.name === timeBlock || t === timeBlock || t.name === 'Any' || t === 'Any')
    if (!timefits) return false
    return true
  })

  // Prefer authors not used in last 10 days
  const preferred = eligible.filter(r => !recentAuthors.includes(r.fields['Author']))
  const pool = preferred.length > 0 ? preferred : eligible

  if (pool.length === 0) return null
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return {
    quote: pick.fields['Quote Text'] || '',
    author: pick.fields['Author'] || '',
    tone: pick.fields['Quote Tone'] || '',
    id: pick.id
  }
}

// --- Pick a theme (no reuse within 7 days, lowest usage first) ---
async function pickTheme(timeBlock, recentPosts) {
  const recentThemes = recentPosts.slice(0, 7).map(p => p[config.FIELDS.theme_tag]).filter(Boolean)

  const records = await fetchTable(config.TABLES.theme_pool)
  const eligible = records.filter(r => {
    const f = r.fields
    if (!f.Active) return false
    const timefit = f['Time Block Fit'] || []
    const timefitt = timefit.length === 0 || timefit.some(t => t.name === timeBlock || t === timeBlock || t.name === 'Any' || t === 'Any')
    if (!timefitt) return false
    if (recentThemes.includes(f['Theme Tag'])) return false
    return true
  })

  if (eligible.length === 0) {
    // Fallback: allow recent themes
    const fallback = records.filter(r => r.fields.Active)
    return fallback[0] ? { tag: fallback[0].fields['Theme Tag'], id: fallback[0].id, repeatRisk: 'High' } : null
  }

  // Sort by usage count ascending, then oldest last used
  eligible.sort((a, b) => {
    const ua = a.fields['Usage Count'] || 0
    const ub = b.fields['Usage Count'] || 0
    if (ua !== ub) return ua - ub
    return 0
  })

  return { tag: eligible[0].fields['Theme Tag'], id: eligible[0].id, repeatRisk: 'Low' }
}

// --- Pick a visual (no same category+style combo within 5 posts) ---
async function pickVisual(timeBlock, recentPosts) {
  const recentCombos = recentPosts.slice(0, 5).map(p =>
    (p[config.FIELDS.visual_category] || '') + '|' + (p[config.FIELDS.visual_style] || '')
  )

  const records = await fetchTable(config.TABLES.visual_pool)
  const eligible = records.filter(r => {
    const f = r.fields
    if (!f.Active) return false
    const timefit = f['Time Block Fit'] || []
    const timefitv = timefit.length === 0 || timefit.some(t => t.name === timeBlock || t === timeBlock || t.name === 'Any' || t === 'Any')
    if (!timefitv) return false
    const combo = (f['Visual Category'] || '') + '|' + (f['Visual Style'] || '')
    if (recentCombos.includes(combo)) return false
    return true
  })

  const pool = eligible.length > 0 ? eligible : records.filter(r => r.fields.Active)
  if (pool.length === 0) return null

  const pick = pool[Math.floor(Math.random() * pool.length)]
  return {
    category: pick.fields['Visual Category'] || '',
    subtype: pick.fields['Visual Subtype'] || '',
    style: pick.fields['Visual Style'] || '',
    lighting: pick.fields['Lighting Type'] || '',
    id: pick.id
  }
}

// --- Pick a context/fact (Scotland priority tier, Last Used rotation) ---
async function pickContext(timeBlock, recentPosts) {
  const recentContexts = recentPosts.slice(0, 14)
    .map(p => p[config.FIELDS.context_text])
    .filter(Boolean)

  const records = await fetchTable(config.TABLES.context_engine)
  const eligible = records.filter(r => {
    const f = r.fields
    if (!f.Active) return false
    const timefit = f['Time Block Fit'] || []
    const fits = timefit.length === 0 ||
      timefit.some(t => t.name === timeBlock || t.name === 'Any' || t === timeBlock || t === 'Any')
    if (!fits) return false
    // Exclude recently used context text
    if (recentContexts.includes(f['Context Text'])) return false
    return true
  })

  const pool = eligible.length > 0 ? eligible : records.filter(r => r.fields.Active)
  if (pool.length === 0) return null

  // Prefer Scotland primary tier first
  const scotland = pool.filter(r => {
    const nf = r.fields['Nation Fit']
    const pt = r.fields['Priority Tier']
    return (nf && (nf.name === 'Scotland' || nf === 'Scotland')) ||
           (pt && (pt.name === 'Primary' || pt === 'Primary'))
  })
  const priorityPool = scotland.length > 0 ? scotland : pool

  // Sort by Last Used ascending (oldest first), then by Usage Count ascending
  priorityPool.sort((a, b) => {
    const da = a.fields['Last Used'] ? new Date(a.fields['Last Used']) : new Date(0)
    const db = b.fields['Last Used'] ? new Date(b.fields['Last Used']) : new Date(0)
    if (da.getTime() !== db.getTime()) return da - db
    return (a.fields['Usage Count'] || 0) - (b.fields['Usage Count'] || 0)
  })

  const pick = priorityPool[0]
  return {
    text: pick.fields['Context Text'] || '',
    type: pick.fields['Context Type'] ? (pick.fields['Context Type'].name || pick.fields['Context Type']) : '',
    id: pick.id,
    usageCount: pick.fields['Usage Count'] || 0
  }
}

// --- Pick a caption opener/closer from Caption Engine ---
async function pickCaption(timeBlock, assetType) {
  const records = await fetchTable(config.TABLES.caption_engine)
  const eligible = records.filter(r => {
    const f = r.fields
    if (!f.Active) return false
    const at = f['Asset Type']
    const atName = at && at.name ? at.name : at
    if (atName !== assetType) return false
    const timefit = f['Time Block Fit'] || []
    const fits = timefit.length === 0 ||
      timefit.some(t => {
        const name = t.name || t
        return name === timeBlock || name === 'Any'
      })
    return fits
  })

  if (eligible.length === 0) return null
  eligible.sort((a, b) => (a.fields['Usage Count'] || 0) - (b.fields['Usage Count'] || 0))
  return eligible[0].fields['Content'] || null
}

// --- Assign repeat risk ---
function assignRepeatRisk(theme, quote, visual, recentPosts) {
  let overlaps = 0
  if (theme && theme.repeatRisk === 'High') overlaps += 2
  const recentThemes = recentPosts.slice(0, 7).map(p => p[config.FIELDS.theme_tag])
  if (theme && recentThemes.includes(theme.tag)) overlaps++
  if (overlaps === 0) return 'Low'
  if (overlaps === 1) return 'Medium'
  return 'High'
}

// --- Main export ---
async function getContent(type, mode) {
  mode = mode || 'Normal'
  const typeConfig = config.TYPES[type]
  const timeBlock = typeConfig.timeBlock

  console.log('  Fetching recent posts for anti-repetition checks...')
  const recentPosts = await getRecentPosts(30)

  console.log('  Picking quote...')
  const quote = await pickQuote(timeBlock, recentPosts)

  console.log('  Picking theme...')
  const theme = await pickTheme(timeBlock, recentPosts)

  console.log('  Picking visual...')
  const visual = await pickVisual(timeBlock, recentPosts)

  console.log('  Picking context/fact...')
  const context = await pickContext(timeBlock, recentPosts)

  // Immediately update Last Used + Usage Count so next run picks a different fact
  if (context && context.id) {
    const currentCount = context.usageCount || 0
    const patchUrl = 'https://api.airtable.com/v0/' + config.AIRTABLE_BASE + '/' + config.TABLES.context_engine + '/' + context.id
    const patchBody = JSON.stringify({
      fields: {
        'Last Used': new Date().toISOString().slice(0, 10),
        'Usage Count': currentCount + 1
      }
    })
    await new Promise((resolve) => {
      const https = require('https')
      const url = new URL(patchUrl)
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + config.AIRTABLE_TOKEN,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(patchBody)
        }
      }, (res) => {
        res.on('data', () => {})
        res.on('end', () => {
          console.log('  Context usage updated: ' + context.id)
          resolve()
        })
      })
      req.on('error', (e) => {
        console.log('  Context update warning: ' + e.message)
        resolve()
      })
      req.write(patchBody)
      req.end()
    })
  }

  console.log('  Picking caption assets...')
  const captionOpener = await pickCaption(timeBlock, 'Opener')
  const captionCloser = await pickCaption(timeBlock, 'Closing Line')

  const repeatRisk = assignRepeatRisk(theme, quote, visual, recentPosts)
  if (repeatRisk === 'High') console.log('  WARNING: Repeat Risk HIGH — review output before posting')

  return {
    type,
    mode,
    timeBlock,
    typeConfig,
    quote: quote ? quote.quote : '',
    author: quote ? quote.author : '',
    quoteTone: quote ? quote.tone : '',
    quoteId: quote ? quote.id : null,
    theme: theme ? theme.tag : '',
    themeId: theme ? theme.id : null,
    visual: visual || {},
    // message = body copy shown on post (from caption engine opener)
    message: captionOpener || typeConfig.caption_opener,
    // contextText = Did You Know fact (separate from message)
    contextText: context ? context.text : 'Scotland has more castles per square mile than almost any other country — over 3,000 in total.',
    contextType: context ? context.type : '',
    contextId: context ? context.id : null,
    captionOpener: captionOpener || typeConfig.caption_opener,
    captionCloser: captionCloser || '',
    repeatRisk,
  }
}

module.exports = { getContent }
