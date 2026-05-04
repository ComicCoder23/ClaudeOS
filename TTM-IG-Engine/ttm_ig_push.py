"""
TTM Prospect Feed — Airtable Seed Push
---------------------------------------
Pushes 21 hardcoded prospect records directly to the TTM Prospect Feed.
No Instagram scraping. Lead Score set to 0 for manual review.

Usage:
    pip install pyairtable python-dotenv
    python ttm_ig_push.py
"""

import os
import time
import datetime
import json
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

AIRTABLE_API_KEY = os.environ["AIRTABLE_API_KEY"]
BASE_ID          = "apphJBGa2yOcXpvax"
TABLE_ID         = "tbl6L5KyEx82UR81Y"

# ── Prospect data ─────────────────────────────────────────────────────────────
# trade_category must match exact Airtable choice names:
# Builder, Landscaper, Roofer, Plumber, Electrician, Painter, Tiler, HVAC, Glazier, Other
# location derived from handle/name; tags pulled from location + trade

ACCOUNTS = [
    {
        "handle":         "glasgow_blinds_fitter",
        "business_name":  "Glasgow Blinds Fitter",
        "location":       "Glasgow",
        "trade_category": "Other",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "glasgowlandscapegardeners",
        "business_name":  "Glasgow Landscape Gardeners",
        "location":       "Glasgow",
        "trade_category": "Landscaper",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "camedinburghjoiner",
        "business_name":  "CAM Edinburgh Joiner",
        "location":       "Edinburgh",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "hortusglasgowgardeners",
        "business_name":  "Hortus Glasgow Gardeners",
        "location":       "Glasgow",
        "trade_category": "Landscaper",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "clyde.tree.surgeons",
        "business_name":  "Clyde Tree Surgeons Glasgow",
        "location":       "Glasgow",
        "trade_category": "Landscaper",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "edenlandscapes.glasgow",
        "business_name":  "Eden Landscapes Glasgow",
        "location":       "Glasgow",
        "trade_category": "Landscaper",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "mjd_security_systems",
        "business_name":  "MJD Security Systems",
        "location":       "Scotland",
        "trade_category": "Other",
        "tags":           [],
    },
    {
        "handle":         "theblindguyandshutters",
        "business_name":  "The Blind Guy and Shutters",
        "location":       "Scotland",
        "trade_category": "Other",
        "tags":           [],
    },
    {
        "handle":         "thetilemanbathrooms",
        "business_name":  "The Tile Man Bathrooms",
        "location":       "Scotland",
        "trade_category": "Tiler",
        "tags":           [],
    },
    {
        "handle":         "foxjoineryedinburgh",
        "business_name":  "Fox Joinery Edinburgh",
        "location":       "Edinburgh",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "sbconstruction1990",
        "business_name":  "SB Construction",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "evansjoineryservices",
        "business_name":  "Evans Joinery Services",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "mcintyrejoinery",
        "business_name":  "McIntyre Joinery",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "bespokejoineryedinburgh",
        "business_name":  "Bespoke Joinery Edinburgh",
        "location":       "Edinburgh",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "palazzo_glasgow",
        "business_name":  "Palazzo Glasgow",
        "location":       "Glasgow",
        "trade_category": "Tiler",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "jds_joinery",
        "business_name":  "JDS Joinery",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "edinburghleadcraftltd",
        "business_name":  "Edinburgh Lead Craft Ltd",
        "location":       "Edinburgh",
        "trade_category": "Roofer",
        "tags":           [],
    },
    {
        "handle":         "copper_and_grey_roofing",
        "business_name":  "Copper and Grey Roofing",
        "location":       "Scotland",
        "trade_category": "Roofer",
        "tags":           [],
    },
    {
        "handle":         "the_glasgow_joiner",
        "business_name":  "The Glasgow Joiner",
        "location":       "Glasgow",
        "trade_category": "Builder",
        "tags":           ["glasgow"],
    },
    {
        "handle":         "heartwoodjoiners",
        "business_name":  "Heartwood Joiners",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
    {
        "handle":         "lljoinery",
        "business_name":  "LL Joinery",
        "location":       "Scotland",
        "trade_category": "Builder",
        "tags":           [],
    },
]


# ── Build Airtable record ─────────────────────────────────────────────────────

def build_record(account: dict) -> dict:
    handle = account["handle"]
    return {
        "Business Name":   account["business_name"],
        "Instagram Handle": f"@{handle}",
        "Profile URL":     f"https://www.instagram.com/{handle}/",
        "Trade Category":  account["trade_category"],
        "Location":        account["location"],
        "Lead Score":      0,
        "TTM Status":      "researched",
        "Tags":            account["tags"],
        "Date Added":      datetime.date.today().isoformat(),
    }


# ── Airtable push ─────────────────────────────────────────────────────────────

def push_to_airtable(records: list[dict]) -> None:
    api   = Api(AIRTABLE_API_KEY)
    table = api.table(BASE_ID, TABLE_ID)

    for rec in records:
        try:
            result = table.create(rec)
            print(f"  ↑ {rec['Business Name']} → {result['id']}")
        except Exception as e:
            print(f"  ✗ Failed '{rec['Business Name']}': {e}")
            print(f"    Payload: {json.dumps(rec, indent=2, default=str)}")
        time.sleep(0.25)


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    records = [build_record(a) for a in ACCOUNTS]

    print(f"Pushing {len(records)} records to Airtable TTM Prospect Feed …\n")
    push_to_airtable(records)
    print(f"\nDone. {len(records)} records pushed.")


if __name__ == "__main__":
    main()
