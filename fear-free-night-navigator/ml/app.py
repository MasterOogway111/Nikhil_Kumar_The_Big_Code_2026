from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)
model      = joblib.load("model.pkl")
model_low  = joblib.load("model_low.pkl")
model_high = joblib.load("model_high.pkl")
FEATURES = [
    "poi_density", "commercial_activity", "road_isolation",
    "connectivity", "lighting_proxy", "time_of_day",
    "police_density", "police_distance_score", "police_coverage",
    "hospital_score", "business_density", "open_now_ratio"
]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        features = np.array([[data.get(f, 0) for f in FEATURES]])

        risk_score   = float(model.predict(features,      validate_features=False)[0])
        lower_bound  = float(model_low.predict(features,  validate_features=False)[0])
        upper_bound  = float(model_high.predict(features, validate_features=False)[0])

        risk_score  = round(max(0.0, min(1.0, risk_score)),  4)
        lower_bound = round(max(0.0, min(1.0, lower_bound)), 4)
        upper_bound = round(max(0.0, min(1.0, upper_bound)), 4)
        ci_width    = round(upper_bound - lower_bound, 4)

        return jsonify({
            "risk_score":           risk_score,
            "lower_bound":          lower_bound,
            "upper_bound":          upper_bound,
            "confidence_interval":  ci_width,
            "timestamp": __import__('datetime').datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({"error": "Prediction failed", "message": str(e)}), 500

@app.route("/metrics", methods=["GET"])
def metrics():
    """Serve model evaluation metrics from metrics.json"""
    try:
        metrics_path = os.path.join(os.path.dirname(__file__), "metrics.json")
        if not os.path.exists(metrics_path):
            return jsonify({"error": "metrics.json not found. Run evaluate.py first."}), 404
        with open(metrics_path, "r") as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "fear-free-night-navigator-ml-sidecar",
        "port": 5001
    }), 200

if __name__ == "__main__":
    print("Starting ML sidecar on http://0.0.0.0:5001")
    print("POST /predict — score a segment")
    print("GET /health  — health check")
    print("GET /metrics — model evaluation metrics")
    app.run(host="0.0.0.0", port=5001, debug=True)