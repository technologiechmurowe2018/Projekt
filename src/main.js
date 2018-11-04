
function LogOut(event){
    $.ajax({
        async: false,
        type: 'POST',
        url: "/endsession?token="+sessionStorage['token'],
        success: function(err,res,req){
            sessionStorage.removeItem('token');
            window.location.reload();
        }
    });
}

var markers = [];
$.ajax({
    async: false,
    type: 'GET',
    url: '/getplaces?token='+sessionStorage['token'],
    success: function(err,res,req) {
         markers = req.responseJSON;
    },
    error: function(err,res,req) {
        console.log(err);
        LogOut();
    }
});

var map = L.map('map', {
    center: [53.4285438,14.5528116],
    zoom: 13
});
map.doubleClickZoom.disable();
var x = document.getElementById("loc");

function showPosition(position) {
    map.panTo([position.coords.latitude,position.coords.longitude])
    x.innerHTML = "Latitude: " + position.coords.latitude +
    " Longitude: " + position.coords.longitude;  
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition,function(){
        l = map.getCenter();
        x.innerHTML = "Latitude: " +l.lat + " Longitude: " + l.lng;  
    });
} else {
    x.innerHTML = "Geolocation is not supported by this browser.";
}

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2htdXJ0eW1hcGthIiwiYSI6ImNqbzAxY2ZnaTJrNmUza3BqaTF6eTVkOWcifQ.fzqst8Lg44wtaUVKSs5d5g', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(map);

// Add in a crosshair for the map
var crosshairIcon = L.icon({
    iconUrl: 'crosshair.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 10], // point of the icon which will correspond to marker's location
});
crosshair = new L.marker(map.getCenter(), {icon: crosshairIcon, clickable:false});
crosshair.addTo(map);

map.on('drag',function(){
    l = this.getCenter();
    crosshair.setLatLng(l);
    x.innerHTML = "Latitude: " +l.lat + " Longitude: " + l.lng;  
});


function newMarker(markerData){
    var marker = L.marker(markerData.LatLng,{draggable:true});
    popUpContent = document.createElement('div');
    popUpContent.innerHTML = "<b>"+markerData.Name+"</b><br>"
    textArea = document.createElement('textarea');
    textArea.rows = 10;
    textArea.value = markerData.ShopList;
    popUpContent.appendChild(textArea);
    marker.bindPopup(popUpContent);
    marker.getPopup().originalValue = markerData;
    marker.getPopup().textAreaRef = textArea;
    marker.on('dragend',function(event){
        popUp = this.getPopup();
        $.ajax({
            type: "POST",
            url: '/updateplace?'+'token='+sessionStorage['token']+'&Name='+popUp.originalValue.Name+'&Lat='+event.target.getLatLng().lat+'&Lng='+event.target.getLatLng().lng+'&ShopList='+popUp.textAreaRef.value,
            success: function(err,res,req) {
            },
            error: function(err,res,req) {
                console.log(err);
                LogOut();
            },
        });
    });
    marker.on('contextmenu',function(event){
        event.originalEvent.preventDefault();
        popUp = this.getPopup();

        $.ajax({
            type: "POST",
            url: '/removeplace?'+'token='+sessionStorage['token']+'&Name='+popUp.originalValue.Name,
            success: function(err,res,req) {
            },
            error: function(err,res,req) {
                console.log(err);
                LogOut();
            },
        });
        this.remove();
    });
    
    marker.on('popupclose',function(event){
        popUp = this.getPopup();
        if(popUp.originalValue.ShopList != popUp.textAreaRef.value){
            if(popUp.textAreaRef.value.length==0)
                popUp.textAreaRef.value = 'Empty';
            $.ajax({
                type: "POST",
                url: '/updateplace?'+'token='+sessionStorage['token']+'&Name='+popUp.originalValue.Name+'&Lat='+event.target.getLatLng().lat+'&Lng='+event.target.getLatLng().lng+'&ShopList='+popUp.textAreaRef.value,
                success: function(err,res,req) {
                },
                error: function(err,res,req) {
                    console.log(err);
                    LogOut();
                },
            });
        }
    });

    marker.addTo(map);
}

for(let i=0;i<markers.length;i++){
    newMarker(markers[i]);
}

map.on('dblclick',function(event){
    var name = prompt("Please enter name of marker");
    if(name==null)
        return false;
    $.ajax({
        type: "POST",
        url: '/newplace?'+'token='+sessionStorage['token']+'&Name='+name+'&Lat='+event.latlng.lat+'&Lng='+event.latlng.lng,
        success: function(err,res,req) {
            newMarker({
                Name:name,
                ShopList:'Empty',
                LatLng: [event.latlng.lat,event.latlng.lng],
            });
        },
        error: function(err,res,req) {
            if(err.status==401)
                LogOut();
            else{
                alert('Name Taken');    
            }
        },
    });
    return false;
});