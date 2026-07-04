import { useMemo, useState } from "react";

const API_URL = "/predict";

const initialForm = {
  age: 35,
  MonthlyIncome: 6000000,
  DebtRatio: 0.3,
  RevolvingUtilizationOfUnsecuredLines: 0.45,
  NumberOfOpenCreditLinesAndLoans: 5,
  NumberRealEstateLoansOrLines: 1,
  NumberOfDependents: 2,
  NumberOfTime30_59DaysPastDueNotWorse: 1,
  NumberOfTime60_89DaysPastDueNotWorse: 0,
  NumberOfTimes90DaysLate: 0,
};

const fields = [
  { name: "age", label: "Umur", type: "number", suffix: "tahun", min: 18, step: 1 },
  { name: "MonthlyIncome", label: "Pendapatan Bulanan", type: "number", suffix: "Rp", min: 0, step: 100000 },
  { name: "DebtRatio", label: "Rasio Utang / Pendapatan", type: "number", suffix: "", min: 0, step: 0.01 },
  { name: "RevolvingUtilizationOfUnsecuredLines", label: "Utilisasi Kartu Kredit", type: "number", suffix: "", min: 0, step: 0.01 },
  { name: "NumberOfOpenCreditLinesAndLoans", label: "Jumlah Kredit/Pinjaman Aktif", type: "number", suffix: "", min: 0, step: 1 },
  { name: "NumberRealEstateLoansOrLines", label: "Jumlah Kredit Properti", type: "number", suffix: "", min: 0, step: 1 },
  { name: "NumberOfDependents", label: "Jumlah Tanggungan", type: "number", suffix: "", min: 0, step: 1 },
  { name: "NumberOfTime30_59DaysPastDueNotWorse", label: "Telat Bayar 30–59 Hari", type: "number", suffix: "", min: 0, step: 1 },
  { name: "NumberOfTime60_89DaysPastDueNotWorse", label: "Telat Bayar 60–89 Hari", type: "number", suffix: "", min: 0, step: 1 },
  { name: "NumberOfTimes90DaysLate", label: "Telat Bayar 90+ Hari", type: "number", suffix: "", min: 0, step: 1 },
];

function App() {
  const [values, setValues] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const riskColor = useMemo(() => {
    if (!result) return "#7f8fa6";
    if (result.risk_label === "High Risk") return "#f14d4d";
    if (result.risk_label === "Medium Risk") return "#f0a82d";
    return "#41c48c";
  }, [result]);

  const handleChange = (name, rawValue) => {
    const value = rawValue === "" ? "" : Number(rawValue);
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    const payload = {
      ...values,
      MonthlyIncome: Number(values.MonthlyIncome),
      DebtRatio: Number(values.DebtRatio),
      RevolvingUtilizationOfUnsecuredLines: Number(values.RevolvingUtilizationOfUnsecuredLines),
      age: Number(values.age),
      NumberOfOpenCreditLinesAndLoans: Number(values.NumberOfOpenCreditLinesAndLoans),
      NumberRealEstateLoansOrLines: Number(values.NumberRealEstateLoansOrLines),
      NumberOfDependents: Number(values.NumberOfDependents),
      NumberOfTime30_59DaysPastDueNotWorse: Number(values.NumberOfTime30_59DaysPastDueNotWorse),
      NumberOfTime60_89DaysPastDueNotWorse: Number(values.NumberOfTime60_89DaysPastDueNotWorse),
      NumberOfTimes90DaysLate: Number(values.NumberOfTimes90DaysLate),
    };

    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail || "Terjadi kesalahan pada server");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Tidak bisa terhubung ke server API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="glass-panel">
        <header className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Analisis Risiko Kredit</span>
            <h1>Ledger-90</h1>
            <p>
              Aplikasi kredit scoring modern untuk menilai risiko telat bayar 90+ hari.
              Masukkan profil applicant secara cepat dan lihat insight yang jernih.
            </p>
          </div>
          <div className="hero-stats">
            <div className="stat-card primary">
              <span>Prediksi Akurasi</span>
              <strong>86%</strong>
            </div>
            <div className="stat-card">
              <span>Fitur terpakai</span>
              <strong>10</strong>
            </div>
            <div className="stat-card">
              <span>Respon instan</span>
              <strong>&lt; 1 detik</strong>
            </div>
          </div>
        </header>

        <section className="layout-grid">
          <form className="input-card" onSubmit={handleSubmit}>
            <div className="card-title">Profil Applicant</div>
            <div className="fields-grid">
              {fields.map((field) => (
                <label key={field.name} className="field-group">
                  <span>{field.label}</span>
                  <div className="field-row">
                    <div className="field-row">
                    <input
                      type={field.type}
                      value={values[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      min={field.min}
                      step={field.step}
                    />
                    {field.suffix && <span className="suffix">{field.suffix}</span>}
                  </div>
                  </div>
                </label>
              ))}
            </div>
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? "Menilai risiko..." : "Nilai Risiko Kredit"}
            </button>
            {error && <div className="alert-box">{error}</div>}
          </form>

          <aside className="result-card">
            <div className="card-title">Hasil Penilaian</div>
            {!result && !error && (
              <div className="empty-state">
                Lengkapi data applicant lalu tekan tombol untuk melihat probabilitas kredit dan alasannya.
              </div>
            )}
            {result && (
              <div className="result-content">
                <div className="result-banner" style={{ backgroundColor: riskColor + "22" }}>
                  <div>
                    <p className="summary-label">Probabilitas Default</p>
                    <strong>{(result.probability_default * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="risk-pill" style={{ background: riskColor }}>
                    {result.risk_label}
                  </div>
                </div>
                <div className="insight-block">
                  <h3>Top Faktor Risiko</h3>
                  <ul>
                    {result.top_factors.map((factor) => (
                      <li key={factor.feature}>
                        <div>
                          <span className="factor-name">{factor.feature.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className="factor-value">{factor.value}</span>
                        </div>
                        <span className={`impact-chip ${factor.direction}`}>
                          {factor.direction === "increases_risk" ? "+" : "–"} {Math.abs(factor.impact)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="note-block">
                  <strong>Catatan:</strong> hasil prediksi adalah rekomendasi, bukan keputusan final.
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}

export default App;
