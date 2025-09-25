import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import math
import joblib
import os
from typing import Dict, List, Tuple, Optional
import time

class SensorDataML:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Anomali tespiti için Isolation Forest
        self.anomaly_detector = IsolationForest(
            contamination=0.1,  # %10 anomali bekleniyor
            random_state=42
        )
        
        # Tahmin için Random Forest (daha iyi performans)
        self.temperature_predictor = RandomForestRegressor(n_estimators=50, random_state=42)
        self.humidity_predictor = RandomForestRegressor(n_estimators=50, random_state=42)
        
        # Veri ön işleme
        self.scaler = StandardScaler()
        
        # Model durumu
        self.is_trained = False
        self.training_data = []
        self.max_training_samples = 1000
        
        # Performans metrikleri
        self.performance_metrics = {
            "anomaly_detection_accuracy": 0.0,
            "temperature_prediction_r2": 0.0,
            "humidity_prediction_r2": 0.0,
            "last_training_time": None,
            "total_predictions": 0,
            "total_anomalies_detected": 0
        }
    
    def add_data_point(self, data: Dict) -> Dict:
        """Yeni veri noktası ekle ve anomali kontrolü yap"""
        features = self._extract_features(data)
        
        result = {
            "timestamp": data["timestamp"],
            "is_anomaly": False,
            "anomaly_score": 0.0,
            "temperature_prediction": None,
            "humidity_prediction": None,
            "prediction_confidence": 0.0
        }
        
        # Veriyi eğitim setine ekle
        self.training_data.append(features)
        if len(self.training_data) > self.max_training_samples:
            self.training_data.pop(0)
        
        # Eğer model eğitilmişse tahmin yap
        if self.is_trained and len(self.training_data) >= 10:
            # Anomali tespiti
            anomaly_score = self.anomaly_detector.decision_function([features])[0]
            is_anomaly = self.anomaly_detector.predict([features])[0] == -1
            
            result.update({
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(anomaly_score)
            })
            
            if is_anomaly:
                self.performance_metrics["total_anomalies_detected"] += 1
            
            # Sıcaklık tahmini
            if len(self.training_data) >= 5:
                temp_pred = self._predict_temperature(features)
                humidity_pred = self._predict_humidity(features)
                
                result.update({
                    "temperature_prediction": temp_pred,
                    "humidity_prediction": humidity_pred,
                    "prediction_confidence": self._calculate_confidence()
                })
        
        self.performance_metrics["total_predictions"] += 1
        return result
    
    def _extract_features(self, data: Dict) -> List[float]:
        """Veri noktasından özellik vektörü çıkar"""
        timestamp = data["timestamp"]
        
        # Zaman özellikleri
        hour = (timestamp % 86400) / 3600  # Günün saati
        day_of_week = (timestamp // 86400) % 7  # Haftanın günü
        
        # Daha anlamlı özellikler
        return [
            data["temperature"],
            data["humidity"],
            data["cpu_usage"],
            data["memory_usage"],
            data["network_speed"],
            hour,
            day_of_week,
            math.sin(hour * 2 * math.pi / 24),  # Saatlik döngü
            math.cos(hour * 2 * math.pi / 24),
            math.sin(day_of_week * 2 * math.pi / 7),  # Haftalık döngü
            math.cos(day_of_week * 2 * math.pi / 7),
            # Trend özellikleri
            data["temperature"] * data["humidity"],  # Etkileşim
            data["cpu_usage"] * data["memory_usage"],  # Sistem yükü
        ]
    
    def train_models(self) -> Dict:
        """Modelleri eğit"""
        if len(self.training_data) < 100:
            return {
                "error": "Yeterli veri yok", 
                "samples": len(self.training_data),
                "required": 100,
                "message": f"Model eğitimi için en az 100 veri noktası gerekli. Şu anda {len(self.training_data)} veri var. Daha fazla veri toplamak için dashboard'da bekleyin."
            }
        
        try:
            # Veriyi hazırla
            X = np.array(self.training_data)
            
            # Anomali tespiti eğitimi
            self.anomaly_detector.fit(X)
            
            # Tahmin modelleri için sliding window yaklaşımı
            if len(self.training_data) >= 20:  # Daha fazla veri gerekli
                # Sliding window: son 5 veri noktasından sonraki değeri tahmin et
                window_size = 5
                X_windows = []
                y_temp_windows = []
                y_humidity_windows = []
                
                for i in range(window_size, len(self.training_data)):
                    # Son 5 veri noktasını özellik olarak kullan
                    window_features = []
                    for j in range(i - window_size, i):
                        window_features.extend(self.training_data[j])
                    X_windows.append(window_features)
                    y_temp_windows.append(self.training_data[i][0])  # Sıcaklık
                    y_humidity_windows.append(self.training_data[i][1])  # Nem
                
                if len(X_windows) >= 5:  # En az 5 window gerekli
                    X_windows = np.array(X_windows)
                    y_temp_windows = np.array(y_temp_windows)
                    y_humidity_windows = np.array(y_humidity_windows)
                    
                    # Train/test split
                    X_train, X_test, y_temp_train, y_temp_test = train_test_split(
                        X_windows, y_temp_windows, test_size=0.2, random_state=42
                    )
                    _, _, y_humidity_train, y_humidity_test = train_test_split(
                        X_windows, y_humidity_windows, test_size=0.2, random_state=42
                    )
                    
                    # Modelleri eğit
                    self.temperature_predictor.fit(X_train, y_temp_train)
                    self.humidity_predictor.fit(X_train, y_humidity_train)
                    
                    # Test performansını kaydet
                    self._temp_test_data = (X_test, y_temp_test)
                    self._humidity_test_data = (X_test, y_humidity_test)
            
            # Performans değerlendirmesi
            self._evaluate_models()
            
            self.is_trained = True
            self.performance_metrics["last_training_time"] = time.time()
            
            # Modelleri kaydet
            self._save_models()
            
            return {
                "success": True,
                "samples_used": len(self.training_data),
                "performance": self.performance_metrics
            }
            
        except Exception as e:
            return {"error": str(e), "samples": len(self.training_data)}
    
    def _predict_temperature(self, features: List[float]) -> Optional[float]:
        """Sıcaklık tahmini yap - sliding window kullan"""
        if not self.is_trained or len(self.training_data) < 5:
            return None
        try:
            # Son 5 veri noktasını kullan
            window_size = 5
            recent_data = self.training_data[-window_size:]
            window_features = []
            for data_point in recent_data:
                window_features.extend(data_point)
            
            return float(self.temperature_predictor.predict([window_features])[0])
        except:
            return None
    
    def _predict_humidity(self, features: List[float]) -> Optional[float]:
        """Nem tahmini yap - sliding window kullan"""
        if not self.is_trained or len(self.training_data) < 5:
            return None
        try:
            # Son 5 veri noktasını kullan
            window_size = 5
            recent_data = self.training_data[-window_size:]
            window_features = []
            for data_point in recent_data:
                window_features.extend(data_point)
            
            return float(self.humidity_predictor.predict([window_features])[0])
        except:
            return None
    
    def _calculate_confidence(self) -> float:
        """Tahmin güven skoru hesapla"""
        if not self.is_trained or len(self.training_data) < 5:
            return 0.0
        
        # Basit güven skoru: veri miktarına ve model performansına bağlı
        data_confidence = min(1.0, len(self.training_data) / 100)
        performance_confidence = (self.performance_metrics["temperature_prediction_r2"] + 
                                self.performance_metrics["humidity_prediction_r2"]) / 2
        
        return (data_confidence + performance_confidence) / 2
    
    def _evaluate_models(self):
        """Model performansını değerlendir"""
        if len(self.training_data) < 10:
            return
        
        X = np.array(self.training_data)
        
        # Anomali tespiti performansı (basit heuristik)
        anomaly_scores = self.anomaly_detector.decision_function(X)
        anomaly_rate = np.mean(self.anomaly_detector.predict(X) == -1)
        self.performance_metrics["anomaly_detection_accuracy"] = 1.0 - abs(anomaly_rate - 0.1)
        
        # Tahmin performansı - test verisi varsa kullan
        if hasattr(self, '_temp_test_data') and hasattr(self, '_humidity_test_data'):
            X_test, y_temp_test = self._temp_test_data
            _, y_humidity_test = self._humidity_test_data
            
            temp_pred = self.temperature_predictor.predict(X_test)
            humidity_pred = self.humidity_predictor.predict(X_test)
            
            self.performance_metrics["temperature_prediction_r2"] = max(0, r2_score(y_temp_test, temp_pred))
            self.performance_metrics["humidity_prediction_r2"] = max(0, r2_score(y_humidity_test, humidity_pred))
        else:
            # Fallback: basit değerlendirme
            self.performance_metrics["temperature_prediction_r2"] = 0.0
            self.performance_metrics["humidity_prediction_r2"] = 0.0
    
    def _save_models(self):
        """Modelleri dosyaya kaydet"""
        try:
            joblib.dump(self.anomaly_detector, f"{self.model_dir}/anomaly_detector.pkl")
            joblib.dump(self.temperature_predictor, f"{self.model_dir}/temperature_predictor.pkl")
            joblib.dump(self.humidity_predictor, f"{self.model_dir}/humidity_predictor.pkl")
            joblib.dump(self.scaler, f"{self.model_dir}/scaler.pkl")
        except Exception as e:
            print(f"Model kaydetme hatası: {e}")
    
    def load_models(self):
        """Modelleri dosyadan yükle"""
        try:
            self.anomaly_detector = joblib.load(f"{self.model_dir}/anomaly_detector.pkl")
            self.temperature_predictor = joblib.load(f"{self.model_dir}/temperature_predictor.pkl")
            self.humidity_predictor = joblib.load(f"{self.model_dir}/humidity_predictor.pkl")
            self.scaler = joblib.load(f"{self.model_dir}/scaler.pkl")
            self.is_trained = True
            return True
        except:
            return False
    
    def get_performance_metrics(self) -> Dict:
        """Performans metriklerini döndür"""
        return self.performance_metrics.copy()
    
    def get_recent_anomalies(self, limit: int = 10) -> List[Dict]:
        """Son anomali tespitlerini döndür"""
        # Bu basit implementasyonda geçmiş anomali kayıtları tutmuyoruz
        # Gerçek uygulamada veritabanından çekilir
        return []
