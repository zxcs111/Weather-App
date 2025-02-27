import { useState, useEffect } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './App.css';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Use environment variable for API key
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

  const getTemperatureClass = (temp) => {
    if (temp >= 30) return 'very-hot';
    if (temp >= 25) return 'hot';
    if (temp >= 20) return 'warm';
    if (temp >= 10) return 'mild';
    return 'cold';
  };

  // Function to format the last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const fetchWeather = async (e) => {
    e?.preventDefault();
    
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      console.log('Fetching weather from:', url);
      
      const response = await axios.get(url);
      console.log('API Response:', response.data);
      
      if (response.data) {
        setWeather(response.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Unable to fetch weather data');
      }
    } catch (err) {
      console.error('Error details:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('City not found. Please check the spelling and try again.');
        } else if (err.response.status === 401) {
          setError('API key is invalid or expired. Please check the configuration.');
        } else if (err.response.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError(`Server error: ${err.response.status}. Please try again later.`);
        }
        console.error('Response error:', err.response.data);
      } else if (err.request) {
        setError('No response from weather service. Please check your internet connection.');
        console.error('Request error:', err.request);
      } else {
        setError('Unable to fetch weather data. Please try again later.');
        console.error('Error:', err.message);
      }
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh weather data every 5 minutes if a city is selected
  useEffect(() => {
    let interval;
    if (weather) {
      interval = setInterval(() => {
        fetchWeather();
      }, 5 * 60 * 1000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [weather?.name]); // Only re-run if the city changes

  return (
    <div className={`app-container ${weather ? getTemperatureClass(weather.main.temp) : ''}`}>
      <div className="weather-container">
        <h1 className="title">Weather Forecast</h1>
        
        <div className="search-section">
          <form onSubmit={fetchWeather} className="search-form">
            <div className="search-box">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name..."
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-button" disabled={loading}>
                <MagnifyingGlassIcon className="search-icon" />
              </button>
            </div>
          </form>
        </div>

        {loading && <div className="loading">Fetching latest weather data...</div>}
        
        {error && <div className="error">{error}</div>}

        {weather && (
          <div className="weather-info">
            <h2 className="city-name">{weather.name}, {weather.sys.country}</h2>
            <div className="weather-main">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className="weather-icon"
              />
              <div className="temperature-container">
                <p className="temperature">{Math.round(weather.main.temp)}°C</p>
                <p className="weather-description">{weather.weather[0].description}</p>
              </div>
            </div>
            
            <div className="weather-details">
              <div className="detail">
                <span className="label">Feels like:</span>
                <span className="value">{Math.round(weather.main.feels_like)}°C</span>
              </div>
              <div className="detail">
                <span className="label">Humidity:</span>
                <span className="value">{weather.main.humidity}%</span>
              </div>
              <div className="detail">
                <span className="label">Wind:</span>
                <span className="value">{weather.wind.speed} m/s</span>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {formatLastUpdated(lastUpdated)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
