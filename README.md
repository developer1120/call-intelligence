# PestLaunch Call Intelligence

Every customer call a pest control company records becomes a transcript, a call type, an outcome,
a PestLaunch scorecard grade, coaching for the rep and a short list of things the owner should do
next. It is built to sit inside PestLaunch OS (same navigation, look and "Assign" pattern).

## What it does

| For the owner | For managers | For reps |
|---|---|---|
| A plain-language read of the calls (bookings, saves, revenue at risk) | Team leaderboard and the steps the team skips most | Coaching on every call with a "try saying" line in the manual's style |
| **Needs attention**: lost sales to call back, unsaved cancellations, promised follow-ups, risks, ranked by value, one click to assign | Per-rep coaching plan built from their own calls | Every scorecard point linked to the exact moment in the call |
| Where calls break down across the call process | Override any step or the call type; the score re-totals | |

### Pipeline

```
upload ─▶ Deepgram Nova-3 ─▶ mask contact details ─▶ (speaker repair) ─▶ triage ─▶ score + coach ─▶ verify ─▶ store
          diarizer v2,          names, phones, emails,    AI labels lines      type, outcome,   Sales 17 /       every quote
          PCI redaction         addresses, ZIPs;          when diarization     details, risks,  All Calls 12 /   matched to the
                                employee names kept       hears one voice      follow-ups       Retention 12     transcript
```

* **Transcription:** Deepgram Nova-3 with the v2 diarizer, pest-control key terms and PCI redaction.
  Card details that reps read back aloud are masked as well.
* **Privacy:** customer names, phone numbers, emails, street addresses and ZIP codes are replaced with
