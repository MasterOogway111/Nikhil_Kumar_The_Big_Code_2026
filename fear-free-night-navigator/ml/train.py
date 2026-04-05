import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import numpy as np

FEATURES = [
    "poi_density", "commercial_activity", "road_isolation",
    "connectivity", "lighting_proxy", "time_of_day",
    "police_density", "police_distance_score", "police_coverage",
    "hospital_score", "business_density", "open_now_ratio"
]

df = pd.read_csv("dataset.csv")
X, y = df[FEATURES], df["risk"]

X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42)
X_val,   X_test, y_val,   y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42)

print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

model = lgb.LGBMRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    num_leaves=31,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    verbose=-1
)

model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    callbacks=[lgb.early_stopping(30), lgb.log_evaluation(50)]
)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"\nTest MAE: {mae:.4f}  (target < 0.05)")

joblib.dump(model, "model.pkl")
print("Model saved → model.pkl")
# ── Quantile models for uncertainty quantification 
model_low = lgb.LGBMRegressor(
    objective='quantile', alpha=0.1,
    n_estimators=300, learning_rate=0.05,
    max_depth=5, num_leaves=31,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1
)
model_high = lgb.LGBMRegressor(
    objective='quantile', alpha=0.9,
    n_estimators=300, learning_rate=0.05,
    max_depth=5, num_leaves=31,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1
)

model_low.fit(X_train, y_train)
model_high.fit(X_train, y_train)

joblib.dump(model_low,  "model_low.pkl")
joblib.dump(model_high, "model_high.pkl")
print("Quantile models saved → model_low.pkl, model_high.pkl")

# Quick check
low_pred  = model_low.predict(X_test)
high_pred = model_high.predict(X_test)
print(f"Avg confidence interval width: {(high_pred - low_pred).mean():.4f}")

# Save test set for evaluate.py
test_df = X_test.copy()
test_df["risk"] = y_test.values
test_df["pred"] = y_pred
test_df.to_csv("test_results.csv", index=False)
print("Test results saved → test_results.csv")

feature_importance = dict(zip(FEATURES, model.feature_importances_))
print("\nFeature Importances:")
for feat, imp in sorted(feature_importance.items(), key=lambda x: -x[1]):
    print(f"  {feat}: {imp:.4f}")