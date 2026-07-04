# Ledger-90

Aplikasi credit scoring berbasis Flask dan React untuk menilai risiko keterlambatan cicilan 90 hari.

## Ringkasan

`Ledger-90` adalah proyek frontend React + backend Python Flask yang menggunakan model LightGBM terlatih untuk memprediksi risiko gagal bayar. Selain probabilitas default, API juga mengembalikan faktor risiko penting dengan kontribusi SHAP.

## Struktur Proyek

- `app.py` — Flask backend API
- `credit_scoring_lgb_model.pkl` — model LightGBM yang digunakan untuk prediksi
- `Frontend/` — aplikasi React + Vite sebagai antarmuka pengguna
- `package-lock.json` — lock file npm untuk frontend dependencies
- `Model.ipynb` — notebook eksplorasi/pelatihan model (opsional)

## Fitur

- Endpoints `GET /health` untuk status servis
- Endpoint `POST /predict` menerima JSON input dan mengembalikan hasil prediksi
- Engineered features otomatis untuk input yang dibutuhkan model
- Analisis faktor risiko dengan SHAP untuk menjelaskan prediksi
- Proxy Vite di frontend untuk menghindari masalah CORS

## Requirements

### Backend

- Python 3.11+ atau 3.12
- Flask
- Flask-CORS
- joblib
- pandas
- shap

### Frontend

- Node.js 18+ (atau versi kompatibel dengan Vite)
- npm

## Cara Menjalankan

### 1. Install dependency Python

```bash
python -m pip install flask flask-cors joblib pandas shap
```

### 2. Jalankan backend

```bash
python app.py
```

Backend akan tersedia di `http://localhost:8001`.

### 3. Jalankan frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend akan tersedia di `http://localhost:5173`.

## Contoh Request `POST /predict`

```json
{
  "RevolvingUtilizationOfUnsecuredLines": 0.45,
  "age": 35,
  "NumberOfTime30_59DaysPastDueNotWorse": 1,
  "DebtRatio": 0.3,
  "MonthlyIncome": 6000000,
  "NumberOfOpenCreditLinesAndLoans": 5,
  "NumberOfTimes90DaysLate": 0,
  "NumberRealEstateLoansOrLines": 1,
  "NumberOfTime60_89DaysPastDueNotWorse": 0,
  "NumberOfDependents": 2
}
```

## Hasil Response

Response JSON akan berisi:

- `probability_default` — probabilitas default (rentang 0-1)
- `risk_label` — `Low Risk`, `Medium Risk`, atau `High Risk`
- `top_factors` — daftar 5 faktor teratas dengan kontribusi SHAP

## Catatan

- Pastikan file `credit_scoring_lgb_model.pkl` berada di folder yang sama dengan `app.py`
- Frontend menggunakan proxy Vite untuk meneruskan request `POST /predict` ke backend

## Tips Debug

- Jika `unexpected token` muncul di browser, biasanya backend sedang mengembalikan HTML error page.
- Jika `Failed to fetch`, pastikan backend berjalan di `http://localhost:8001`.

---

Proyek ini cocok untuk demo credit scoring dan eksplorasi model interpretability menggunakan SHAP.