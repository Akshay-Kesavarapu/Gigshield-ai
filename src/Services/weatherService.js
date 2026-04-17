const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;

/**
 * Fetches live weather and air quality data for a zone.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{temperature:number, humidity:number, rainfall:number, aqi:number}>}
 */
export const fetchLiveWeather = async (lat, lon) => {
  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!weatherRes.ok) {
      throw new Error("Unable to fetch weather data");
    }

    const weatherData = await weatherRes.json();

    const waqiRes = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_API_KEY}`
    );

    if (!waqiRes.ok) {
      throw new Error("Unable to fetch AQI data");
    }

    const waqiData = await waqiRes.json();

    return {
      temperature: weatherData?.main?.temp || 0,
      humidity: weatherData?.main?.humidity || 0,
      rainfall: weatherData?.rain?.["1h"] || weatherData?.rain?.["3h"] || 0,
      aqi: waqiData?.data?.aqi || 0
    };
  } catch (error) {
    return {
      temperature: 0,
      humidity: 0,
      rainfall: 0,
      aqi: 0
    };
  }
};