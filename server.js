require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    // Part 1: city name -> latitude/longitude
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results) {
      return res.status(404).json({ error: 'City not found' });
    }
    const { latitude, longitude, name, country } = geoData.results[0];

    // Part 2: latitude/longitude -> weather
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

    res.json({ city: name, country, ...weather });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port 5000');
});