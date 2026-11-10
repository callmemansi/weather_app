import { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000';

function formatTime(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/api/history`);
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      // server off hai toh history skip
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const searchWeather = async (name) => {
    const query = (name ?? city).trim();
    if (!query) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const res = await fetch(`${API}/api/weather?city=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setWeather(data);
      loadHistory();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Server is not running. Start it with: node server.js');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchWeather();
  };

  const clearHistory = async () => {
    await fetch(`${API}/api/history`, { method: 'DELETE' });
    setHistory([]);
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🌤️ Weather App</h1>

        <form className="search" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter city (e.g. Jaipur)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {loading && <p className="info">Loading weather...</p>}

        {weather && (
          <div className="card">
            <h2>
              {weather.city}, {weather.country}
            </h2>
            <img src={weather.weather_icon_png_url} alt={weather.weather_description} />
            <div className="temp">{weather.temp}°C</div>
            <p className="desc">{weather.weather_description}</p>

            <div className="grid">
              <div>
                <span>Feels like</span>
                <b>{weather.feels_like}°C</b>
              </div>
              <div>
                <span>Humidity</span>
                <b>{weather.humidity}%</b>
              </div>
              <div>
                <span>Wind</span>
                <b>{weather.wind_speed} m/s</b>
              </div>
              <div>
                <span>Min / Max</span>
                <b>
                  {weather.min_temp}° / {weather.max_temp}°
                </b>
              </div>
              <div>
                <span>Sunrise</span>
                <b>{formatTime(weather.sunrise)}</b>
              </div>
              <div>
                <span>Sunset</span>
                <b>{formatTime(weather.sunset)}</b>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="history">
            <div className="history-head">
              <h3>Recent searches</h3>
              <button className="clear" onClick={clearHistory}>
                Clear
              </button>
            </div>
            <div className="chips">
              {history.map((item) => (
                <button
                  key={item._id}
                  className="chip"
                  onClick={() => {
                    setCity(item.city);
                    searchWeather(item.city);
                  }}
                >
                  {item.city} · {item.temp}°C
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;