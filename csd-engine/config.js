// CSD Post Engine — Configuration v2
// Choosing Sobriety Daily — Big Al

const path = require('path')
const os = require('os')
const fs = require('fs')

// Load .env if present
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  })
}

const config = {

  // --- Airtable ---
  AIRTABLE_TOKEN: process.env.AIRTABLE_TOKEN || '',
  AIRTABLE_BASE: process.env.AIRTABLE_BASE || '',

  TABLES: {
    daily_posts:       "tblE6DIjAQUts4Heh",
    theme_pool:        "tblImuDBsCOI05s0l",
    visual_pool:       "tblPr6dlDX8MS8lSw",
    quote_pool:        "tblkiB64amsOHSmZp",
    rule_lock:         "tblEEyi9rwQcaryg5",
    caption_engine:    "tbl2foaQ72KTaXsE9",
    context_engine:    "tblBcubGQe1FcV3oq",
    footer_variants:   "tbl1C8UOupoyt85P7",
    output_mode_rules: "tblQngN6irZaU1Apl",
    selection_logic:   "tblNfXVCc6GODki7d"
  },

  // --- Google Sheet (supplementary 365-day content) ---
  SHEET_ID: "1e6EtDnbhor13yIp82VuuZAPHsbWwlarc9p-eCIwSOBM",

  // --- Output paths ---
  // Local: ~/ClaudeOS/csd-engine/output/YYYY/MM/
  // Canonical filename: CSD-{TYPE}-{YYYY}-{MM}-{DD}.png
  OUTPUT_BASE: path.join(__dirname, 'output'),

  getFilename(type, ext) {
    ext = ext || 'png'
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return 'CSD-' + type.toUpperCase() + '-' + yyyy + '-' + mm + '-' + dd + '.' + ext
  },

  getOutputDir() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return path.join(this.OUTPUT_BASE, String(yyyy), mm)
  },

  // --- Brand ---
  HANDLE: "@choosingsobrietydaily",
  LINKTREE: "linktr.ee/choosingsobrietydaily",

  // --- Post types ---
  TYPES: {
    morning: {
      label: "GOOD MORNING",
      timeBlock: "Morning",
      defaultTone: "Directive",
      defaultEmotionalTone: "Hope",
      defaultEnergy: "Medium",
      background: "dramatic mountain sunrise golden light rays Scottish highlands",
      accent: "#F5A623",
      palette: "warm gold #F5A623 and deep dark navy #0A0E1A",
      caption_opener: "Good morning."
    },
    midday: {
      label: "MIDDAY RESET",
      timeBlock: "Midday",
      defaultTone: "Grounding",
      defaultEmotionalTone: "Determination",
      defaultEnergy: "High",
      background: "mountain path daylight hiker walking forward Scottish glen",
      accent: "#556B2F",
      palette: "olive green #556B2F and dark charcoal #1C1C1C",
      caption_opener: "Midday check-in."
    },
    night: {
      label: "GOOD NIGHT",
      timeBlock: "Night",
      defaultTone: "Reflective",
      defaultEmotionalTone: "Calm",
      defaultEnergy: "Low",
      background: "starry night sky Scottish loch soft moonlight cottage window",
      accent: "#1A3A5C",
      palette: "deep blue #1A3A5C and dark navy #080C14",
      caption_opener: "Good night."
    }
  },

  // --- Daily Posts field IDs ---
  FIELDS: {
    post_id:           "fld6wPy3P4vO1aLWo",
    date:              "fldJPpwREZ5q0Ikpf",
    status:            "fld0pvt2EB9XcRPgA",
    automation_status: "fldEn7PgcCDfXBhyx",
    mode:              "fldXbUk0DgxCoOPBQ",
    message_text:      "fldoSznxCXNqFCywA",
    whatsapp_caption:  "flds92ta32YL17Abo",
    drive_file_name:   "fldYuyoBSWVH58cHI",
    drive_link:        "fldP6LyKFgFYx0gnB",
    saved_to_drive:    "fldqfbDNs7I8W75N2",
    published:         "fld4IhJ11yeiZAAdR",
    whatsapp_sent:     "fldBRGlhex3yFiWBe",
    time_block:        "fldYE27fNqaDScM6Y",
    message_type:      "fld521W2rZlgLJGB9",
    theme_tag:         "flduDFu98wSq4DMaP",
    tone_type:         "fldhKB6pkflXzC8VK",
    emotional_tone:    "fldZcxVGooBD6uB1z",
    energy_level:      "fld7YjlsByBFh1Lc0",
    quote_used:        "fld0ChMhUlfUbwdJe",
    author:            "fld9PRPN03sNKRGtW",
    visual_category:   "fldLXeH8fCOXrcC3i",
    visual_style:      "fldAY7Hzvv5fhYz5u",
    lighting_type:     "fldlC2DnZx1i5uPWb",
    context_text:      "fldlrDwokFqtSMkvK",
    used_this_week:    "fldCJtvPWjvDJIW72",
    used_this_month:   "fldkJrmgbcsI76iSE",
    repeat_risk:       "fldaPmQmXjleCqHeI",
    notes:             "fldXKJZ8JVIZWdbYy"
  }
}

module.exports = config
