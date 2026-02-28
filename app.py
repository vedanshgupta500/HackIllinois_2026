from flask import Flask, jsonify, render_template, request

from moggpt.scoring import FeatureScores, evaluate_framemogging

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/evaluate")
def evaluate():
    payload = request.get_json(force=True)
    try:
        scores = FeatureScores(
            jawline=int(payload.get("jawline", 0)),
            facial_symmetry=int(payload.get("facial_symmetry", 0)),
            posture=int(payload.get("posture", 0)),
            shoulder_width=int(payload.get("shoulder_width", 0)),
            confidence=int(payload.get("confidence", 0)),
        )
        result = evaluate_framemogging(scores)
        return jsonify(result)
    except (TypeError, ValueError) as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
