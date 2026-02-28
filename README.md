# HackIllinois_2026 - MogGPT

MogGPT is a hackathon prototype app that predicts whether someone got **framemogged** based on facial and body feature scores.

## Features
- Fast scoring engine with weighted features (jawline, symmetry, posture, shoulder width, confidence).
- REST API endpoint at `POST /api/evaluate`.
- Simple web UI with sliders for quick demo use.
- Unit tests for scoring logic.

## Quick start
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000`.

## API example
```bash
curl -X POST http://localhost:5000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"jawline":8,"facial_symmetry":7,"posture":6,"shoulder_width":8,"confidence":7}'
```
