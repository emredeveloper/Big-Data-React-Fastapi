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
      setError('Failed to load performance data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ml-dashboard-container">
        <div className="loading">Loading ML performance data...</div>
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
        <div className="no-data">No performance data found</div>
      </div>
    );
  }

  // Chart data for performance metrics
  const performanceData = [
    {
      name: 'Anomaly Detection',
      accuracy: Math.round(performance.anomaly_detection_accuracy * 100),
      color: '#ff6b6b'
    },
    {
      name: 'Temperature Prediction',
      accuracy: Math.round(performance.temperature_prediction_r2 * 100),
      color: '#4ecdc4'
    },
    {
      name: 'Humidity Prediction',
      accuracy: Math.round(performance.humidity_prediction_r2 * 100),
      color: '#45b7d1'
    }
  ];

  const predictionData = [
    { name: 'Total Predictions', value: performance.total_predictions, color: '#8884d8' },
    { name: 'Detected Anomalies', value: performance.total_anomalies_detected, color: '#ff9999' }
  ];

  return (
    <div className="ml-dashboard-container">
      <h2 className="ml-dashboard-title">🤖 Machine Learning Dashboard</h2>
      
      {/* Performance Cards */}
      <div className="performance-cards">
        <div className="perf-card">
          <h3>📊 Anomaly Detection</h3>
          <div className="perf-value">
            {Math.round(performance.anomaly_detection_accuracy * 100)}%
          </div>
          <div className="perf-label">Accuracy</div>
        </div>
        
        <div className="perf-card">
          <h3>🌡️ Temperature Prediction</h3>
          <div className="perf-value">
            {Math.round(performance.temperature_prediction_r2 * 100)}%
          </div>
          <div className="perf-label">R² Skoru</div>
        </div>
        
        <div className="perf-card">
          <h3>💧 Humidity Prediction</h3>
          <div className="perf-value">
            {Math.round(performance.humidity_prediction_r2 * 100)}%
          </div>
          <div className="perf-label">R² Skoru</div>
        </div>
        
        <div className="perf-card">
          <h3>📈 Total Predictions</h3>
          <div className="perf-value">
            {performance.total_predictions}
          </div>
          <div className="perf-label">Count</div>
        </div>
        
        <div className="perf-card">
          <h3>⚠️ Anomaly</h3>
          <div className="perf-value">
            {performance.total_anomalies_detected}
          </div>
          <div className="perf-label">Detected</div>
        </div>
        
        <div className="perf-card">
          <h3>🕒 Last Training</h3>
          <div className="perf-value">
            {performance.last_training_time ? 
              new Date(performance.last_training_time * 1000).toLocaleTimeString() : 
              'Not yet'
            }
          </div>
          <div className="perf-label">Time</div>
        </div>
      </div>

      {/* Charts */}
      <div className="ml-charts-grid">
        {/* Model Performansı Bar Chart */}
        <div className="chart-container">
          <h3 className="chart-title">📊 Model Performance</h3>
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
          <h3 className="chart-title">📈 Prediction Distribution</h3>
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

      {/* Model Status */}
      <div className="model-status">
        <h3>🔧 Model Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Training Status:</span>
            <span className={`status-value ${performance.last_training_time ? 'active' : 'inactive'}`}>
              {performance.last_training_time ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Update:</span>
            <span className="status-value">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="refresh-section">
        <button 
          className="refresh-button"
          onClick={fetchPerformance}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}

export default MLDashboard;
