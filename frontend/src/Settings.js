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
      console.error('Ayar yükleme hatası:', error);
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
        showSuccess('Ayarlar başarıyla güncellendi!');
      } else {
        showError('Ayar güncelleme hatası: ' + result.message);
      }
    } catch (error) {
      showError('Ayar güncelleme hatası: ' + error.message);
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
        showSuccess(`Model başarıyla eğitildi! ${result.samples_used} veri kullanıldı.`);
        fetchSettings(); // Ayarları yenile
      } else {
        if (result.message) {
          showWarning(result.message);
        } else {
          showError('Model eğitimi hatası: ' + result.error);
        }
      }
    } catch (error) {
      showError('Model eğitimi hatası: ' + error.message);
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
      <h2 className="settings-title">⚙️ Sistem Ayarları</h2>
      
      {message && (
        <div className={`message ${message.includes('hatası') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="settings-section">
        <h3>🌍 Hava Durumu Ayarları</h3>
        <div className="form-group">
          <label>Enlem (Latitude):</label>
          <input
            type="number"
            step="0.001"
            value={settings.weather_lat}
            onChange={(e) => handleInputChange('weather_lat', parseFloat(e.target.value))}
            placeholder="41.015"
          />
        </div>
        
        <div className="form-group">
          <label>Boylam (Longitude):</label>
          <input
            type="number"
            step="0.001"
            value={settings.weather_lon}
            onChange={(e) => handleInputChange('weather_lon', parseFloat(e.target.value))}
            placeholder="28.979"
          />
        </div>
        
        <div className="form-group">
          <label>Cache Süresi (saniye):</label>
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
        <h3>🤖 Makine Öğrenmesi</h3>
        <div className="ml-status">
          <div className="status-item">
            <span className="label">Eğitim Verisi:</span>
            <span className="value">{settings.ml_training_samples} örnek</span>
          </div>
          <div className="status-item">
            <span className="label">Model Durumu:</span>
            <span className={`value ${settings.ml_is_trained ? 'trained' : 'not-trained'}`}>
              {settings.ml_is_trained ? '✅ Eğitilmiş' : '❌ Eğitilmemiş'}
            </span>
          </div>
        </div>
        
        <button 
          className="train-button"
          onClick={trainModel}
          disabled={loading || settings.ml_training_samples < 100}
        >
          {loading ? 'Eğitiliyor...' : 'Modeli Eğit'}
        </button>
        
        {settings.ml_training_samples < 100 && (
          <div className="data-requirement-warning">
            <h4>⚠️ Veri Gereksinimi</h4>
            <p><strong>Gerekli:</strong> 100 veri noktası</p>
            <p><strong>Mevcut:</strong> {settings.ml_training_samples} veri noktası</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${Math.min(100, (settings.ml_training_samples / 100) * 100)}%`}}
              ></div>
            </div>
            <p className="help-text">
              Daha fazla veri toplamak için dashboard'da bekleyin. 
              Az veri ile eğitim yapılırsa model performansı çok düşük olur.
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
          {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
        
        <button 
          className="refresh-button"
          onClick={fetchSettings}
          disabled={loading}
        >
          Yenile
        </button>
      </div>
    </div>
  );
}

export default Settings;
