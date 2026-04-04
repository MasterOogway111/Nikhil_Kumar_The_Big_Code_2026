import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

FEATURES = [
    "poi_density", "commercial_activity", "road_isolation",
    "connectivity", "lighting_proxy", "time_of_day",
    "police_density", "police_distance_score", "police_coverage",
    "hospital_score", "business_density", "open_now_ratio"
]

# ─────────────────────────────────────────────
# Load model and test data
# ─────────────────────────────────────────────
model = joblib.load("model.pkl")

if os.path.exists("test_results.csv"):
    df = pd.read_csv("test_results.csv")
    X_test = df[FEATURES]
    y_test = df["risk"]
    y_pred = df["pred"]
else:
    # Fallback: use full dataset
    df = pd.read_csv("dataset.csv")
    X_test = df[FEATURES]
    y_test = df["risk"]
    y_pred = model.predict(X_test)

# ─────────────────────────────────────────────
# Core Metrics
# ─────────────────────────────────────────────
mae   = mean_absolute_error(y_test, y_pred)
from sklearn.metrics import root_mean_squared_error
rmse  = root_mean_squared_error(y_test, y_pred)
r2    = r2_score(y_test, y_pred)
rank_corr = pd.Series(y_test.values).corr(pd.Series(y_pred), method="spearman")

errors = np.array(y_pred) - np.array(y_test)
bias          = float(errors.mean())
max_over      = float(errors.max())
max_under     = float(errors.min())

# High risk accuracy (risk > 0.7)
high_risk_mask = y_test > 0.7
if high_risk_mask.sum() > 0:
    high_risk_mae = mean_absolute_error(
        y_test[high_risk_mask], y_pred[high_risk_mask]
    )
else:
    high_risk_mae = None

print("=" * 60)
print("        MODEL EVALUATION REPORT")
print("=" * 60)
print(f"\n  MAE:              {mae:.4f}   (target < 0.05)")
print(f"  RMSE:             {rmse:.4f}")
print(f"  R²:               {r2:.4f}   (target > 0.85)")
print(f"  Spearman Corr:    {rank_corr:.4f}   (target > 0.90)")
print(f"\n  Bias:             {bias:.4f}   (target ≈ 0.00)")
print(f"  Max Overestimate: {max_over:.4f}")
print(f"  Max Underestimate:{max_under:.4f}")
if high_risk_mae is not None:
    print(f"  High-Risk MAE:    {high_risk_mae:.4f}   (critical segments)")

# ─────────────────────────────────────────────
# Feature Importances
# ─────────────────────────────────────────────
imp = dict(zip(FEATURES, model.feature_importances_))
print(f"\n  Feature Importances:")
for k, v in sorted(imp.items(), key=lambda x: -x[1]):
    bar = "█" * int(v / max(imp.values()) * 20)
    print(f"    {k:<25} {bar} {v:.0f}")

# ─────────────────────────────────────────────
# Pass/Fail Summary
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
all_passed = True
checks = [
    ("MAE < 0.05",          mae < 0.05),
    ("R² > 0.85",           r2 > 0.85),
    ("Spearman > 0.90",     rank_corr > 0.90),
    ("Bias < 0.01",         abs(bias) < 0.01),
]
for label, passed in checks:
    status = "✅" if passed else "❌"
    print(f"  {status}  {label}")
    if not passed:
        all_passed = False

print("\n" + ("✅ ALL EVALUATION CRITERIA MET" if all_passed else "⚠️  SOME CRITERIA NOT MET"))
print("=" * 60)

# ─────────────────────────────────────────────
# Save metrics as JSON (for /metrics API endpoint)
# ─────────────────────────────────────────────
metrics = {
    "mae":           round(mae, 4),
    "rmse":          round(rmse, 4),
    "r2":            round(r2, 4),
    "spearman_corr": round(rank_corr, 4),
    "bias":          round(bias, 4),
    "max_overestimate":  round(max_over, 4),
    "max_underestimate": round(max_under, 4),
    "high_risk_mae": round(high_risk_mae, 4) if high_risk_mae else None,
    "n_test_samples": int(len(y_test)),
    "feature_importance": {
        k: int(v) for k, v in sorted(imp.items(), key=lambda x: -x[1])
    },
    "sample_predictions": [
        {
            "actual": round(float(y_test.iloc[i]), 4),
            "predicted": round(float(y_pred[i]), 4),
            "error": round(float(y_pred[i] - y_test.iloc[i]), 4)
        }
        for i in range(min(10, len(y_test)))
    ],
    "criteria": {label: bool(passed) for label, passed in checks},
    "all_passed": all_passed
}

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\n  Metrics saved → metrics.json")

# ─────────────────────────────────────────────
# Optional: SHAP + plots (only if matplotlib/shap installed)
# ─────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    # Residual plot
    plt.figure(figsize=(8, 4))
    plt.scatter(y_test, errors, alpha=0.3, color='steelblue', s=10)
    plt.axhline(0, color='red', linestyle='--', linewidth=1)
    plt.xlabel("Actual Risk Score")
    plt.ylabel("Prediction Error")
    plt.title("Residual Analysis — Fear Free Night Navigator")
    plt.tight_layout()
    plt.savefig("residuals.png", dpi=150)
    plt.close()
    print("  Residual plot saved → residuals.png")

    # Feature importance bar chart
    sorted_imp = sorted(imp.items(), key=lambda x: x[1])
    plt.figure(figsize=(8, 6))
    plt.barh([k for k, v in sorted_imp], [v for k, v in sorted_imp], color='steelblue')
    plt.xlabel("Importance Score")
    plt.title("Feature Importance — LightGBM Model")
    plt.tight_layout()
    plt.savefig("feature_importance.png", dpi=150)
    plt.close()
    print("  Feature importance plot saved → feature_importance.png")

    # Actual vs Predicted plot
    plt.figure(figsize=(8, 6))
    plt.scatter(y_test, y_pred, alpha=0.3, color='steelblue', s=10)
    plt.plot([0, 1], [0, 1], color='red', linestyle='--', linewidth=1, label='Perfect Prediction')
    plt.xlabel("Actual Risk Score")
    plt.ylabel("Predicted Risk Score")
    plt.title("Actual vs Predicted — Fear Free Night Navigator")
    plt.legend()
    plt.tight_layout()
    plt.savefig("actual_vs_predicted.png", dpi=150)
    plt.close()
    print("  Actual vs Predicted plot saved → actual_vs_predicted.png")

except ImportError:
    print("  ℹ️  matplotlib not installed — skipping plots")

try:
    import shap
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test.iloc[:200])
    shap.summary_plot(shap_values, X_test.iloc[:200],
                      feature_names=FEATURES, show=False)
    plt.savefig("shap_summary.png", bbox_inches='tight', dpi=150)
    plt.close()
    print("  SHAP summary plot saved → shap_summary.png")
except ImportError:
    print("  ℹ️  shap not installed — run: pip install shap")

print("\nDone. ✅")