"use strict";

// VARIABLES
const ZOOM = 10;

// DOM OBJECTS
const selectBox = getByID("select_box");
const options = document.querySelectorAll("option");
const topInfoDiv = getByID("top_info_div");

// DATA SPANS
const wthIcon = getByID("icn");
wthIcon.classList.add("hide_icn");
const wthSpan = getByID("wth");
const ctySpan = getByID("cty");
const lclSpan = getByID("lcl");
const latSpan = getByID("lat");
const lngSpan = getByID("lng");
const altSpan = getByID("alt");

// LEAFLET MAP
const mapAPI = L.map("map_div");
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapAPI);

// JSON READER
let tempObj, elevObj;
const rGeoReader = new XMLHttpRequest();
const tempReader = new XMLHttpRequest();
const elevReader = new XMLHttpRequest();

// CITY OPTIONS
const cityInfo = {
    1: {},
    2: {
        city: "Dubai",
        coords: [25.0657, 55.17128],
        locale: "ar-AE",
        tempSym: "C",
    },
    3: {
        city: "Dallas",
        coords: [32.78306, -96.80667],
        locale: "en-US",
        tempSym: "F",
    },
    4: {
        city: "Tokyo",
        coords: [35.6895, 139.69171],
        locale: "ja-JP",
        tempSym: "C",
    },
    5: {
        city: "Sydney",
        coords: [-33.86785, 151.20732],
        locale: "en-AU",
        tempSym: "C",
    },
};

// FUNCTIONS
// TAG SELECTOR
function getByID(id) {
    return document.getElementById(id);
}

// CURRENT LOCATION
function getCurrLoc() {
    navigator.geolocation.getCurrentPosition(
        function (event) {
            const {
                coords: { latitude, longitude },
            } = event;

            // prettier-ignore
            rGeoReader.open(
                "GET",
                `https://geocode.maps.co/reverse?lat=${latitude}` + 
                `&lon=${longitude}` + 
                `&api_key=65f9b81507bb2634812202dzw66b8d1`,
                true
            );
            rGeoReader.send();

            rGeoReader.addEventListener("load", function (data) {
                const {
                    address: { city },
                } = JSON.parse(data.target.responseText);
                const mapCoords = [latitude, longitude];

                const myLoc = cityInfo[1];
                myLoc.city = city;
                myLoc.coords = mapCoords;
                myLoc.locale = "hr-HR";
                myLoc.tempSym = "C";

                options.forEach((option) => {
                    if (option.value == 1) {
                        option.textContent = city;
                    }
                });

                // FETCHING CITY
                getLocInfo(myLoc);

                // DISPLAYING MARKER
                setMapMarker(myLoc);
            });
        },
        function (errorLog) {
            alert(errorLog);
        },
        { enableHighAccuracy: true }
    );
}

function getLocInfo(cityObj) {
    const { city, coords, locale, tempSym } = cityObj;

    // prettier-ignore
    tempReader.open(
        "GET",
        `https://api.openweathermap.org/data/3.0/onecall?` +
        `units=metric&` +
        `lat=${coords[0]}&` +
        `lon=${coords[1]}&` +
        `appid=8c65933ac0eb0a5d794d38e3a54deec8`,
        true
    );
    tempReader.send();

    tempReader.addEventListener("load", function (event) {
        // DATA PARSING
        tempObj = JSON.parse(event.target.responseText);
    });

    // prettier-ignore
    elevReader.open(
        "GET",
        `https://api.open-meteo.com/v1/` + 
        `elevation?` + 
        `latitude=${coords[0]}&` + 
        `longitude=${coords[1]}`,
        true
    );
    elevReader.send();

    elevReader.addEventListener("load", function (event) {
        // DATA PARSING
        elevObj = JSON.parse(event.target.responseText);
    });

    // TIMEOUT
    setTimeout(function () {
        // TOP_INFO_DIV EVENT
        topInfoDiv.addEventListener("click", function (event) {
            const dataDiv = event.target.closest(".data_divs");

            if (dataDiv) {
                // SETTING THE TOP DATA SPANS (ONCLICK)
                setCityInfoSpans(tempObj, tempSym, city, locale);
            }
        });

        // SETTING THE TOP DATA SPANS
        setCityInfoSpans(tempObj, tempSym, city, locale);

        // SETTING THE BOTTOM DATA SPANS
        latSpan.textContent = coords[0].toFixed(5);
        lngSpan.textContent = coords[1].toFixed(5);

        // CHECKING COUNTRY CODE
        const { elevation } = elevObj;
        const currCode = locale.split("-")[1];
        // prettier-ignore
        const currElev = 
            currCode === "US" ? 
            `${(elevation[0] * 3.281).toFixed(1)}ft` : 
            `${elevation[0].toFixed(1)}m`;
        altSpan.textContent = currElev;
    }, 1000);
}

function setCityInfoSpans(tObj, ...cInfo) {
    // WEATHER API DATA
    const {
        current: {
            weather: {
                0: { icon },
            },
        },
    } = tObj;
    const { timezone_offset } = tObj;
    let {
        current: { temp },
    } = tObj;
    temp = cInfo[0] === "C" ? temp : temp * 1.8 + 32;

    // SETTING THE TOP DATA SPANS
    wthIcon.src = `https://openweathermap.org/img/w/${icon}.png`;
    wthIcon.classList.remove("hide_icn");
    wthSpan.textContent = `${Math.ceil(temp)}°${cInfo[0]}`;
    ctySpan.textContent = cInfo[1];

    const currOffset = timezone_offset * 1000 - 60 * 60 * 1000;
    // prettier-ignore
    lclSpan.textContent = Intl.DateTimeFormat(
        cInfo[2], 
        { hour: "numeric", minute: "numeric"})
        .format(new Date(Date.now() + currOffset)
    );
}

// SWITCH LOCATION
function chgLocInfo() {
    const currCity = cityInfo[selectBox.value];

    // FETCHING CITY
    getLocInfo(currCity);

    // DISPLAYING MARKER
    setMapMarker(currCity);
}

// MARKER SETTER
function setMapMarker(cityObj) {
    const { city, coords } = cityObj;

    // LEAFLET MARKER
    mapAPI.setView(coords, ZOOM);
    const mapMarker = L.marker(coords).addTo(mapAPI);
    mapMarker
        .bindPopup(
            L.popup({
                content: `${city}`,
                keepInView: true,
                closeOnClick: false,
                autoPan: true,
            })
        )
        .openPopup();
}

// EVENT LISTENERS
// INIT CALL EVENT
document.addEventListener("deviceready", getCurrLoc, false);

// SELECT BOX EVENT
selectBox.addEventListener("change", chgLocInfo);
