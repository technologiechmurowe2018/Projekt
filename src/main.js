var map = L.map('map', {
    center: [53.4285438,14.5528116],
    zoom: 13
});

var x = document.getElementById("loc");

function showPosition(position) {
    map.panTo([position.coords.latitude,position.coords.longitude])
    x.innerHTML = "Latitude: " + position.coords.latitude +
    " Longitude: " + position.coords.longitude;  
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
} else {
    x.innerHTML = "Geolocation is not supported by this browser.";
}

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2htdXJ0eW1hcGthIiwiYSI6ImNqbzAxY2ZnaTJrNmUza3BqaTF6eTVkOWcifQ.fzqst8Lg44wtaUVKSs5d5g', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(map);

map.on('drag',function(){
    l = this.getCenter();
    x.innerHTML = "Latitude: " +l.lat + " Longitude: " + l.lng;  
});



/*
get

'https://www.google.com/maps/search/?api=1&parameters'*/