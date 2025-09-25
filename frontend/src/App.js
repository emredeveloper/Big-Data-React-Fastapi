import { useEffect, useState, useRef } from 'react';
import { WS_URL } from './config';
import Settings from './Settings';
import MLDashboard from './MLDashboard';
import { ToastContainer, useToast } from './Toast';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './App.css';

// Cihaz durumu için ikon ve metin döndüren yardımcı fonksiyon
const getDeviceStatusUI = (status) => {
  switch (status) {
    case 'online': return { icon: '✅', text: 'Çevrimiçi' };
    case 'offline': return { icon: '❌', text: 'Çevrimdışı' };
    case 'error': return { icon: '⚠️', text: 'Hata' };
    default: return { icon: '❔', text: 'Bilinmiyor' };
  }
};

function App() {
  const [streamData, setStreamData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
<<<<<<< HEAD
  const [connState, setConnState] = useState('connecting'); // connecting | open | closed
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard | settings | ml
=======
  const [timeRange, setTimeRange] = useState(60); // Saniye cinsinden
>>>>>>> 6e124e0b84a829f19afc3c23f92755513a9c263e
  const wsRef = useRef();
  const { toasts, addToast, removeToast, showInfo, showWarning } = useToast();

  useEffect(() => {
<<<<<<< HEAD
    // Open WebSocket for real-time stream with auto-reconnect
    let retry = 0;

    const connect = () => {
      setConnState('connecting');
      wsRef.current = new WebSocket(WS_URL);
      wsRef.current.onopen = () => {
        retry = 0;
        setConnState('open');
        showInfo('WebSocket bağlantısı kuruldu');
      };
      wsRef.current.onmessage = e => {
=======
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    wsRef.current.onmessage = e => {
>>>>>>> 6e124e0b84a829f19afc3c23f92755513a9c263e
      const data = JSON.parse(e.data);
      const formattedData = {
        ...data,
        time: new Date(data.timestamp * 1000).toLocaleTimeString(),
        timeShort: new Date(data.timestamp * 1000).toLocaleTimeString().slice(0, 5)
      };
      
      setCurrentData(formattedData);
<<<<<<< HEAD
      setStreamData(prev => [formattedData, ...prev].slice(0, 50));
      
      // Anomali tespit edildiğinde uyarı göster
      if (formattedData.is_anomaly) {
        showWarning(`Anomali tespit edildi! Skor: ${formattedData.anomaly_score?.toFixed(3)}`);
      }
      };
      wsRef.current.onerror = console.error;
      wsRef.current.onclose = () => {
        setConnState('closed');
        showWarning('WebSocket bağlantısı kesildi, yeniden bağlanıyor...');
        const timeout = Math.min(30000, 1000 * Math.pow(2, retry));
        retry += 1;
        setTimeout(() => connect(), timeout);
      };
=======
      // Gelen veriyi zaman damgasıyla birlikte sakla
      setStreamData(prev => [{...formattedData, timestamp: data.timestamp}, ...prev]);
>>>>>>> 6e124e0b84a829f19afc3c23f92755513a9c263e
    };
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  // Zaman filtresine göre veriyi hazırla
  const filteredData = streamData
    .filter(d => (Date.now() / 1000) - d.timestamp < timeRange)
    .slice(0, 100) // Maksimum 100 veri noktası göster
    .reverse();

  // Pie chart için CPU ve Memory verileri
  const systemUsageData = currentData ? [
    { name: 'CPU', value: currentData.cpu_usage },
    { name: 'Bellek', value: currentData.memory_usage },
  ] : [];
  const COLORS = ['#8884d8', '#82ca9d'];

<<<<<<< HEAD
  const renderPage = () => {
    switch (currentPage) {
      case 'settings':
        return <Settings />;
      case 'ml':
        return <MLDashboard />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      <h1 className="dashboard-title">🔥 Canlı Veri Dashboard
        <span className={`connection-badge ${
          connState === 'open' ? 'conn-open' : connState === 'connecting' ? 'conn-connecting' : 'conn-closed'
        }`}>
          {connState === 'open' ? 'Bağlı' : connState === 'connecting' ? 'Bağlanıyor' : 'Kopuk'}
        </span>
      </h1>
=======
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🔥 Canlı Veri Dashboard</h1>
        <div className="time-filter-buttons">
          <span>Zaman Aralığı: </span>
          <button onClick={() => setTimeRange(60)} className={timeRange === 60 ? 'active' : ''}>1dk</button>
          <button onClick={() => setTimeRange(300)} className={timeRange === 300 ? 'active' : ''}>5dk</button>
          <button onClick={() => setTimeRange(900)} className={timeRange === 900 ? 'active' : ''}>15dk</button>
        </div>
      </header>
>>>>>>> 6e124e0b84a829f19afc3c23f92755513a9c263e
      
      {currentData && (
        <div className="value-cards-grid">
          <div className="value-card temperature-card">
            <h3>🌡️ Sıcaklık</h3>
            <p>{currentData.temperature}°C</p>
          </div>
          <div className="value-card humidity-card">
            <h3>💧 Nem</h3>
            <p>{currentData.humidity}%</p>
          </div>
          <div className="value-card network-card">
            <h3>🚀 Ağ Hızı</h3>
            <p>{currentData.network_speed} Mbps</p>
          </div>
          <div className="value-card signal-card">
            <h3>📶 Sinyal Gücü</h3>
            <p>{currentData.signal_strength}%</p>
          </div>
          <div className={`value-card status-card-${currentData.device_status}`}>
            <h3>{getDeviceStatusUI(currentData.device_status).icon} Cihaz Durumu</h3>
            <p className="status-text">{getDeviceStatusUI(currentData.device_status).text}</p>
          </div>
          
          {currentData.is_anomaly && (
            <div className="value-card anomaly-card">
              <h3>🚨 Anomali Tespit Edildi!</h3>
              <p className="anomaly-score">
                Skor: {currentData.anomaly_score?.toFixed(3) || 'N/A'}
              </p>
            </div>
          )}
          
          {currentData.temperature_prediction && (
            <div className="value-card prediction-card">
              <h3>🔮 Sıcaklık Tahmini</h3>
              <p className="prediction-value">
                {currentData.temperature_prediction.toFixed(1)}°C
              </p>
              <p className="prediction-confidence">
                Güven: %{(currentData.prediction_confidence * 100).toFixed(0)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-container">
          <h3 className="chart-title">📈 Sıcaklık & Nem Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeShort" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" name="Sıcaklık" stroke="#ff6b6b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="humidity" name="Nem" stroke="#4ecdc4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">📶 Sinyal Gücü</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeShort" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="signal_strength" name="Sinyal" stroke="#feca57" fill="#feca57" fillOpacity={0.6}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">💻 Anlık Sistem Kullanımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentData ? [currentData] : []}>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpu_usage" fill="#8884d8" name="CPU %" />
              <Bar dataKey="memory_usage" fill="#82ca9d" name="Bellek %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">🔄 Sistem Kaynakları</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={systemUsageData} cx="50%" cy="50%" labelLine={false}
                   label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                   outerRadius={80} fill="#8884d8" dataKey="value">
                {systemUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="data-table-container">
        <h3 className="table-title">📊 Son Veriler</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr className="table-header">
                <th>Zaman</th>
                <th>Sıcaklık</th>
                <th>Nem</th>
                <th>Sinyal</th>
                <th>CPU</th>
                <th>Bellek</th>
                <th>Ağ Hızı</th>
                <th>Cihaz Durumu</th>
              </tr>
            </thead>
            <tbody>
              {streamData.slice(0, 10).map((data, index) => (
                <tr key={index} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td>{data.time}</td>
                  <td>{data.temperature}°C</td>
                  <td>{data.humidity}%</td>
                  <td>{data.signal_strength}%</td>
                  <td>{data.cpu_usage}%</td>
                  <td>{data.memory_usage}%</td>
                  <td>{data.network_speed} Mbps</td>
                  <td className={`status-cell status-${data.device_status}`}>
                    {getDeviceStatusUI(data.device_status).icon} {getDeviceStatusUI(data.device_status).text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">
          <h2>🔥 Big Data AI</h2>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-link ${currentPage === 'ml' ? 'active' : ''}`}
            onClick={() => setCurrentPage('ml')}
          >
            🤖 ML Dashboard
          </button>
          <button 
            className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            ⚙️ Ayarlar
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="app-content">
        {renderPage()}
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
