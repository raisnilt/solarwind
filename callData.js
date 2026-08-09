// Node 18+ script. No API token needed.
// Usage: node energy_charts_hu_extract.js 2026-08-06
import fs from "fs";

const API_BASE = "https://api.energy-charts.info";
const COUNTRY = "hu";
const BIDDING_ZONE = "HU";

async function fetchJson(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${url}: ${response.status} ${response.statusText}: ${body}`);
  }
  return response.json();
}

function seriesByName(productionTypes, name) {
  return productionTypes.find((item) => item.name.toLowerCase() === name.toLowerCase())?.data ?? [];
}

function latestCapacityGw(installedPower, productionName) {
  const series = installedPower.production_types.find(
    (item) => item.name.toLowerCase() === productionName.toLowerCase(),
  );
  if (!series) return null;

  for (let i = series.data.length - 1; i >= 0; i -= 1) {
    if (series.data[i] != null) return series.data[i];
  }
  return null;
}

function capacityFactorPercent(generationMw, capacityGw) {
  if (generationMw == null || capacityGw == null || capacityGw === 0) return null;
  return (generationMw / (capacityGw * 1000)) * 100;
}

function localDateTime(unixSeconds) {
  return new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(unixSeconds * 1000));
}

function alignByTimestamp(unixSeconds, values) {
  return new Map(unixSeconds.map((ts, index) => [ts, values[index]]));
}

function average(values) {
  const present = values.filter((value) => value != null);
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function aggregateToHourly(unixSeconds, values) {
  const buckets = new Map();
  for (let i = 0; i < unixSeconds.length; i += 1) {
    const hourTs = Math.floor(unixSeconds[i] / 3600) * 3600;
    const bucket = buckets.get(hourTs) ?? [];
    bucket.push(values[i]);
    buckets.set(hourTs, bucket);
  }
  return new Map([...buckets.entries()].map(([ts, bucket]) => [ts, average(bucket)]));
}

async function getHuRows(day) {
  const [price, publicPower] = await Promise.all([
    fetchJson("/price", { bzn: BIDDING_ZONE, start: day, end: day }),
    fetchJson("/public_power", { country: COUNTRY, start: day, end: day }),
  ]);

 const installedPower = null;

  const solarMw = seriesByName(publicPower.production_types, "Solar");
  const windMw = seriesByName(publicPower.production_types, "Wind onshore");
  const solarHourly = aggregateToHourly(publicPower.unix_seconds, solarMw);
  const windHourly = aggregateToHourly(publicPower.unix_seconds, windMw);
  const priceHourly = aggregateToHourly(price.unix_seconds, price.price);

  const solarCapacityGw = 8.8465;
  const windCapacityGw = 0.325075;

  return [...priceHourly.keys()].sort((a, b) => a - b).map((ts) => {
    const solarGenerationMw = solarHourly.get(ts) ?? null;
    const windGenerationMw = windHourly.get(ts) ?? null;

    return {
      datetime_unix_seconds: ts,
      datetime_budapest: localDateTime(ts),
      price_eur_per_mwh: priceHourly.get(ts),
      solar_generation_mw: solarGenerationMw,
      solar_capacity_gw_used: solarCapacityGw,
      solar_capacity_factor_percent: capacityFactorPercent(solarGenerationMw, solarCapacityGw),
      wind_generation_mw: windGenerationMw,
      wind_capacity_gw_used: windCapacityGw,
      wind_capacity_factor_percent: capacityFactorPercent(windGenerationMw, windCapacityGw),
    };
  });
}

function toCsv(rows) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value) => {
    if (value == null) return "";
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

const day = process.argv[2]
const rows = await getHuRows(day);
console.table(rows);

fs.writeFileSync(
  `energy_data_${day}.js`,
  `window.currentEnergyData = ${JSON.stringify(rows, null, 2)};`
);

console.log("Mentve: energy_data.js");
export { getHuRows, toCsv };
