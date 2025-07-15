import { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './App.css';

function App() {
  const [streamData, setStreamData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const wsRef = useRef();

  useEffect(() => {
    // Open WebSocket for real-time stream
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    wsRef.current.onmessage = e => {
      const data = JSON.parse(e.data);
      
      // Zaman damgasını okunabilir formata çevir
      const formattedData = {
        ...data,
        time: new Date(data.timestamp * 1000).toLocaleTimeString(),
        timeShort: new Date(data.timestamp * 1000).toLocaleTimeString().slice(0, 5)
      };
      
      setCurrentData(formattedData);
      setStreamData(prev => [formattedData, ...prev].slice(0, 50));
    };
    wsRef.current.onerror = console.error;

    return () => wsRef.current && wsRef.current.close();
  }, []);

  // Pie chart için CPU ve Memory verileri
  const systemUsageData = currentData ? [
    { name: 'CPU Kullanımı', value: currentData.cpu_usage },
    { name: 'Bellek Kullanımı', value: currentData.memory_usage },
    { name: 'Boş Alan', value: 100 - Math.max(currentData.cpu_usage, currentData.memory_usage) }
  ] : [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🔥 Canlı Veri Dashboard</h1>
      
      {/* Mevcut Değerler */}
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
          
          <div className={`value-card ${currentData.status === 'active' ? 'status-card-active' : 'status-card-warning'}`}>
            <h3>{currentData.status === 'active' ? '✅' : '⚠️'} Durum</h3>
            <p className="status-text">
              {currentData.status === 'active' ? 'Aktif' : 'Uyarı'}
            </p>
          </div>
        </div>
      )}

      {/* Grafikler */}
      <div className="charts-grid">
        {/* Sıcaklık Grafiği */}
        <div className="chart-container">
          <h3 className="chart-title">📈 Sıcaklık Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={streamData.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeShort" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ff6b6b" 
                strokeWidth={2}
                dot={{ fill: '#ff6b6b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Nem Grafiği */}
        <div className="chart-container">
          <h3 className="chart-title">💧 Nem Oranı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={streamData.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeShort" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="humidity" 
                stroke="#4ecdc4" 
                fill="#4ecdc4" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sistem Kullanımı */}
        <div className="chart-container">
          <h3 className="chart-title">💻 Sistem Kullanımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={streamData.slice(0, 10).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeShort" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cpu_usage" fill="#8884d8" name="CPU %" />
              <Bar dataKey="memory_usage" fill="#82ca9d" name="Bellek %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sistem Durumu Pie Chart */}
        <div className="chart-container">
          <h3 className="chart-title">🔄 Sistem Durumu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={systemUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {systemUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ham Veri Tablosu */}
      <div className="data-table-container">
        <h3 className="table-title">📊 Son 10 Veri</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr className="table-header">
                <th className="table-cell">Zaman</th>
                <th className="table-cell">Sıcaklık</th>
                <th className="table-cell">Nem</th>
                <th className="table-cell">CPU</th>
                <th className="table-cell">Bellek</th>
                <th className="table-cell">Ağ</th>
                <th className="table-cell">Durum</th>
              </tr>
            </thead>
            <tbody>
              {streamData.slice(0, 10).map((data, index) => (
                <tr key={index} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td className="table-cell-small">{data.time}</td>
                  <td className="table-cell-small">{data.temperature}°C</td>
                  <td className="table-cell-small">{data.humidity}%</td>
                  <td className="table-cell-small">{data.cpu_usage}%</td>
                  <td className="table-cell-small">{data.memory_usage}%</td>
                  <td className="table-cell-small">{data.network_speed} Mbps</td>
                  <td className={`table-cell-small ${data.status === 'active' ? 'status-active' : 'status-warning'}`}>
                    {data.status === 'active' ? '✅ Aktif' : '⚠️ Uyarı'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
