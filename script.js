/* ============================================================
   Horizon New Tab — newtab.js
   ============================================================ */

/* ── Clock ────────────────────────────────────────────────── */
function updateClock() {
    const now = new Date();
    let hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const time = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const weekday = now.toLocaleDateString([], { weekday: 'long' });
    const month = now.toLocaleDateString([], { month: 'long' });
    const day = now.getDate();
    const year = now.getFullYear();
    const date = `${weekday}, ${day} ${month}, ${year}`;
    document.getElementById('time').textContent = time;
    document.getElementById('date').textContent = date;
}
updateClock();
setInterval(updateClock, 1000);


/* ── Bing Photo of the Day ────────────────────────────────── */
async function loadBingBackground() {
  // Use a CORS proxy approach with Bing's own API
  // Bing image API — HPImageArchive.aspx returns JSON
  const proxyUrl = 'https://api.allorigins.win/get?url=' +
    encodeURIComponent('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-IN');

  try {
    const res = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-IN"
    );

    const data = await res.json();
    const img = data.images[0];

    const url = "https://www.bing.com" + img.url;

    document.getElementById("bg").style.backgroundImage = `url("${url}")`;

    // Attribution
    if (img.title) {
      document.getElementById("bing-title").textContent =
        img.title.split(" (")[0];
    }
    if (img.copyrightlink) {
      document.getElementById("bing-link").href = img.copyrightlink;
    }

  } catch (e) {
    console.error("Bing fetch failed:", e);
  }
}

loadBingBackground();


/* ── Weather (Open-Meteo — free, no key needed) ──────────── */
const weatherEl = document.getElementById('weather');

const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'🌨️', 75:'❄️',
  77:'🌨️',
  80:'🌦️', 81:'🌧️', 82:'⛈️',
  85:'🌨️', 86:'❄️',
  95:'⛈️', 96:'⛈️', 99:'⛈️'
};

const WMO_DESC = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Foggy', 48:'Icy fog',
  51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain',
  71:'Light snow', 73:'Snow', 75:'Heavy snow',
  77:'Snow grains',
  80:'Showers', 81:'Rain showers', 82:'Violent showers',
  85:'Snow showers', 86:'Heavy snow showers',
  95:'Thunderstorm', 96:'Hail storm', 99:'Heavy hail storm'
};

async function loadWeather(lat, lon, cityName) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
    const res  = await fetch(url);
    const data = await res.json();
    const cw   = data.current_weather;
    const code = cw.weathercode;
    const temp = Math.round(cw.temperature);
    const icon = WMO_ICONS[code] ?? '🌡️';
    const desc = WMO_DESC[code] ?? 'Weather';

    weatherEl.innerHTML = `
      <span class="w-icon">${icon}</span>
      <div class="w-info">
        <span class="w-temp">${temp}°C</span>
        <span class="w-desc">${desc}</span>
        <span class="w-location">${cityName}</span>
      </div>`;
  } catch(e) {
    weatherEl.innerHTML = `
      <span style="font-size:11px;opacity:.6">Weather unavailable</span>`;
  }
}

async function reverseGeocode(lat, lon) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await res.json();
    return data.address?.city
        || data.address?.town
        || data.address?.village
        || data.address?.county
        || 'Your location';
  } catch {
    return 'Your location';
  }
}

function initWeather() {
  const saved = localStorage.getItem('weatherLocation');
  if (saved) {
    const { lat, lon, city } = JSON.parse(saved);
    loadWeather(lat, lon, city);
    return;
  }
  if (!navigator.geolocation) {
    weatherEl.innerHTML = `<span style="font-size:11px;opacity:.6">Location unavailable</span>`;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const city = await reverseGeocode(lat, lon);
      loadWeather(lat, lon, city);
    },
    () => {
      weatherEl.innerHTML = `<span style="font-size:11px;opacity:.6">Enable location for weather</span>`;
    },
    { timeout: 8000 }
  );
}

initWeather();

// Settings gear
const modal = document.getElementById('location-modal');
document.getElementById('weather-settings').addEventListener('click', () => {
  const saved = localStorage.getItem('weatherLocation');
  if (saved) {
    const { lat, lon, city } = JSON.parse(saved);
    document.getElementById('lat-input').value = lat;
    document.getElementById('lon-input').value = lon;
    document.getElementById('city-input').value = city;
  }
  modal.classList.add('open');
});
document.getElementById('modal-cancel').addEventListener('click', () => {
  modal.classList.remove('open');
});
document.getElementById('modal-save').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('lat-input').value);
  const lon = parseFloat(document.getElementById('lon-input').value);
  const city = document.getElementById('city-input').value.trim() || 'My Location';
  if (isNaN(lat) || isNaN(lon)) return;
  localStorage.setItem('weatherLocation', JSON.stringify({ lat, lon, city }));
  modal.classList.remove('open');
  loadWeather(lat, lon, city);
});
document.getElementById('modal-auto').addEventListener('click', () => {
  localStorage.removeItem('weatherLocation');
  modal.classList.remove('open');
  initWeather();
});
modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('open');
});
