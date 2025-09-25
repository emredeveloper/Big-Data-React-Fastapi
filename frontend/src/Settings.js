import { useState, useEffect } from 'react';
import { API_URL } from './config';
import { useToast } from './Toast';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    weather_lat: 41.015,
    weather_lon: 28.979,
    weather_cache_ttl: 60,
    ml_training_samples: 0,
    ml_is_trained: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Settings loading error:', error);
    }
  };

  const updateSettings = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const result = await response.json();
      if (result.success) {
        showSuccess('Settings updated successfully!');
      } else {
        showError('Settings update error: ' + result.message);
      }
    } catch (error) {
      showError('Settings update error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/ml/train`, {
        method: 'POST',
      });
      
      const result = await response.json();
      if (result.success) {
        showSuccess(`Model trained successfully! ${result.samples_used} data samples used.`);
        fetchSettings(); // Ayarları yenile
      } else {
        if (result.message) {
          showWarning(result.message);
        } else {
          showError('Model training error: ' + result.error);
        }
      }
    } catch (error) {
      showError('Model training error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="settings-container">
      <h2 className="settings-title">⚙️ System Settings</h2>
      
      {message && (
        <div className={`message ${message.includes('error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="settings-section">
        <h3>🌍 Weather Settings</h3>
        <div className="form-group">
          <label>Latitude:</label>
          <input
            type="number"
            step="0.001"
            value={settings.weather_lat}
            onChange={(e) => handleInputChange('weather_lat', parseFloat(e.target.value))}
            placeholder="41.015"
          />
        </div>
        
        <div className="form-group">
          <label>Longitude:</label>
          <input
            type="number"
            step="0.001"
            value={settings.weather_lon}
            onChange={(e) => handleInputChange('weather_lon', parseFloat(e.target.value))}
            placeholder="28.979"
          />
        </div>
        
        <div className="form-group">
          <label>Cache Duration (seconds):</label>
          <input
            type="number"
            min="10"
            max="3600"
            value={settings.weather_cache_ttl}
            onChange={(e) => handleInputChange('weather_cache_ttl', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="settings-section">
        <h3>🤖 Machine Learning</h3>
        <div className="ml-status">
          <div className="status-item">
            <span className="label">Training Data:</span>
            <span className="value">{settings.ml_training_samples} samples</span>
          </div>
          <div className="status-item">
            <span className="label">Model Status:</span>
            <span className={`value ${settings.ml_is_trained ? 'trained' : 'not-trained'}`}>
              {settings.ml_is_trained ? '✅ Trained' : '❌ Not Trained'}
            </span>
          </div>
        </div>
        
        <button 
          className="train-button"
          onClick={trainModel}
          disabled={loading || settings.ml_training_samples < 100}
        >
          {loading ? 'Training...' : 'Train Model'}
        </button>
        
        {settings.ml_training_samples < 100 && (
          <div className="data-requirement-warning">
            <h4>⚠️ Data Requirement</h4>
            <p><strong>Required:</strong> 100 data points</p>
            <p><strong>Available:</strong> {settings.ml_training_samples} data points</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${Math.min(100, (settings.ml_training_samples / 100) * 100)}%`}}
              ></div>
            </div>
            <p className="help-text">
              Wait on the dashboard to collect more data. 
              Training with insufficient data will result in very low model performance.
            </p>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button 
          className="save-button"
          onClick={updateSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
        
        <button 
          className="refresh-button"
          onClick={fetchSettings}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default Settings;
