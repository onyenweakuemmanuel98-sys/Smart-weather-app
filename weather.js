
 /* =====================================================
SMART WEATHER APP JAVASCRIPT
===================================================== */

const API_KEY = "0cc95f9baaa74b1ada9f0c774d0f9500";

let forecastData = null;

/* =====================================================
TAB SWITCHING
===================================================== */
function showTab(tabId, element){

    document.querySelectorAll(".page").forEach(page=>{
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(nav=>{
        nav.classList.remove("active");
    });

    const page = document.getElementById(tabId);

    if(page){
        page.classList.add("active");
    }

    if(element){
        element.classList.add("active");
    }

    if(tabId === "seasons"){
        loadSeason();
    }
}

/* =====================================================
WEATHER
===================================================== */

async function getWeatherByCoords(lat,lon){
    try{
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        const data = await res.json();

        if(data.cod !== 200) return;

        updateHome(data);
        loadForecast(data.name);

    }catch(error){
        console.log(error);
    }
}

async function getWeatherByCity(city){
    try{
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );

        const data = await res.json();

        if(data.cod !== 200){
            alert("City not found");
            return;
        }

        updateHome(data);
        loadForecast(city);

    }catch(error){
        console.log(error);
    }
}

/* =====================================================
UPDATE UI
===================================================== */

function updateHome(data){

    document.getElementById("city").innerText = data.name;
    document.getElementById("temp").innerText = Math.round(data.main.temp) + "°C";
    document.getElementById("condition").innerText = data.weather[0].description;
    document.getElementById("humidity").innerText = data.main.humidity + "%";
    document.getElementById("wind").innerText = data.wind.speed + " m/s";
    document.getElementById("pressure").innerText = data.main.pressure + " hPa";

    document.getElementById("sunrise").innerText =
        new Date(data.sys.sunrise * 1000).toLocaleTimeString();

    document.getElementById("icon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
}

/* =====================================================
FORECAST
===================================================== */

async function loadForecast(city){

    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );

    const data = await res.json();

    forecastData = data;

    displayHourly(data);
    displayWeekly(data);
}

/* =====================================================
HOURLY
===================================================== */

function displayHourly(data){

    const container = document.getElementById("hourlyForecast");
    container.innerHTML = "";

    for(let i=0;i<5;i++){

        const hour = data.list[i];

        container.innerHTML += `
        <div class="hour-card">
        ${new Date(hour.dt * 1000).getHours()}:00
        <br><br>
        <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png">
        <br><br>
        ${Math.round(hour.main.temp)}°
        </div>
        `;
    }
}

/* =====================================================
WEEKLY
===================================================== */

function displayWeekly(data){

    const container = document.getElementById("weeklyForecast");
    container.innerHTML = "";

    for(let i=0;i<data.list.length;i+=8){

        const day = data.list[i];

        container.innerHTML += `
        <div class="hour-card">
        ${new Date(day.dt * 1000).toLocaleDateString("en-US",{weekday:"long"})}
        <br><br>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
        <br><br>
        ${Math.round(day.main.temp)}°
        </div>
        `;
    }
}

/* =====================================================
AI LOGIC
===================================================== */

async function askAI(){

    const input = document.getElementById("aiInput");
    const chat = document.getElementById("aiChat");

    const question = input.value.toLowerCase().trim();
    if(question === "") return;

    // USER MESSAGE
    const userMsg = document.createElement("div");
    userMsg.className = "user-message";
    userMsg.innerText = input.value;
    chat.appendChild(userMsg);

    input.value = "";

    // CREATE TYPING INDICATOR
    const typing = document.createElement("div");
    typing.className = "ai-message typing";
    typing.innerHTML = `<span></span><span></span><span></span>`;
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    // WAIT 3 SECONDS TO SIMULATE THINKING
    await new Promise(resolve => setTimeout(resolve, 3000));

    // REMOVE TYPING INDICATOR
    chat.removeChild(typing);

    // GENERATE ANSWER
    let answer = "";

    // GREETING
    if(question.includes("hello") || question.includes("hi")){
        answer = "Hello 👋 I'm Seline, your Weather AI.";
    }

    // WEATHER IN CITY
    else if(question.includes("weather in")){
        const city = question.split("weather in")[1].trim();
        await displayCityWeatherCard(city, chat);
        return; 
    }

    // WEATHER DATA LOADING
    else if(!forecastData){
        answer = "Weather data is still loading.";
    }

    // RAIN
    else if(question.includes("rain")){
        const rain = forecastData.list.find(item =>
            item.weather[0].description.includes("rain")
        );
        answer = rain
            ? " Yes, Rain may happen around " + new Date(rain.dt*1000).toLocaleString()
            : "No, rain is not expected.";
    }

    // TOMORROW
    else if(question.includes("tomorrow")){
        const tomorrow = forecastData.list[8];
        answer = "Tomorrow will be around "
            + Math.round(tomorrow.main.temp)
            + "°C with "
            + tomorrow.weather[0].description;
    }

    // SEASON QUESTIONS
    else if(["winter","spring","summer","autumn"].some(s=>question.includes(s))){
        const handled = await getSeasonAnswer(question, chat);
        if(!handled){
            const aiMsg = document.createElement("div");
            aiMsg.className = "ai-message";
            aiMsg.innerText = "Sorry, I couldn't identify the season.";
            chat.appendChild(aiMsg);
            chat.scrollTop = chat.scrollHeight;
        }
        return;
    }

    // DEFAULT
    else{
        answer = "Try asking: 'Will it rain?' or 'Weather in Paris' or about a season like 'Winter'.";
    }

    if(answer){
        const aiMsg = document.createElement("div");
        aiMsg.className = "ai-message";
        aiMsg.innerText = answer;
        chat.appendChild(aiMsg);
        chat.scrollTop = chat.scrollHeight;
    }
    
    if(question.includes("thanks") || question.includes("thank you")){
        answer = "You're welcome😊 Is there anything else I can help you with 🙂 ?";
    }
}

/* =====================================================
SEASON HELPER
===================================================== */

async function getSeasonAnswer(seasonQuery, chat){
    const season = seasonQuery.toLowerCase();

    const seasonInfo = {
        winter: {
            text: "Winter is the coldest part of the year. During this season, temperatures drop significantly in many regions, and some countries experience beautiful snowfall.",
            images: ["winter1.jpeg","winter2.jpeg","winter3.jpeg","winter4.jpeg"]
        },
        spring: {
            text: "Spring is a season of renewal and growth. Flowers bloom, trees regain their leaves, and the weather becomes warmer and pleasant.",
            images: ["spring1.jpeg","spring2.jpeg","spring3.jpeg","spring4.jpeg"]
        },
        summer: {
            text: "Summer is the hottest season of the year. Days are long and sunny, perfect for outdoor activities and vacations.",
            images: ["summer1.jpeg","summer2.jpeg","summer3.jpeg","summer4.jpeg"]
        },
        autumn: {
            text: "Autumn, or fall, is when leaves change color and fall from trees. The weather cools down, and it's a season of harvest and beauty.",
            images: ["autumn1.jpeg","autumn2.jpeg","autumn3.jpeg","autumn4.jpeg"]
        }
    };

    for(const key in seasonInfo){
        if(season.includes(key)){
            const info = seasonInfo[key];

            const aiMsg = document.createElement("div");
            aiMsg.className = "ai-message";
            aiMsg.innerText = info.text;
            chat.appendChild(aiMsg);

            // Container for two images side by side
            const container = document.createElement("div");
            container.className = "ai-images-container";

            for(let i=0; i<2; i++){
                const img = document.createElement("img");
                img.src = info.images[i];
                img.classList.add("clickable-img");
                container.appendChild(img);
            }

            chat.appendChild(container);
            chat.scrollTop = chat.scrollHeight;
            return true; 
        }
    }

    return false;
}

/* =====================================================
CITY WEATHER CARD FOR AI
===================================================== */

async function displayCityWeatherCard(city, chat){
    try{
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        const data = await res.json();

        if(data.cod !== 200){
            const aiMsg = document.createElement("div");
            aiMsg.className = "ai-message";
            aiMsg.innerText = "City not found.";
            chat.appendChild(aiMsg);
            chat.scrollTop = chat.scrollHeight;
            return;
        }

        const card = document.createElement("div");
        card.className = "ai-weather-card";

      const img = document.createElement("img");
const imgUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

img.src = imgUrl;
img.className = "clickable-img";

// CLICK TO OPEN FULL SCREEN
        const text = document.createElement("div");
        text.innerHTML = `<strong>${data.name}</strong><br>${Math.round(data.main.temp)}°C<br>${data.weather[0].description}`;

        card.appendChild(img);
        card.appendChild(text);
        chat.appendChild(card);
        chat.scrollTop = chat.scrollHeight;

    }catch(err){
        console.log(err);
    }
}

/* =====================================================
SEASONS
===================================================== */

const seasonImages = {

    winter:[
        "winter1.jpeg",
        "winter2.jpeg",
        "winter3.jpeg",
        "winter4.jpeg"
    ],

    spring:[
        "spring1.jpeg",
        "spring2.jpeg",
        "spring3.jpeg",
        "spring4.jpeg"
    ],

    summer:[
        "summer1.jpeg",
        "summer2.jpeg",
        "summer3.jpeg",
        "summer4.jpeg"
    ],

    autumn:[
        "autumn1.jpeg",
        "autumn2.jpeg",
        "autumn3.jpeg",
        "autumn4.jpeg"
    ]
};

let currentSeasonImages = [];
let currentImageIndex = 0;
let seasonInterval = null;

function loadSeason(){

    const month = new Date().getMonth();

    let season;

    if(month === 11 || month <= 1) season = "winter";
    else if(month <= 4) season = "spring";
    else if(month <= 7) season = "summer";
    else season = "autumn";

    currentSeasonImages = seasonImages[season];

    document.getElementById("seasonName").innerText = season.toUpperCase();
    document.getElementById("seasonTitle").innerText = season.toUpperCase();

    const descriptions = {
        winter:"Cold season ❄️",
        spring:"Welcome to spring! 🌸",
        summer:"Hot sunny ☀️",
        autumn:"Leaves fall 🍂"
    };

    document.getElementById("seasonDescription").innerText = descriptions[season];

    currentImageIndex = 0;
    changeSeasonImage();

    if(seasonInterval){
        clearInterval(seasonInterval);
    }

    seasonInterval = setInterval(changeSeasonImage,5000);
}

function changeSeasonImage(){
    const container = document.getElementById("seasonContainer");
    container.style.backgroundImage =
        `url(${currentSeasonImages[currentImageIndex]})`;

    currentImageIndex++;
    if(currentImageIndex >= currentSeasonImages.length){
        currentImageIndex = 0;
    }
}

/* =====================================================
INIT
===================================================== */

function selectCity(cityName){
    if(!cityName) return;

    localStorage.setItem("city", cityName);

    getWeatherByCity(cityName).then(() => {
        document.getElementById("hourlyForecast").innerHTML = `<div class="hour-card">Loading...</div>`;
        document.getElementById("weeklyForecast").innerHTML = `<div class="hour-card">Loading...</div>`;
        window.scrollTo({top: 0, behavior: "smooth"});
        updateDateAndGreeting();
    });
}

function searchCity(){
    const input = document.getElementById("cityInput").value.trim();
    if(input === ""){
        alert("Please enter a city");
        return;
    }
    selectCity(input);
}

function updateDateAndGreeting(){
    const dateEl = document.getElementById("date");
    const greetingEl = document.getElementById("greeting");

    const now = new Date();

    dateEl.innerText = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const hour = now.getHours();
    let greet = "Hello";

    if(hour < 12) greet = "Good morning";
    else if(hour < 18) greet = "Good afternoon";
    else greet = "Good evening";

    greetingEl.innerText = greet;
}
document.addEventListener("DOMContentLoaded", function(){

    const viewer = document.getElementById("imageViewer");
    const viewerImg = document.getElementById("viewerImage");
    const downloadBtn = document.getElementById("downloadBtn");
    const closeViewer = document.getElementById("closeViewer");

    document.addEventListener("click", function(e){
        if(e.target.classList.contains("clickable-img")){
            viewer.style.display = "flex";
            viewerImg.src = e.target.src;
            downloadBtn.href = e.target.src;
        }
    });

    closeViewer.addEventListener("click", function(){
        viewer.style.display = "none";
    });

    viewer.addEventListener("click", function(e){
        if(e.target === viewer){
            viewer.style.display = "none";
        }
    });

});
window.addEventListener("load", updateDateAndGreeting);

window.addEventListener("load",()=>{

    const savedCity = localStorage.getItem("city");

    if(savedCity){
        getWeatherByCity(savedCity);
    }else{
        navigator.geolocation.getCurrentPosition(pos=>{
            getWeatherByCoords(pos.coords.latitude,pos.coords.longitude);
        });
    }
});
