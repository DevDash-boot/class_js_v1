// weather.js

// 공통 요소 선택
const cityInput = document.getElementById("cityInput");
const resultDisplay = document.getElementById("resultDisplay");
const searchBtn = document.getElementById("searchBtn");

/*
위도와 경도 좌표를 기반으로 날씨 정보를 제공하는
Open-Meteo API를 이용한다.
도시 이름을 검색하여 해당 도시의 위도와 경도를 얻기 위해
Nominatim API를 이용한다.
*/

// 날씨 코드에 따른 아이콘
function getWeatherIcon(weatherCode) {
  if (weatherCode === 0) {
    return "☀️";
  } else if (weatherCode === 1 || weatherCode === 2) {
    return "⛅";
  } else if (weatherCode === 3) {
    return "☁️";
  } else if (weatherCode === 45 || weatherCode === 48) {
    return "🌫️";
  } else if (weatherCode >= 51 && weatherCode <= 57) {
    return "🌧️";
  } else if (weatherCode >= 61 && weatherCode <= 67) {
    return "🌧️";
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return "❄️";
  } else if (weatherCode >= 80 && weatherCode <= 82) {
    return "🌦️";
  } else if (weatherCode >= 95) {
    return "⛈️";
  } else {
    return "❓";
  }
}

// 날씨 코드에 따른 설명
function getWeatherText(weatherCode) {
  if (weatherCode === 0) {
    return "맑음";
  } else if (weatherCode === 1 || weatherCode === 2) {
    return "대체로 맑음";
  } else if (weatherCode === 3) {
    return "흐림";
  } else if (weatherCode === 45 || weatherCode === 48) {
    return "안개";
  } else if (weatherCode >= 51 && weatherCode <= 57) {
    return "이슬비";
  } else if (weatherCode >= 61 && weatherCode <= 67) {
    return "비";
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    return "눈";
  } else if (weatherCode >= 80 && weatherCode <= 82) {
    return "소나기";
  } else if (weatherCode >= 95) {
    return "뇌우";
  } else {
    return "날씨 정보 없음";
  }
}

// 검색
async function searchWeather() {
  resultDisplay.textContent = "날씨를 찾는 중...";
  try {
    // 입력한 도시 이름 가져오기
    const city = cityInput.value.trim();

    // 방어적 코드 : 도시를 입력하지 않았을 경우
    if (city === "") {
      resultDisplay.textContent = "도시 이름을 입력해주세요.";
      return;
    }

    // 도시를 입력해서 위도, 경도 얻는 API
    const nominatim = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;

    // 1. 도시 이름으로 위도, 경도 검색
    const response1 = await fetch(nominatim);
    const data1 = await response1.json();

    // 2. 위도, 경도 가져오기
    if (data1.length === 0) {
      resultDisplay.textContent = "도시를 찾을 수 없습니다.";
      return;
    }

    // Nominatim API에서 받은 도시 검색 결과에서 위도, 경도, 도시 이름을 꺼낸다.
    /* 아래 형식으로 Nominatim이 되어있는데 이것을 읽어오는 것이다.
      {lat: "37.5666791",
      lon: "126.9782914",
      display_name: "서울, 대한민국"} 
      */
    const latitude = data1[0].lat;
    const longitude = data1[0].lon;
    const cityName = data1[0].display_name.split(",")[0]; // 문자열을 배열로 바꾸는 역허ㅏㄹ

    // 날씨 API
    const openMeteo = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    // 3. 위도, 경도로 날씨 선택
    const response2 = await fetch(openMeteo);
    const data2 = await response2.json();

    // 현재 날씨
    // API 요청에 대한 응답으로 보내주는 형태이다.
    /*
    data2 = {
  latitude: 37.56,
  longitude: 126.97,
  current: {
    time: "2026-09-29T15:00",
    interval: 900,
    temperature_2m: 24.5,
    weather_code: 1
  }
}; */
    const weatherCode = data2.current.weather_code;
    const temperature = data2.current.temperature_2m;

    const weatherText = getWeatherText(weatherCode);
    const weatherIcon = getWeatherIcon(weatherCode);

    // 시간대별 데이터
    const hourlyTime = data2.hourly.time;
    const hourlyTemperature = data2.hourly.temperature_2m;
    const hourlyWeatherCode = data2.hourly.weather_code;

    // 앞으로 24시간 날씨
    let hourlyHTML = "";

    for (let i = 0; i < 24; i++) {
      const time = new Date(hourlyTime[i]);
      const hour = time.getHours();
      const temp = Math.round(hourlyTemperature[i]);
      const code = hourlyWeatherCode[i];
      const icon = getWeatherIcon(code);

      hourlyHTML += `
        <div class="hourly-item">
          <div>${hour}시</div>
          <div class="hourly-icon">${icon}</div>
          <div>${temp}°</div>
        </div>
      `;
    }

    // 5일 예보 데이터
    const dailyTime = data2.daily.time;
    const dailyMax = data2.daily.temperature_2m_max;
    const dailyMin = data2.daily.temperature_2m_min;
    const dailyWeatherCode = data2.daily.weather_code;

    // 5일 예보
    let dailyHTML = "";

    for (let i = 0; i < 5; i++) {
      const date = dailyTime[i];
      const max = Math.round(dailyMax[i]);
      const min = Math.round(dailyMin[i]);
      const code = dailyWeatherCode[i];
      const icon = getWeatherIcon(code);

      dailyHTML += `
        <div class="daily-item">
          <div class="daily-date">${date}</div>
          <div class="daily-icon">${icon}</div>
          <div class="daily-temperature">
            <span class="max-temperature">${max}°</span>
            <span class="min-temperature">${min}°</span>
          </div>
        </div>
      `;
    }

    // 4. 화면에 출력하기
    resultDisplay.innerHTML = `
      <div class="current-weather">
        <div class="city-name">📍 ${cityName}</div>

        <div class="current-content">
          <div class="current-main">
            <div class="weather-icon">${weatherIcon}</div>

            <div>
              <div class="temperature">${Math.round(temperature)}°</div>
              <div class="weather-text">${weatherText}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="forecast-section">
        <h2>시간대별 날씨</h2>

        <div class="hourly-list">
          ${hourlyHTML}
        </div>
      </div>

      <div class="forecast-section">
        <h2>5일 예보</h2>

        <div class="daily-list">
          ${dailyHTML}
        </div>
      </div>
    `;
  } catch (error) {
    resultDisplay.textContent = "요청 실패 : " + error.message;
  }
}

// 5. 버튼을 눌러 동작
searchBtn.addEventListener("click", searchWeather);
