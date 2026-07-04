"""
Credit Scoring API
-------------------
Simple Flask backend untuk model LightGBM credit scoring.

Jalankan:
    python app.py

Lalu akses:
    http://localhost:8001/health
    http://localhost:8001/predict
"""

import joblib
import pandas as pd
import shap
from flask import Flask, jsonify, request
from flask_cors import CORS

MODEL_PATH = "credit_scoring_lgb_model.pkl"

try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    raise RuntimeError(
        f"Model file '{MODEL_PATH}' gak ketemu. "
        "Letakkan file .pkl di folder Project1 sama dengan app.py."
    )

explainer = shap.TreeExplainer(model)
FEATURE_COLUMNS = [
    "Unnamed_0",
    "RevolvingUtilizationOfUnsecuredLines",
    "age",
    "NumberOfTime30_59DaysPastDueNotWorse",
    "DebtRatio",
    "MonthlyIncome",
    "NumberOfOpenCreditLinesAndLoans",
    "NumberOfTimes90DaysLate",
    "NumberRealEstateLoansOrLines",
    "NumberOfTime60_89DaysPastDueNotWorse",
    "NumberOfDependents",
    "TotalPastDue",
    "IncomePerDependent",
    "AgeGroup_adult",
    "AgeGroup_middle_age",
    "AgeGroup_senior",
    "CreditLinesPerAge",
]

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

required_fields = [
    "RevolvingUtilizationOfUnsecuredLines",
    "age",
    "NumberOfTime30_59DaysPastDueNotWorse",
    "DebtRatio",
    "MonthlyIncome",
    "NumberOfOpenCreditLinesAndLoans",
    "NumberOfTimes90DaysLate",
    "NumberRealEstateLoansOrLines",
    "NumberOfTime60_89DaysPastDueNotWorse",
    "NumberOfDependents",
]


def engineer_features(data: dict) -> pd.DataFrame:
    row = {
        "Unnamed_0": 0,
        **data,
        "TotalPastDue": (
            data["NumberOfTime30_59DaysPastDueNotWorse"]
            + data["NumberOfTime60_89DaysPastDueNotWorse"]
            + data["NumberOfTimes90DaysLate"]
        ),
    }
    row["IncomePerDependent"] = row["MonthlyIncome"] / (row["NumberOfDependents"] + 1)
    age = row["age"]
    row["AgeGroup_adult"] = 1 if 30 < age <= 45 else 0
    row["AgeGroup_middle_age"] = 1 if 45 < age <= 60 else 0
    row["AgeGroup_senior"] = 1 if age > 60 else 0
    row["CreditLinesPerAge"] = row["NumberOfOpenCreditLinesAndLoans"] / age
    df = pd.DataFrame([row])
    return df[FEATURE_COLUMNS]


@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Credit Scoring API aktif."})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"detail": "Request body harus JSON."}), 400

        missing = [field for field in required_fields if field not in data]
        if missing:
            return jsonify({"detail": f"Field hilang: {', '.join(missing)}"}), 400

        try:
            values = {
                field: int(data[field]) if field == "age" else float(data[field])
                for field in required_fields
            }
        except (TypeError, ValueError):
            return jsonify({"detail": "Semua field harus berupa angka."}), 400

        try:
            X = engineer_features(values)
        except ZeroDivisionError:
            return jsonify({"detail": "age tidak boleh 0"}), 400

        proba = model.predict_proba(X)[:, 1][0]
        if proba >= 0.48:
            label = "High Risk"
        elif proba >= 0.11:
            label = "Medium Risk"
        else:
            label = "Low Risk"

        shap_values = explainer.shap_values(X)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]

        contributions = list(zip(FEATURE_COLUMNS, shap_values[0]))
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        top_factors = [
            {
                "feature": feat,
                "value": float(X.iloc[0][feat]),
                "impact": round(float(impact), 4),
                "direction": "increases_risk" if impact > 0 else "decreases_risk",
            }
            for feat, impact in contributions[:5]
        ]

        return jsonify({
            "probability_default": round(float(proba), 4),
            "risk_label": label,
            "top_factors": top_factors,
        })
    except Exception as err:
        import traceback

        traceback.print_exc()
        return (
            jsonify(
                {
                    "detail": "Internal server error",
                    "error": str(err),
                }
            ),
            500,
        )


@app.route("/predict", methods=["OPTIONS"])
def predict_options():
    response = jsonify({})
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
