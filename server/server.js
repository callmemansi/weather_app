require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

// ---------- MongoDB (optional) ----------
let dbReady = false;

const searchSchema = new mongoose.Schema({
  city: String,
  country: String,
  temp: Number,
  description: String,
  createdAt: { type: Date, default: Date.now },
});
const Search = mongoose.model('Search', searchSchema);

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      dbReady = true;
      console.log('MongoDB connected');
    })
    .catch((err) => console.log('MongoDB error:', err.message));
} else {
  console.log('MONGO_URI not set, history is off');
}

// ---------- Weather route ----------
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    // city name -> latitude/longitude
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results) {
      return res.status(404).json({ error: 'City not found' });
    }
    const { latitude, longitude, name, country } = geoData.results[0];

    // latitude/longitude -> weather
    const weatherRes = await fetch(
      `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'weather-by-api-ninjas.p.rapidapi.com',
        },
      }
    );

    if (!weatherRes.ok) {
      return res.status(weatherRes.status).json({ error: 'Weather API failed' });
    }
    const weather = await weatherRes.json();

    // save search in MongoDB (if connected)
    if (dbReady) {
      try {
        await Search.create({
          city: name,
          country,
          temp: weather.temp,
          description: weather.weather_description,
        });
      } catch (e) {
        console.log('Could not save history:', e.message);
      }
    }

    res.json({ city: name, country, ...weather });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ---------- History routes ----------
app.get('/api/history', async (req, res) => {
  if (!dbReady) return res.json([]);
  const items = await Search.find().sort({ createdAt: -1 }).limit(6);
  res.json(items);
});

app.delete('/api/history', async (req, res) => {
  if (dbReady) await Search.deleteMany({});
  res.json({ ok: true });
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port 5000');
});