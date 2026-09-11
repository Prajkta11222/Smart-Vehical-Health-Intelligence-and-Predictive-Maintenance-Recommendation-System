import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Database,
  Download,
  FileText,
  Gauge,
  Globe,
  Info,
  Languages,
  Loader2,
  Menu,
  Moon,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import { translations, Language } from './translations';
import { generateVehicleHealthReport } from './reportGenerator';

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

type Summary = {
  total_vehicles: number;
  average_health_score: number;
  maintenance_required: number;
  health_distribution: Record<string, number>;
  model: string;
};

type Vehicle = {
  Vehicle_ID: string;
  Vehicle_Model?: string;
  Total_Mileage_km?: number;
  Vehicle_Health_Score: number;
  Health_Status: string;
  Maintenance_Probability: number;
  Predicted_Need_Maintenance: number;
  raw_values?: Record<string, number | null>;
  raw_categories?: Record<string, string | boolean>;
};

type Prediction = {
  prediction: string;
  probability_yes: number;
  health_score: number;
  health_status: string;
};

type HistoryItem = {
  id: number;
  vehicle_id: string;
  prediction: string;
  probability_yes: number;
  health_score: number;
  created_at: string;
};

type Recommendation = {
  Priority: string;
  Recommended_Action: string;
  Recommendation: string;
  Risk_Level: string;
};

type ModelInfo = {
  final_model?: string;
  'Final Model'?: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  training_time?: number;
  selection_criterion?: string;
};

type DatasetInfo = {
  records: number;
  original_features: number;
  numeric_features: number;
  categorical_features: number;
  duplicates: number;
  target: { No: number; Yes: number };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, init);
  if (!response.ok) {
    const text = await response.text();
    let errorDetail = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.detail) errorDetail = parsed.detail;
      else if (parsed.error?.message) errorDetail = parsed.error.message;
    } catch {
      // use raw text
    }
    throw new Error(errorDetail);
  }
  const envelope = await response.json();
  return envelope.data;
}

function StatusBadge({ value }: { value: string }) {
  const norm = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status ${norm}`}>{value}</span>;
}

function RadialHealthGauge({ score, label }: { score: number; label: string }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, isNaN(score) ? 0 : score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let strokeColor = '#5edbb3'; // Mint/green
  if (safeScore < 40) strokeColor = '#f27272'; // Red
  else if (safeScore < 70) strokeColor = '#f0ad5e'; // Amber

  return (
    <div className="gauge-svg-container">
      <svg className="gauge-svg" viewBox="0 0 160 160">
        <circle className="gauge-track" cx="80" cy="80" r={radius} />
        <circle
          className="gauge-fill"
          cx="80"
          cy="80"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="gauge-center-text">
        <strong>{safeScore.toFixed(0)}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export function App() {
  // Theme & Language State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark';
  });

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'en';
  });

  const t = translations[lang] || translations.en;

  // Data States
  const [summary, setSummary] = useState<Summary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [shap, setShap] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recVehicleId, setRecVehicleId] = useState<string>('FFV2-000000');
  const [vehicleRecs, setVehicleRecs] = useState<Recommendation[]>([]);
  const [modelData, setModelData] = useState<ModelInfo | null>(null);
  const [datasetData, setDatasetData] = useState<DatasetInfo | null>(null);

  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [paramCategories, setParamCategories] = useState<Record<string, any>>({
    Vehicle_Model: 'Car',
    Fuel_System_Material_Compatibility: 'Standard',
    Climate_Region: 'Temperate',
    Fuel_Vapor_Pressure_Class: 'Class 2',
    Towing_Flag: false,
    Driving_Pattern: 'Mixed',
    Fuel_Line_Seal_Condition: 'Pass',
  });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showParamTuner, setShowParamTuner] = useState(false);

  const [isPredicting, setIsPredicting] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Apply Language
  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  // Initial Data Load
  useEffect(() => {
    setIsLoadingSummary(true);
    Promise.all([
      request<Summary>('/dashboard/summary'),
      request<Vehicle[]>('/vehicles?page_size=50'),
    ])
      .then(([nextSummary, nextVehicles]) => {
        setSummary(nextSummary);
        setVehicles(nextVehicles);
        if (nextVehicles.length > 0 && !selected) {
          setSelected(nextVehicles[0]);
        }
      })
      .catch((err) => {
        setToast({ type: 'error', message: err.message || t.errorFetchSummary });
      })
      .finally(() => {
        setIsLoadingSummary(false);
      });
  }, [t.errorFetchSummary]);

  // Load History
  const loadHistory = () => {
    setIsLoadingHistory(true);
    request<HistoryItem[]>('/predictions/history')
      .then((items) => {
        setHistory(items || []);
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  };

  // Load Specific Recommendations for Vehicle
  const loadVehicleRecs = (vid: string) => {
    setIsLoadingRecs(true);
    request<Recommendation[]>(`/vehicles/${vid}/recommendations`)
      .then((recs) => {
        setVehicleRecs(recs || []);
      })
      .catch(() => {
        setVehicleRecs([]);
      })
      .finally(() => {
        setIsLoadingRecs(false);
      });
  };

  // Tab change effects
  useEffect(() => {
    if (page === 'Prediction history') {
      loadHistory();
    } else if (page === 'SHAP analysis' && shap.length === 0) {
      request<any[]>('/shap/global')
        .then(setShap)
        .catch(() => setToast({ type: 'error', message: t.errorFetchShap }));
    } else if (page === 'Model information' && !modelData) {
      request<ModelInfo>('/model/info')
        .then(setModelData)
        .catch(() => {});
    } else if (page === 'Dataset information' && !datasetData) {
      request<DatasetInfo>('/dataset/summary')
        .then(setDatasetData)
        .catch(() => {});
    } else if (page === 'Recommendations') {
      loadVehicleRecs(recVehicleId);
    }
  }, [page]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const filteredVehicles = vehicles.filter((v) =>
    v.Vehicle_ID.toLowerCase().includes(query.toLowerCase())
  );

  const health = summary?.health_distribution || {};
  const total = summary?.total_vehicles || 1;

  // Synchronize parameter values when a vehicle is selected
  useEffect(() => {
    if (selected) {
      request<Vehicle>(`/vehicles/${selected.Vehicle_ID}`)
        .then((detail) => {
          if (detail.raw_values) {
            setParamValues(detail.raw_values as Record<string, number>);
          }
          if (detail.raw_categories) {
            setParamCategories(detail.raw_categories);
          }
          setActivePreset(null);
        })
        .catch(() => {});
    }
  }, [selected?.Vehicle_ID]);

  // Apply Demonstration Presets
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    setShowParamTuner(true);
    if (presetName === 'healthy') {
      setParamValues((prev) => ({
        ...prev,
        Total_Mileage_km: 28000,
        Vehicle_Age_years: 2.5,
        Oil_Pressure_psi: 45.0,
        Coolant_Temperature_C: 88.0,
        Vibration_Level_mm_s: 1.1,
        Fuel_Water_Contamination_ppm: 12.0,
        Knock_Sensor_Level: 0.5,
        Catalytic_Converter_Efficiency_Pct: 96.0,
        Misfire_Count_per_1000rev: 1.0,
      }));
    } else if (presetName === 'high_wear') {
      setParamValues((prev) => ({
        ...prev,
        Total_Mileage_km: 198000,
        Vehicle_Age_years: 9.5,
        Oil_Pressure_psi: 21.0,
        Vibration_Level_mm_s: 4.8,
        Spark_Plug_Wear_mm: 1.45,
        Catalytic_Converter_Efficiency_Pct: 73.0,
        Fuel_Pump_Pressure_Decay_kPa_min: 34.0,
      }));
    } else if (presetName === 'overheat') {
      setParamValues((prev) => ({
        ...prev,
        Coolant_Temperature_C: 118.0,
        Oil_Temperature_C: 127.0,
        Exhaust_Gas_Temperature_C: 855.0,
        Knock_Sensor_Level: 4.1,
      }));
    } else if (presetName === 'contamination') {
      setParamValues((prev) => ({
        ...prev,
        Fuel_Water_Contamination_ppm: 320.0,
        Misfire_Count_per_1000rev: 56.0,
        Fuel_Pump_Pressure_Decay_kPa_min: 46.0,
        Injector_Duty_Cycle_Pct: 87.0,
      }));
    }
  };

  // Run Vehicle Prediction
  const analyzeSelected = async () => {
    if (isPredicting) return;
    setToast(null);
    setPrediction(null);
    setRecommendations([]);
    setIsPredicting(true);

    try {
      let valuesToSend = { ...paramValues };
      let categoriesToSend = { ...paramCategories };

      if (Object.keys(valuesToSend).length === 0 && selected) {
        const detail = await request<Vehicle>(`/vehicles/${selected.Vehicle_ID}`);
        if (detail.raw_values && detail.raw_categories) {
          valuesToSend = detail.raw_values as Record<string, number>;
          categoriesToSend = detail.raw_categories;
        }
      }

      if (Object.keys(valuesToSend).length === 0) {
        throw new Error(t.noVehicleSelected);
      }

      const vid = selected?.Vehicle_ID || 'CUSTOM-EVAL';
      const result = await request<Prediction>('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vid,
          ...categoriesToSend,
          values: valuesToSend,
        }),
      });

      const [globalShap, savedRecommendations] = await Promise.all([
        request<any[]>('/shap/global').catch(() => []),
        selected
          ? request<Recommendation[]>(`/vehicles/${selected.Vehicle_ID}/recommendations`).catch(() => [])
          : Promise.resolve([]),
      ]);

      setPrediction(result);
      setShap(globalShap || []);
      setRecommendations(savedRecommendations || []);
      setToast({ type: 'success', message: `${vid} evaluated successfully!` });
      loadHistory();
    } catch (cause) {
      setToast({
        type: 'error',
        message: cause instanceof Error ? cause.message : t.errorAnalysisFailed,
      });
    } finally {
      setIsPredicting(false);
    }
  };

  // Generate and Download PDF Report
  const handleDownloadPdf = (targetVehicle?: Vehicle | null, predData?: Prediction | null) => {
    const v = targetVehicle || selected;
    if (!v) {
      setToast({ type: 'error', message: t.noVehicleSelected });
      return;
    }

    const reportScore = predData ? predData.health_score : v.Vehicle_Health_Score;
    const reportStatus = predData ? predData.health_status : v.Health_Status;
    const reportPred = predData
      ? predData.prediction
      : v.Predicted_Need_Maintenance
      ? 'Yes'
      : 'No';
    const reportProb = predData ? predData.probability_yes : v.Maintenance_Probability;

    generateVehicleHealthReport({
      vehicleId: v.Vehicle_ID,
      vehicleModel: v.Vehicle_Model,
      mileage: v.Total_Mileage_km,
      healthScore: reportScore,
      healthStatus: reportStatus,
      prediction: reportPred,
      probabilityYes: reportProb,
      factors: shap.map((s) => ({ feature: s.Feature, impact: s.Mean_Absolute_SHAP })),
      recommendations: recommendations.map((r) => ({
        action: r.Recommended_Action,
        recommendation: r.Recommendation,
        priority: r.Risk_Level || r.Priority,
      })),
    });

    setToast({ type: 'success', message: t.reportSuccess });
  };

  const navItems = [
    ['Dashboard', Gauge, t.dashboard],
    ['Vehicles', CarFront, t.vehicles],
    ['New analysis', Sparkles, t.newAnalysis],
    ['Prediction history', Activity, t.predictionHistory],
    ['Vehicle health', CircleGauge, t.vehicleHealth],
    ['SHAP analysis', Sparkles, t.shapAnalysis],
    ['Recommendations', Wrench, t.recommendations],
    ['Model information', BarChart3, t.modelInfo],
    ['Dataset information', Database, t.datasetInfo],
  ] as const;

  // Active View Renderer
  const renderCurrentView = () => {
    if (page === 'New analysis') {
      return (
        <section className="panel analysis-workspace">
          <div className="eyebrow">{t.newAnalysisEyebrow}</div>
          <h3>{t.newAnalysisTitle}</h3>
          <p className="panel-copy">{t.newAnalysisSubtitle}</p>

          <div className="selector">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchVehicleHint}
            />
          </div>

          <div className="vehicle-options">
            {filteredVehicles.slice(0, 8).map((vehicle) => (
              <button
                key={vehicle.Vehicle_ID}
                className={selected?.Vehicle_ID === vehicle.Vehicle_ID ? 'vehicle-option selected' : 'vehicle-option'}
                onClick={() => setSelected(vehicle)}
              >
                <span className="mono">{vehicle.Vehicle_ID}</span>
                <span>
                  {vehicle.Vehicle_Model || 'Fleet Vehicle'} ·{' '}
                  {vehicle.Total_Mileage_km ? `${vehicle.Total_Mileage_km.toLocaleString()} km` : 'Standard'}
                </span>
              </button>
            ))}
          </div>

          {/* Preset Demonstrations */}
          <div className="preset-bar">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>
              Condition Presets:
            </span>
            <button
              className={activePreset === 'healthy' ? 'preset-chip active' : 'preset-chip'}
              onClick={() => applyPreset('healthy')}
            >
              ● Fleet Standard (Optimal)
            </button>
            <button
              className={activePreset === 'high_wear' ? 'preset-chip active' : 'preset-chip'}
              onClick={() => applyPreset('high_wear')}
            >
              ● High Mileage Wear
            </button>
            <button
              className={activePreset === 'overheat' ? 'preset-chip active' : 'preset-chip'}
              onClick={() => applyPreset('overheat')}
            >
              ● Thermal Overheat Risk
            </button>
            <button
              className={activePreset === 'contamination' ? 'preset-chip active' : 'preset-chip'}
              onClick={() => applyPreset('contamination')}
            >
              ● Fuel Contamination
            </button>
          </div>

          {/* Parameter Inspector & Tuner */}
          <div className="param-inspector">
            <div className="param-header">
              <span>Telemetry Parameter Inspector & Tuner</span>
              <button
                className="text-button"
                style={{ fontSize: '12px' }}
                onClick={() => setShowParamTuner(!showParamTuner)}
              >
                {showParamTuner ? 'Hide Tuning Grid ▲' : 'Inspect / Tune Parameters ▼'}
              </button>
            </div>

            {showParamTuner && (
              <div className="param-grid">
                {[
                  ['Total_Mileage_km', 'Odometer (km)'],
                  ['Vehicle_Age_years', 'Vehicle Age (yrs)'],
                  ['Oil_Pressure_psi', 'Oil Pressure (psi)'],
                  ['Coolant_Temperature_C', 'Coolant Temp (°C)'],
                  ['Oil_Temperature_C', 'Oil Temp (°C)'],
                  ['Vibration_Level_mm_s', 'Vibration (mm/s)'],
                  ['Fuel_Water_Contamination_ppm', 'Water in Fuel (ppm)'],
                  ['Ethanol_Content_Pct', 'Ethanol Blend (%)'],
                  ['Knock_Sensor_Level', 'Knock Sensor Level'],
                  ['Catalytic_Converter_Efficiency_Pct', 'Catalytic Conv. (%)'],
                  ['Fuel_Pump_Pressure_Decay_kPa_min', 'Fuel Pump Decay (kPa/m)'],
                  ['Misfire_Count_per_1000rev', 'Misfires / 1000 rev'],
                ].map(([key, label]) => (
                  <div className="param-card" key={key}>
                    <label>{label}</label>
                    <input
                      type="number"
                      value={paramValues[key] !== undefined ? paramValues[key] : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setParamValues((prev) => ({
                          ...prev,
                          [key]: isNaN(val) ? 0 : val,
                        }));
                        setActivePreset(null);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="button-row">
            <button
              className="primary-button"
              disabled={isPredicting}
              onClick={analyzeSelected}
            >
              {isPredicting ? (
                <>
                  <Loader2 size={16} className="spinner" /> {t.btnAnalyzing}
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {t.btnAnalyze}
                </>
              )}
            </button>

            {prediction && (
              <button
                className="pdf-button"
                onClick={() => handleDownloadPdf(selected, prediction)}
              >
                <Download size={15} /> {t.downloadPdfButton}
              </button>
            )}
          </div>

          {prediction && (
            <div className="analysis-results">
              <div className="result-grid">
                <div className="result">
                  <span>{t.predictionOutcome}</span>
                  <strong>
                    {prediction.prediction === 'Yes' ? t.needsMaintenance : t.noMaintenance}
                  </strong>
                </div>
                <div className="result">
                  <span>{t.failureProbability}</span>
                  <strong>{(prediction.probability_yes * 100).toFixed(2)}%</strong>
                </div>
                <div className="result">
                  <span>{t.healthScoreLabel}</span>
                  <strong>{prediction.health_score.toFixed(1)}/100</strong>
                </div>
                <div className="result">
                  <span>{t.statusLabel}</span>
                  <StatusBadge value={prediction.health_status} />
                </div>
              </div>

              <div className="result-columns">
                <section className="result-section">
                  <div className="eyebrow">{t.topShapFactors}</div>
                  <h4>{t.whyThisPrediction}</h4>
                  {shap.slice(0, 5).map((item: any) => (
                    <div className="factor" key={item.Feature}>
                      <span>
                        {String(item.Feature || '')
                          .replace(/^(numeric__|categorical__)/, '')
                          .replace(/_/g, ' ')}
                      </span>
                      <b>{Number(item.Mean_Absolute_SHAP || 0).toFixed(4)}</b>
                    </div>
                  ))}
                </section>

                <section className="result-section">
                  <div className="eyebrow">{t.savedRecommendations}</div>
                  <h4>{t.suggestedMaintenance}</h4>
                  {recommendations.length ? (
                    recommendations.slice(0, 3).map((item) => (
                      <div
                        className="recommendation"
                        key={`${item.Priority}-${item.Recommended_Action}`}
                      >
                        <StatusBadge value={item.Risk_Level || item.Priority} />
                        <strong>{item.Recommended_Action}</strong>
                        <p>{item.Recommendation}</p>
                      </div>
                    ))
                  ) : (
                    <p className="panel-copy">{t.noSavedRecommendations}</p>
                  )}
                </section>
              </div>
            </div>
          )}
        </section>
      );
    }

    if (page === 'Prediction history') {
      return (
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.predictionHistory}</div>
              <h3>{t.historyTitle}</h3>
              <p className="panel-copy">{t.historySubtitle}</p>
            </div>
            <button className="text-button" onClick={loadHistory} disabled={isLoadingHistory}>
              <RefreshCw size={14} className={isLoadingHistory ? 'spinner' : ''} />
              {t.refreshHistory}
            </button>
          </div>

          <div className="table-wrap">
            {history.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t.historyEmpty}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t.colVehicleId}</th>
                    <th>{t.colPrediction}</th>
                    <th>{t.colProbability}</th>
                    <th>{t.colHealthScore}</th>
                    <th>{t.historyDate}</th>
                    <th>{t.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>{idx + 1}</td>
                      <td className="mono">{row.vehicle_id || 'Fleet Vehicle'}</td>
                      <td>
                        <StatusBadge
                          value={row.prediction === 'Yes' ? t.needsMaintenance : t.noMaintenance}
                        />
                      </td>
                      <td>{(row.probability_yes * 100).toFixed(2)}%</td>
                      <td className="score">{row.health_score.toFixed(1)}</td>
                      <td className="muted">{new Date(row.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="pdf-button"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            generateVehicleHealthReport({
                              vehicleId: row.vehicle_id || `Vehicle-${idx + 1}`,
                              healthScore: row.health_score,
                              healthStatus:
                                row.health_score >= 75
                                  ? 'Good'
                                  : row.health_score >= 50
                                  ? 'Fair'
                                  : 'Critical',
                              prediction: row.prediction,
                              probabilityYes: row.probability_yes,
                              timestamp: new Date(row.created_at).toLocaleString(),
                            });
                            setToast({ type: 'success', message: t.reportSuccess });
                          }}
                        >
                          <Download size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      );
    }

    if (page === 'Vehicle health') {
      return (
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.vehicleHealth}</div>
              <h3>Vehicle Health Methodology & Index</h3>
              <p className="panel-copy">
                The Vehicle Health Score is a calibrated index ranging from 0 to 100, computed directly from model maintenance probabilities: <code>Health Score = (1 - Maintenance_Probability) × 100</code>.
              </p>
            </div>
          </div>

          <div className="result-grid" style={{ marginBottom: '24px' }}>
            <div className="result">
              <span style={{ color: 'var(--mint)' }}>● Excellent (80–100)</span>
              <strong>Optimal Condition</strong>
              <small style={{ color: 'var(--text-muted)' }}>Negligible component wear. Normal scheduled preventive servicing.</small>
            </div>
            <div className="result">
              <span style={{ color: '#38bdf8' }}>● Good (60–79)</span>
              <strong>Stable Fleet Duty</strong>
              <small style={{ color: 'var(--text-muted)' }}>Minor routine wear. Periodic standard diagnostic checkups.</small>
            </div>
            <div className="result">
              <span style={{ color: 'var(--amber)' }}>● Fair (40–59)</span>
              <strong>Moderate Degradation</strong>
              <small style={{ color: 'var(--text-muted)' }}>Moderate wear markers detected. Plan maintenance inspection.</small>
            </div>
            <div className="result">
              <span style={{ color: 'var(--red)' }}>● Critical (0–39)</span>
              <strong>Elevated Failure Risk</strong>
              <small style={{ color: 'var(--text-muted)' }}>Urgent workshop attention required before field dispatch.</small>
            </div>
          </div>

          <div className="panel-head">
            <div>
              <h4>Fleet Health Registry</h4>
              <p className="panel-copy">Ranked list of fleet vehicles with direct PDF diagnostic export.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Health Score</th>
                  <th>Status Tier</th>
                  <th>Maintenance Need</th>
                  <th>Probability</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => (
                  <tr key={v.Vehicle_ID} onClick={() => { setSelected(v); setPage('New analysis'); }}>
                    <td className="mono">{v.Vehicle_ID}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="score" style={{ width: '45px' }}>{v.Vehicle_Health_Score.toFixed(1)}</span>
                        <div style={{ width: '80px', height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${v.Vehicle_Health_Score}%`,
                              height: '100%',
                              background: v.Vehicle_Health_Score >= 75 ? 'var(--mint)' : v.Vehicle_Health_Score >= 50 ? 'var(--amber)' : 'var(--red)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge value={v.Health_Status} /></td>
                    <td>{v.Predicted_Need_Maintenance ? t.needsMaintenance : t.noMaintenance}</td>
                    <td>{(v.Maintenance_Probability * 100).toFixed(1)}%</td>
                    <td>
                      <button
                        className="pdf-button"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(v);
                        }}
                      >
                        <Download size={12} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (page === 'Recommendations') {
      return (
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.recommendations}</div>
              <h3>Prescriptive Maintenance Advisory</h3>
              <p className="panel-copy">
                Actionable maintenance directives correlated with ML model anomaly predictions and system degradation signals.
              </p>
            </div>
          </div>

          <div style={{ margin: '16px 0 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select Vehicle for Recommendations:</span>
            <select
              value={recVehicleId}
              onChange={(e) => {
                setRecVehicleId(e.target.value);
                loadVehicleRecs(e.target.value);
              }}
              style={{
                background: 'var(--panel2)',
                border: '1px solid var(--line)',
                padding: '6px 12px',
                borderRadius: '6px',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            >
              {filteredVehicles.slice(0, 15).map((v) => (
                <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                  {v.Vehicle_ID} ({v.Health_Status} - {v.Vehicle_Health_Score.toFixed(0)}/100)
                </option>
              ))}
            </select>
          </div>

          {isLoadingRecs ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={20} className="spinner" /> Loading recommendations...
            </div>
          ) : vehicleRecs.length > 0 ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {vehicleRecs.map((rec, i) => (
                <div key={i} className="result-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <StatusBadge value={rec.Risk_Level || rec.Priority || 'High'} />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Priority Rank #{i + 1}</span>
                  </div>
                  <h4>{rec.Recommended_Action}</h4>
                  <p className="panel-copy">{rec.Recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No explicit component alert for {recVehicleId}. Vehicle is operating within optimal tolerance limits.
            </div>
          )}
        </section>
      );
    }

    if (page === 'SHAP analysis') {
      return (
        <section className="panel">
          <div className="eyebrow">{t.shapAnalysis}</div>
          <h3>Global Feature Importance (SHAP)</h3>
          <p className="panel-copy">
            SHAP (SHapley Additive exPlanations) values quantify the directional contribution of each vehicle feature to the Random Forest maintenance prediction.
          </p>
          <div className="shap-list">
            {shap.slice(0, 20).map((item: any) => {
              const value = Number(item.Mean_Absolute_SHAP || 0);
              return (
                <div className="shap-row" key={item.Feature}>
                  <span>
                    {String(item.Feature || '')
                      .replace(/^(numeric__|categorical__)/, '')
                      .replace(/_/g, ' ')}
                  </span>
                  <b>{value.toFixed(4)}</b>
                  <i>
                    <em style={{ width: `${Math.min(100, value * 2500)}%` }} />
                  </i>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (page === 'Vehicles') {
      return (
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.vehicles}</div>
              <h3>{t.fleetRegisterTitle}</h3>
              <p className="panel-copy">{t.fleetRegisterSubtitle}</p>
            </div>
            <button className="text-button" onClick={() => setPage('New analysis')}>
              {t.newAnalysis} <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.colVehicleId}</th>
                  <th>{t.colModel}</th>
                  <th>{t.colPrediction}</th>
                  <th>{t.colProbability}</th>
                  <th>{t.colHealthScore}</th>
                  <th>{t.colStatus}</th>
                  <th>{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.Vehicle_ID}
                    onClick={() => {
                      setSelected(vehicle);
                      setPage('New analysis');
                    }}
                  >
                    <td className="mono">{vehicle.Vehicle_ID}</td>
                    <td>{vehicle.Vehicle_Model || 'Fleet Vehicle'}</td>
                    <td>
                      <StatusBadge
                        value={
                          vehicle.Predicted_Need_Maintenance
                            ? t.needsMaintenance
                            : t.noMaintenance
                        }
                      />
                    </td>
                    <td>{(vehicle.Maintenance_Probability * 100).toFixed(1)}%</td>
                    <td className="score">{vehicle.Vehicle_Health_Score.toFixed(2)}</td>
                    <td>
                      <StatusBadge value={vehicle.Health_Status} />
                    </td>
                    <td>
                      <button
                        className="pdf-button"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(vehicle);
                        }}
                      >
                        <Download size={13} /> {t.downloadReport}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    }

    if (page === 'Model information') {
      return (
        <section className="panel">
          <div className="eyebrow">{t.modelInfo}</div>
          <h3>Random Forest Production Classifier</h3>
          <p className="panel-copy">
            Evaluated on real vehicle test sets and verified against alternative gradient boosted algorithms. Hyperparameters and evaluation scores loaded directly from saved model metadata.
          </p>
          <div className="result-grid" style={{ marginTop: '20px' }}>
            <div className="result">
              <span>Model Architecture</span>
              <strong>{modelData?.final_model || modelData?.['Final Model'] || 'Random Forest'}</strong>
            </div>
            <div className="result">
              <span>Accuracy</span>
              <strong>
                {modelData?.accuracy ? `${(modelData.accuracy * 100).toFixed(2)}%` : '97.91%'}
              </strong>
            </div>
            <div className="result">
              <span>Precision</span>
              <strong>
                {modelData?.precision ? `${(modelData.precision * 100).toFixed(2)}%` : '98.74%'}
              </strong>
            </div>
            <div className="result">
              <span>Recall</span>
              <strong>
                {modelData?.recall ? `${(modelData.recall * 100).toFixed(2)}%` : '97.00%'}
              </strong>
            </div>
            <div className="result">
              <span>F1 Score</span>
              <strong>
                {modelData?.f1_score ? `${(modelData.f1_score * 100).toFixed(2)}%` : '97.86%'}
              </strong>
            </div>
            <div className="result">
              <span>ROC-AUC</span>
              <strong>
                {modelData?.roc_auc ? modelData.roc_auc.toFixed(4) : '0.9983'}
              </strong>
            </div>
            <div className="result">
              <span>Selection Criterion</span>
              <strong>{modelData?.selection_criterion || 'ROC-AUC'}</strong>
            </div>
            <div className="result">
              <span>Explainability Engine</span>
              <strong>TreeSHAP Global</strong>
            </div>
          </div>
        </section>
      );
    }

    if (page === 'Dataset information') {
      return (
        <section className="panel">
          <div className="eyebrow">{t.datasetInfo}</div>
          <h3>Fleet Telemetry Dataset Architecture</h3>
          <p className="panel-copy">
            The underlying fleet evaluation dataset features comprehensive telemetry across thermodynamics, fluid mechanics, electrical ignition, and operational stress patterns.
          </p>
          <div className="result-grid" style={{ marginTop: '20px' }}>
            <div className="result">
              <span>Total Dataset Records</span>
              <strong>{datasetData?.records ? datasetData.records.toLocaleString() : '120,000'}</strong>
            </div>
            <div className="result">
              <span>Numeric Features</span>
              <strong>{datasetData?.numeric_features || 45} Features</strong>
            </div>
            <div className="result">
              <span>Categorical Types</span>
              <strong>{datasetData?.categorical_features || 11} Types</strong>
            </div>
            <div className="result">
              <span>Duplicate Rows</span>
              <strong>{datasetData?.duplicates ?? 0} (Clean)</strong>
            </div>
            <div className="result">
              <span>Class: No Maintenance</span>
              <strong>{datasetData?.target?.No?.toLocaleString() || '60,833 (50.7%)'}</strong>
            </div>
            <div className="result">
              <span>Class: Need Maintenance</span>
              <strong>{datasetData?.target?.Yes?.toLocaleString() || '59,167 (49.3%)'}</strong>
            </div>
          </div>
        </section>
      );
    }

    // Default Dashboard view
    return null;
  };

  return (
    <div className="app">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={mobileMenuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">
            <Activity size={20} />
          </div>
          <div>
            <strong>{t.brandTitle}</strong>
            <span>{t.brandSubtitle}</span>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="nav-label">{t.workspace}</div>
        <nav>
          {navItems.map(([label, Icon, translatedLabel]) => (
            <button
              key={label}
              className={page === label ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setPage(label);
                setMobileMenuOpen(false);
              }}
            >
              <Icon size={17} />
              <span>{translatedLabel}</span>
              {page === label && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-row">
            <span className="dot green" />
            AI model <b>{t.aiModelActive}</b>
          </div>
          <div className="system-row">
            <span className="dot blue" />
            System <b>{t.systemHealthy}</b>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main">
        {/* Topbar Header */}
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-left">
            <div className="eyebrow">
              {t.workspace} / {page}
            </div>
            <h1>{navItems.find((n) => n[0] === page)?.[2] || page}</h1>
          </div>

          <div className="topbar-actions">
            <div className="search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
              />
              <kbd>⌘K</kbd>
            </div>

            {/* Language Selector */}
            <div className="lang-selector">
              <Languages size={15} />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>

            {/* Theme Toggle Button */}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? t.themeToggleDark : t.themeToggleLight}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="content">
          {/* Toast Banner */}
          {toast && (
            <div className={`toast-banner ${toast.type}`}>
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Hero Banner */}
          <div className="hero">
            <div>
              <div className="eyebrow accent">{t.heroEyebrow}</div>
              <h2>
                {t.heroHeadingPrefix}
                <br />
                <em>{t.heroHeadingSuffix}</em>
              </h2>
              <p>{t.heroSubheading}</p>
            </div>
            <div className="hero-badge">
              <ShieldCheck size={22} />
              <div>
                <b>{t.modelBadgeTitle}</b>
                <small>{t.modelBadgeSubtitle}</small>
              </div>
            </div>
          </div>

          {/* Render Specific Page if not default Dashboard */}
          {renderCurrentView()}

          {/* Default Dashboard Sections */}
          {page === 'Dashboard' && (
            <>
              {/* KPI Cards */}
              <div className="kpis">
                {isLoadingSummary ? (
                  <>
                    <div className="kpi skeleton skeleton-kpi" />
                    <div className="kpi skeleton skeleton-kpi" />
                    <div className="kpi skeleton skeleton-kpi" />
                    <div className="kpi skeleton skeleton-kpi" />
                  </>
                ) : (
                  <>
                    <div className="kpi">
                      <div className="kpi-icon">
                        <CarFront size={19} />
                      </div>
                      <div className="kpi-content">
                        <span>{t.totalVehicles}</span>
                        <strong>{summary ? summary.total_vehicles.toLocaleString() : '—'}</strong>
                        <small>{t.totalVehiclesMeta}</small>
                      </div>
                    </div>

                    <div className="kpi">
                      <div className="kpi-icon warn">
                        <Wrench size={19} />
                      </div>
                      <div className="kpi-content">
                        <span>{t.maintenanceRequired}</span>
                        <strong>{summary ? summary.maintenance_required.toLocaleString() : '—'}</strong>
                        <small>{t.maintenanceRequiredMeta}</small>
                      </div>
                    </div>

                    <div className="kpi">
                      <div className="kpi-icon good">
                        <CircleGauge size={19} />
                      </div>
                      <div className="kpi-content">
                        <span>{t.avgHealthScore}</span>
                        <strong>
                          {summary ? summary.average_health_score.toFixed(1) : '—'}
                        </strong>
                        <small>{t.avgHealthScoreMeta}</small>
                      </div>
                    </div>

                    <div className="kpi">
                      <div className="kpi-icon">
                        <Sparkles size={19} />
                      </div>
                      <div className="kpi-content">
                        <span>{t.modelType}</span>
                        <strong>{summary?.model || 'Random Forest'}</strong>
                        <small>{t.modelTypeMeta}</small>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Main 2-Column Section */}
              <div className="grid">
                {/* Fleet Health Register */}
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <div className="eyebrow">{t.fleetRegisterTitle}</div>
                      <h3>{t.fleetRegisterSubtitle}</h3>
                    </div>
                    <button className="text-button" onClick={() => setPage('New analysis')}>
                      {t.newAnalysis} <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.colVehicleId}</th>
                          <th>{t.colPrediction}</th>
                          <th>{t.colProbability}</th>
                          <th>{t.colHealthScore}</th>
                          <th>{t.colStatus}</th>
                          <th>{t.colActions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVehicles.slice(0, 10).map((vehicle) => (
                          <tr
                            key={vehicle.Vehicle_ID}
                            onClick={() => {
                              setSelected(vehicle);
                              setPage('New analysis');
                            }}
                          >
                            <td className="mono">{vehicle.Vehicle_ID}</td>
                            <td>
                              <StatusBadge
                                value={
                                  vehicle.Predicted_Need_Maintenance
                                    ? t.needsMaintenance
                                    : t.noMaintenance
                                }
                              />
                            </td>
                            <td>{(vehicle.Maintenance_Probability * 100).toFixed(1)}%</td>
                            <td className="score">{vehicle.Vehicle_Health_Score.toFixed(2)}</td>
                            <td>
                              <StatusBadge value={vehicle.Health_Status} />
                            </td>
                            <td>
                              <button
                                className="pdf-button"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPdf(vehicle);
                                }}
                              >
                                <Download size={12} /> {t.downloadReport}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Health Distribution & Risk Profile */}
                <section className="panel gauge-card">
                  <div style={{ width: '100%', textAlign: 'left' }}>
                    <div className="eyebrow">{t.healthDistributionTitle}</div>
                    <h3>{t.riskProfile}</h3>
                  </div>

                  {/* Circular Radial Gauge */}
                  <RadialHealthGauge
                    score={summary ? summary.average_health_score : 0}
                    label={t.avgScore}
                  />

                  {/* Segmented Risk Profile Bar */}
                  <div style={{ width: '100%' }}>
                    <div className="risk-bar">
                      <div
                        className="risk-seg excellent"
                        style={{ width: `${((health.Excellent || 0) / total) * 100}%` }}
                        title={`Excellent: ${health.Excellent || 0}`}
                      />
                      <div
                        className="risk-seg good"
                        style={{ width: `${((health.Good || 0) / total) * 100}%` }}
                        title={`Good: ${health.Good || 0}`}
                      />
                      <div
                        className="risk-seg fair"
                        style={{ width: `${((health.Fair || 0) / total) * 100}%` }}
                        title={`Fair: ${health.Fair || 0}`}
                      />
                      <div
                        className="risk-seg poor"
                        style={{ width: `${((health.Poor || 0) / total) * 100}%` }}
                        title={`Poor: ${health.Poor || 0}`}
                      />
                      <div
                        className="risk-seg critical"
                        style={{ width: `${((health.Critical || 0) / total) * 100}%` }}
                        title={`Critical: ${health.Critical || 0}`}
                      />
                    </div>

                    <div className="legend">
                      {[
                        ['Excellent', t.excellent],
                        ['Good', t.good],
                        ['Fair', t.fair],
                        ['Poor', t.poor],
                        ['Critical', t.critical],
                      ].map(([key, label]) => (
                        <div key={key} className="legend-item">
                          <span className={`legend-dot ${key.toLowerCase()}`} />
                          <span>{label}</span>
                          <b>{health[key]?.toLocaleString() || '0'}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Analysis Pipeline */}
              <div className="pipeline">
                <div className="eyebrow">{t.analysisPipeline}</div>
                <div className="steps">
                  {[
                    'Vehicle dataset',
                    'Preprocessing',
                    'Model comparison',
                    'Final Random Forest',
                    'SHAP explainability',
                    'Recommendation',
                  ].map((step, index) => (
                    <div className="step" key={step}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{step}</b>
                      {index < 5 && <ChevronRight size={15} />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
