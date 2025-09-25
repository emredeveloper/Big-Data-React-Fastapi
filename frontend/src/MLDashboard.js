import { useState, useEffect } from 'react';
import { API_URL } from './config';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './MLDashboard.css';

function MLDashboard() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformance();
    const interval = setInterval(fetchPerformance, 5000); // Her 5 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await fetch(`${API_URL}/ml/performance`);
      const data = await response.json();
      setPerformance(data);
      setError('');
    } catch (err) {
      setError('Performans verisi yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-dashboard-container">
        <div className="loading">ML performans verileri yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="ml-dashboard-container">
        <div className="no-data">Performans verisi bulunamadı</div>
      </div>
    );
  }

  // Performans metrikleri için grafik verisi
  const performanceData = [
    {
      name: 'Anomali Tespiti',
      accuracy: Math.round(performance.anomaly_detection_accuracy * 100),
      color: '#ff6b6b'
    },
    {
      name: 'Sıcaklık Tahmini',
      accuracy: Math.round(performance.temperature_prediction_r2 * 100),
      color: '#4ecdc4'
    },
    {
      name: 'Nem Tahmini',
      accuracy: Math.round(performance.humidity_prediction_r2 * 100),
      color: '#45b7d1'
    }
  ];

  const predictionData = [
    { name: 'Toplam Tahmin', value: performance.total_predictions, color: '#8884d8' },
    { name: 'Tespit Edilen Anomali', value: performance.total_anomalies_detected, color: '#ff9999' }
  ];

  return (
    <div className="ml-dashboard-container">
      <h2 className="ml-dashboard-title">🤖 Makine Öğrenmesi Dashboard</h2>
      
      {/* Performans Kartları */}
      <div className="performance-cards">
        <div className="perf-card">
          <h3>📊 Anomali Tespiti</h3>
          <div className="perf-value">
            {Math.round(performance.anomaly_detection_accuracy * 100)}%
          </div>
          <div className="perf-label">Doğruluk</div>
        </div>
        
        <div className="perf-card">
          <h3>🌡️ Sıcaklık Tahmini</h3>
          <div className="perf-value">
            {Math.round(performance.temperature_prediction_r2 * 100)}%
          </div>
          <div className="perf-label">R² Skoru</div>
        </div>
        
        <div className="perf-card">
          <h3>💧 Nem Tahmini</h3>
          <div className="perf-value">
            {Math.round(performance.humidity_prediction_r2 * 100)}%
          </div>
          <div className="perf-label">R² Skoru</div>
        </div>
        
        <div className="perf-card">
          <h3>📈 Toplam Tahmin</h3>
          <div className="perf-value">
            {performance.total_predictions}
          </div>
          <div className="perf-label">Adet</div>
        </div>
        
        <div className="perf-card">
          <h3>⚠️ Anomali</h3>
          <div className="perf-value">
            {performance.total_anomalies_detected}
          </div>
          <div className="perf-label">Tespit Edilen</div>
        </div>
        
        <div className="perf-card">
          <h3>🕒 Son Eğitim</h3>
          <div className="perf-value">
            {performance.last_training_time ? 
              new Date(performance.last_training_time * 1000).toLocaleTimeString() : 
              'Henüz yok'
            }
          </div>
          <div className="perf-label">Zaman</div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="ml-charts-grid">
        {/* Model Performansı Bar Chart */}
        <div className="chart-container">
          <h3 className="chart-title">📊 Model Performansı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tahmin Dağılımı Pie Chart */}
        <div className="chart-container">
          <h3 className="chart-title">📈 Tahmin Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={predictionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {predictionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Durumu */}
      <div className="model-status">
        <h3>🔧 Model Durumu</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Eğitim Durumu:</span>
            <span className={`status-value ${performance.last_training_time ? 'active' : 'inactive'}`}>
              {performance.last_training_time ? '✅ Aktif' : '❌ Pasif'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Son Güncelleme:</span>
            <span className="status-value">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Yenile Butonu */}
      <div className="refresh-section">
        <button 
          className="refresh-button"
          onClick={fetchPerformance}
        >
          🔄 Verileri Yenile
        </button>
      </div>
    </div>
  );
}

export default MLDashboard;
