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
        
        # Isolation Forest for anomaly detection
        self.anomaly_detector = IsolationForest(
            contamination=0.1,  # 10% anomaly expected
            random_state=42
        )
        
        # Random Forest for prediction (better performance)
        self.temperature_predictor = RandomForestRegressor(n_estimators=50, random_state=42)
        self.humidity_predictor = RandomForestRegressor(n_estimators=50, random_state=42)
        
        # Data preprocessing
        self.scaler = StandardScaler()
        
        # Model status
        self.is_trained = False
        self.training_data = []
        self.max_training_samples = 1000
        
        # Performance metrics
        self.performance_metrics = {
            "anomaly_detection_accuracy": 0.0,
            "temperature_prediction_r2": 0.0,
            "humidity_prediction_r2": 0.0,
            "last_training_time": None,
            "total_predictions": 0,
            "total_anomalies_detected": 0
        }
    
    def add_data_point(self, data: Dict) -> Dict:
        """Add new data point and perform anomaly check"""
        features = self._extract_features(data)
        
        result = {
            "timestamp": data["timestamp"],
            "is_anomaly": False,
            "anomaly_score": 0.0,
            "temperature_prediction": None,
            "humidity_prediction": None,
            "prediction_confidence": 0.0
        }
        
        # Add data to training set
        self.training_data.append(features)
        if len(self.training_data) > self.max_training_samples:
            self.training_data.pop(0)
        
        # Make predictions if model is trained
        if self.is_trained and len(self.training_data) >= 10:
            # Anomaly detection
            anomaly_score = self.anomaly_detector.decision_function([features])[0]
            is_anomaly = self.anomaly_detector.predict([features])[0] == -1
            
            result.update({
                "is_anomaly": bool(is_anomaly),
                "anomaly_score": float(anomaly_score)
            })
            
            if is_anomaly:
                self.performance_metrics["total_anomalies_detected"] += 1
            
            # Temperature prediction
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
        """Extract feature vector from data point"""
        timestamp = data["timestamp"]
        
        # Time features
        hour = (timestamp % 86400) / 3600  # Hour of day
        day_of_week = (timestamp // 86400) % 7  # Day of week
        
        # More meaningful features
        return [
            data["temperature"],
            data["humidity"],
            data["cpu_usage"],
            data["memory_usage"],
            data["network_speed"],
            hour,
            day_of_week,
            math.sin(hour * 2 * math.pi / 24),  # Hourly cycle
            math.cos(hour * 2 * math.pi / 24),
            math.sin(day_of_week * 2 * math.pi / 7),  # Weekly cycle
            math.cos(day_of_week * 2 * math.pi / 7),
            # Trend features
            data["temperature"] * data["humidity"],  # Interaction
            data["cpu_usage"] * data["memory_usage"],  # System load
        ]
    
    def train_models(self) -> Dict:
        """Train models"""
        if len(self.training_data) < 100:
            return {
                "error": "Insufficient data", 
                "samples": len(self.training_data),
                "required": 100,
                "message": f"At least 100 data points required for model training. Currently {len(self.training_data)} data points available. Wait on the dashboard to collect more data."
            }
        
        try:
            # Prepare data
            X = np.array(self.training_data)
            
            # Anomaly detection training
            self.anomaly_detector.fit(X)
            
            # Sliding window approach for prediction models
            if len(self.training_data) >= 20:  # More data required
                # Sliding window: predict next value from last 5 data points
                window_size = 5
                X_windows = []
                y_temp_windows = []
                y_humidity_windows = []
                
                for i in range(window_size, len(self.training_data)):
                    # Use last 5 data points as features
                    window_features = []
                    for j in range(i - window_size, i):
                        window_features.extend(self.training_data[j])
                    X_windows.append(window_features)
                    y_temp_windows.append(self.training_data[i][0])  # Temperature
                    y_humidity_windows.append(self.training_data[i][1])  # Humidity
                
                if len(X_windows) >= 5:  # At least 5 windows required
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
                    
                    # Train models
                    self.temperature_predictor.fit(X_train, y_temp_train)
                    self.humidity_predictor.fit(X_train, y_humidity_train)
                    
                    # Save test performance
                    self._temp_test_data = (X_test, y_temp_test)
                    self._humidity_test_data = (X_test, y_humidity_test)
            
            # Performance evaluation
            self._evaluate_models()
            
            self.is_trained = True
            self.performance_metrics["last_training_time"] = time.time()
            
            # Save models
            self._save_models()
            
            return {
                "success": True,
                "samples_used": len(self.training_data),
                "performance": self.performance_metrics
            }
            
        except Exception as e:
            return {"error": str(e), "samples": len(self.training_data)}
    
    def _predict_temperature(self, features: List[float]) -> Optional[float]:
        """Make temperature prediction - using sliding window"""
        if not self.is_trained or len(self.training_data) < 5:
            return None
        try:
            # Use last 5 data points
            window_size = 5
            recent_data = self.training_data[-window_size:]
            window_features = []
            for data_point in recent_data:
                window_features.extend(data_point)
            
            return float(self.temperature_predictor.predict([window_features])[0])
        except:
            return None
    
    def _predict_humidity(self, features: List[float]) -> Optional[float]:
        """Make humidity prediction - using sliding window"""
        if not self.is_trained or len(self.training_data) < 5:
            return None
        try:
            # Use last 5 data points
            window_size = 5
            recent_data = self.training_data[-window_size:]
            window_features = []
            for data_point in recent_data:
                window_features.extend(data_point)
            
            return float(self.humidity_predictor.predict([window_features])[0])
        except:
            return None
    
    def _calculate_confidence(self) -> float:
        """Calculate prediction confidence score"""
        if not self.is_trained or len(self.training_data) < 5:
            return 0.0
        
        # Simple confidence score: depends on data amount and model performance
        data_confidence = min(1.0, len(self.training_data) / 100)
        performance_confidence = (self.performance_metrics["temperature_prediction_r2"] + 
                                self.performance_metrics["humidity_prediction_r2"]) / 2
        
        return (data_confidence + performance_confidence) / 2
    
    def _evaluate_models(self):
        """Evaluate model performance"""
        if len(self.training_data) < 10:
            return
        
        X = np.array(self.training_data)
        
        # Anomaly detection performance (simple heuristic)
        anomaly_scores = self.anomaly_detector.decision_function(X)
        anomaly_rate = np.mean(self.anomaly_detector.predict(X) == -1)
        self.performance_metrics["anomaly_detection_accuracy"] = 1.0 - abs(anomaly_rate - 0.1)
        
        # Prediction performance - use test data if available
        if hasattr(self, '_temp_test_data') and hasattr(self, '_humidity_test_data'):
            X_test, y_temp_test = self._temp_test_data
            _, y_humidity_test = self._humidity_test_data
            
            temp_pred = self.temperature_predictor.predict(X_test)
            humidity_pred = self.humidity_predictor.predict(X_test)
            
            self.performance_metrics["temperature_prediction_r2"] = max(0, r2_score(y_temp_test, temp_pred))
            self.performance_metrics["humidity_prediction_r2"] = max(0, r2_score(y_humidity_test, humidity_pred))
        else:
            # Fallback: simple evaluation
            self.performance_metrics["temperature_prediction_r2"] = 0.0
            self.performance_metrics["humidity_prediction_r2"] = 0.0
    
    def _save_models(self):
        """Save models to file"""
        try:
            joblib.dump(self.anomaly_detector, f"{self.model_dir}/anomaly_detector.pkl")
            joblib.dump(self.temperature_predictor, f"{self.model_dir}/temperature_predictor.pkl")
            joblib.dump(self.humidity_predictor, f"{self.model_dir}/humidity_predictor.pkl")
            joblib.dump(self.scaler, f"{self.model_dir}/scaler.pkl")
        except Exception as e:
            print(f"Model saving error: {e}")
    
    def load_models(self):
        """Load models from file"""
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
        """Return performance metrics"""
        return self.performance_metrics.copy()
    
    def get_recent_anomalies(self, limit: int = 10) -> List[Dict]:
        """Return recent anomaly detections"""
        # In this simple implementation, we don't keep historical anomaly records
        # In real application, it would be fetched from database
        return []
