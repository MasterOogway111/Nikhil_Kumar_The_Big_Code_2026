import joblib
import numpy as np

model = joblib.load("model.pkl")
FEATURES_COUNT = 6

def test_output_range():
    """Test that all predictions are in valid range [0, 1]"""
    X = np.random.uniform(0, 1, (100, FEATURES_COUNT))
    preds = model.predict(X)
    assert all(0 <= p <= 1 for p in preds), f"Found predictions outside [0, 1]: {preds}"
    print("✅ PASS: all predictions in [0, 1]")

def test_high_isolation_high_risk():
    """
    Test that high isolation with no POI and night travel → high risk
    Features: [poi_density, commercial_activity, road_isolation, connectivity, lighting_proxy, time_of_day]
    """
    # No POI, max isolation, night → high risk
    X = np.array([[0.0, 0.0, 1.0, 0.0, 0.0, 1.0]])
    risk = model.predict(X)[0]
    assert risk > 0.6, f"Expected risk > 0.6 for high isolation, got {risk:.3f}"
    print(f"✅ PASS: high isolation → risk = {risk:.3f}")

def test_busy_area_low_risk():
    """
    Test that busy area with good lighting and daytime → low risk
    Features: [poi_density, commercial_activity, road_isolation, connectivity, lighting_proxy, time_of_day]
    """
    # Dense POI, connected, well-lit, daytime → low risk
    X = np.array([[1.0, 1.0, 0.0, 1.0, 1.0, 0.0]])
    risk = model.predict(X)[0]
    assert risk < 0.3, f"Expected risk < 0.3 for busy area, got {risk:.3f}"
    print(f"✅ PASS: busy area → risk = {risk:.3f}")

def test_feature_count():
    """Test that model expects correct number of features"""
    try:
        X_wrong = np.array([[0.5, 0.5, 0.5, 0.5]])  # 4 features instead of 6
        model.predict(X_wrong)
        print("❌ FAIL: model should require 6 features")
        assert False, "Model accepted wrong number of features"
    except ValueError:
        print("✅ PASS: model correctly rejects wrong feature count")

def test_night_vs_day():
    """Test that night travel increases risk"""
    # Same location, different times
    features_daytime = np.array([[0.5, 0.5, 0.5, 0.5, 0.5, 0.0]])
    features_nighttime = np.array([[0.5, 0.5, 0.5, 0.5, 0.5, 1.0]])
    
    risk_day = model.predict(features_daytime)[0]
    risk_night = model.predict(features_nighttime)[0]
    
    assert risk_night >= risk_day, f"Night risk {risk_night:.3f} should be >= day risk {risk_day:.3f}"
    print(f"✅ PASS: night risk ({risk_night:.3f}) >= day risk ({risk_day:.3f})")

if __name__ == "__main__":
    print("=" * 60)
    print("ML MODEL VALIDATION TESTS")
    print("=" * 60)
    
    try:
        test_output_range()
        test_high_isolation_high_risk()
        test_busy_area_low_risk()
        test_feature_count()
        test_night_vs_day()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        print("=" * 60)
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("=" * 60)
        exit(1)
