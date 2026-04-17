/**
 * Centralized Logic for GigShield AI Risk & Payout Calculations.
 * Ensures data consistency across Rider and Admin dashboards.
 */

export const incomeMap = {
  "300-500": 400,
  "500-800": 650,
  "800-1200": 1000,
  "1200+": 1400
};

export const defaultWeights = {
  aqi: 0.4,
  rainfall: 0.35,
  flood: 0.15,
  traffic: 0.1
};

export const planMultipliers = {
  Basic: 0.5,
  Standard: 0.8,
  Pro: 1.0
};

/**
 * Calculates a unified AI Risk Score (0-100) based on weather and weights.
 * @param {Object} weather - Raw weather data (aqi, rainfall, humidity)
 * @param {Object} weights - Zone-specific or default weights
 * @param {Object} settings - Admin overrides (rainfall_buffer, aqi_throttle)
 * @returns {number}
 */
export function calculateRiskScore(weather, weights = defaultWeights, settings = {}) {
  const rainfallBuffer = settings?.rainfall_buffer || 0;
  const aqiThrottle = settings?.aqi_throttle || 150;

  // Apply Admin connectivity: Scale and buffer the raw weather data
  const scaledAqi = (weather.aqi || 0) * 20;
  const scaledRain = (weather.rainfall || 0) * 10 + rainfallBuffer;
  
  // Parametric logic: if rainfall hits a threshold, flood risk spikes
  const floodRisk = scaledRain > 50 ? 85 : 40;
  
  // Humidity drives traffic risk (simulated)
  const trafficRisk = (weather.humidity || 0) > 80 ? 70 : 40;

  // Weighted average calculation
  const w = { ...defaultWeights, ...weights };
  const rawScore = (w.aqi * scaledAqi) + (w.rainfall * scaledRain) + (w.flood * floodRisk) + (w.traffic * trafficRisk);

  return Math.min(100, Math.round(rawScore));
}

/**
 * Calculates the eligible payout amount based on rider income and plan tier.
 * @param {string} incomeRange - The rider's daily income range key
 * @param {string} selectedPlan - The rider's plan tier (Basic, Standard, Pro)
 * @returns {number}
 */
export function calculatePayoutAmount(incomeRange, selectedPlan = "Standard") {
  const income = incomeMap[incomeRange] || 650;
  const multiplier = planMultipliers[selectedPlan] || 0.8;
  
  // Payout formula: Income * Coverage Tier * Risk Premium Scalar (1.5x for parametric protection)
  return Math.round(income * multiplier * 1.5);
}
