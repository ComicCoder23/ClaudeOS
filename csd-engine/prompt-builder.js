// CSD Post Engine — Prompt Builder v2
// Builds Nano Banana image prompt + WhatsApp + IG captions
// Uses visual pool data for precise image direction

const config = require('./config')

function buildImagePrompt(content) {
  const t = content.typeConfig
  const v = content.visual

  // Build visual description from pool data
  const visualDesc = [
    v.category || t.background,
    v.subtype || '',
    v.style || 'photorealistic cinematic',
    v.lighting ? 'Lighting: ' + v.lighting : ''
  ].filter(Boolean).join(', ')

  // Separate message from fact — message is the body copy, fact is for DID YOU KNOW
  const bodyMessage = content.message || content.captionOpener || 'One honest step today is enough.'
  const dykFact = content.contextText || 'Scotland has more castles per square mile than almost any other country.'

  // Morning gets warm sunrise bias
  const backgroundDesc = content.type === 'morning'
    ? 'golden sunrise over Scottish highlands, warm amber and gold light rays breaking through dramatic clouds, mountain path catching early morning light'
    : visualDesc

  const prompt = [
    'Square social media post image, Instagram format, for the brand Choosing Sobriety Daily.',
    'Scottish recovery brand. Warm, honest, grounded tone.',
    '',
    'BACKGROUND PHOTO: ' + backgroundDesc,
    'Apply a dark gradient that fades from near-black on the left half to transparent on the right.',
    '',
    'TOP-LEFT: Large bold header text stacked vertically.',
    'First word: "' + t.label.split(' ')[0] + '" in white heavy grunge font.',
    'Second word: "' + (t.label.split(' ')[1] || '') + '" in ' + t.accent + ' gold, same heavy font.',
    'A short thin gold horizontal line sits beneath the two words.',
    '',
    'TOP-RIGHT: Leave this corner completely empty — no text, no badge, no graphics. The brand logo will be added separately.',
    '',
    'MIDDLE-LEFT: Body message in clean white sans-serif, large enough to read on a phone.',
    '"' + bodyMessage + '"',
    'Highlight key emotional words in ' + t.accent + ' gold.',
    '',
    'BELOW BODY: A clearly distinct rounded rectangle box for a fact.',
    'Box background: dark navy semi-transparent. Border colour is bright warm gold #F5A623 — not olive, not green. Bright gold only.',
    'Left label in gold bold: "DID YOU KNOW?"',
    'Fact text in white — this is DIFFERENT from the body message above:',
    '"' + dykFact + '"',
    'This box is visually separate from the quote box below it.',
    '',
    'BELOW DID YOU KNOW: A second rounded rectangle box for the quote.',
    'Box background: black semi-transparent. Border colour is bright warm gold #F5A623 — not green, not olive, not yellow. Bright gold only.',
    'Large gold opening quotation mark at top-left of box.',
    'Quote in white italic: "' + content.quote + '"',
    'Author attribution in small gold capitals: — ' + content.author.toUpperCase(),
    '',
    'BOTTOM BAR: Full-width dark strip at the very bottom.',
    'Centred white bold text — write exactly: @choosingsobrietydaily',
    'One word, no spaces, no plus signs, no separators between words.',
    'Small social icons right side: Instagram, TikTok, YouTube.',
    'Far bottom-left corner, very small white text at 40% opacity — barely visible, faint watermark:',
    '✦ Alan App Labs © CSD Post v4',
    'This watermark must be tiny — smallest readable size, not distracting.',
    '',
    'STYLE: ' + t.palette + '.',
    'Cinematic, warm, dramatic. Scottish landscape — rugged, natural, honest.',
    'All text clearly readable on a mobile screen.',
    'Clean final image — no measurements, no pixel labels, no annotations.'
  ].join('\n')

  return prompt
}

function buildWhatsAppCaption(content) {
  const t = content.typeConfig
  const lines = [
    '*' + t.label + '*',
    '',
    content.captionOpener || t.caption_opener,
    '',
    content.contextText || '',
    '',
    '_"' + content.quote + '"_',
    '— ' + content.author,
    '',
    '📍 *Did you know?*',
    content.contextText || '',
    '',
    config.HANDLE,
    config.LINKTREE
  ].filter(l => l !== null)

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function buildIGCaption(content) {
  const t = content.typeConfig
  const lines = [
    t.caption_opener,
    '',
    content.contextText || '',
    '',
    '"' + content.quote + '"',
    '— ' + content.author,
    '',
    content.captionCloser || 'One step at a time.',
    '',
    'Did you know?',
    content.contextText || '',
    '',
    'Follow along:',
    config.LINKTREE,
    '',
    '✌️🤎💪',
    '',
    '#choosingsobrietydaily #sobriety #recovery #soberliving #alcoholfree',
    '#soberlife #mentalhealthmatters #recoveryispossible #onedayatatime #scotland'
  ].filter(l => l !== null)

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

module.exports = { buildImagePrompt, buildWhatsAppCaption, buildIGCaption }
