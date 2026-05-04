# CSD Post Engine v2 — Setup Guide
# Choosing Sobriety Daily — Big Al

## Commands
  node run.js morning          Normal mode
  node run.js morning busy     Busy mode (poster + WhatsApp only, no extra steps)
  node run.js midday
  node run.js night

## Output location (canonical)
  ~/ClaudeOS/csd-engine/output/YYYY/MM/

## Filenames (canonical, ISO date)
  CSD-MORNING-2026-05-02.png
  CSD-MORNING-2026-05-02.whatsapp.txt
  CSD-MORNING-2026-05-02.ig.txt
  CSD-MORNING-2026-05-02.prompt.txt

## What the engine respects (from your Airtable Rule Lock)
  - Time block matched first (Morning / Midday / Night)
  - No quote ever reused
  - No author reused within 10 days
  - No theme reused within 7 days
  - No same visual combo within 5 posts
  - Scotland-first context priority tier
  - Repeat Risk assigned: Low / Medium / High
  - Daily Posts record created in Airtable (Draft → Ready → Completed)
  - Busy mode = poster + WhatsApp only

## Setup steps

### Step 1 — Copy files to ClaudeOS
  Create folder: C:\Users\[you]\ClaudeOS\csd-engine\
  Copy in: config.js, pull.js, prompt-builder.js, run.js

### Step 2 — Confirm Nano Banana command
  In Claude Code terminal:
    nano-banana --help
  Tell Claude the exact command shown — engine will be updated to match.

### Step 3 — Run it
  cd ~\ClaudeOS\csd-engine
  node run.js morning

## Airtable base connected
  Base: Morning Engine Alpha Ops (appF9ClZygzBUe0wF)
  Tables used: Quote Pool, Theme Pool, Visual Pool, Context Engine,
               Caption Engine, Footer Variants, Daily Posts (record written back)

## Google Drive folder
  Posts saved to: ~/ClaudeOS/csd-engine/output/YYYY/MM/
  Mirror to Drive: Choosing Sobriety Daily/Posts/YYYY/MM/ (manual or Make automation)
