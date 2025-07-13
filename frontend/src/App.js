import { useEffect, useState, useRef } from 'react';
import './App.css';

function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [stream, setStream] = useState([]);
  const wsRef = useRef();

  useEffect(() => {
    // Fetch one-time snapshot
    fetch('http://localhost:8000/data')
      .then(res => res.json())
      .then(setSnapshot)
      .catch(console.error);

    // Open WebSocket for real-time stream
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    wsRef.current.onmessage = e => {
      const data = JSON.parse(e.data);
      setStream(prev => [data, ...prev].slice(0, 50));
    };
    wsRef.current.onerror = console.error;

    return () => wsRef.current && wsRef.current.close();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Snapshot</h1>
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>

      <h1>Stream (last 50 messages)</h1>
      <ul>
        {stream.map((d, i) => (
          <li key={i}>
            {new Date(d.ts * 1000).toLocaleTimeString()} — {d.v.toFixed(4)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
