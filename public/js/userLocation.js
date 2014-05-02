var UserLocation ;

UserLocation = (function(){

  function UserLocation(username, socket, mapContainerId) {
    this.markers = {};
    this.user = {};
    this.user.name = username;
    this.user.key = Date.now();
    this.socket = socket;
    this.mapContainerId = mapContainerId;
    this.myMarker;

    socket.emit('join', { name : this.user.name, key: this.user.key });

    this.initMap();

    socket.on('location update', this.updateUser.bind(this));
    socket.on('user disconnected', this.removeUser.bind(this));    
    socket.emit('request locations', this.loadUsers.bind(this));

  }

  UserLocation.prototype.addUser = function(user){
    if(!this.markers[user.key]) {
      this.updateUsersCount(1);
      this.markers[user.key] = this.createMarker(user.lat, user.lng, user.name);
    }    
  }

  UserLocation.prototype.removeUser = function(key){
    var marker = this.markers[key];
    if(marker){
      marker.setMap(null);
      delete this.markers[key];
      this.updateUsersCount(-1);
    }
  }
  
  UserLocation.prototype.updateUsersCount = function (diff){
    var connectedUsers = $("#connected-users span")
    var currentCount = parseInt(connectedUsers.html()) + diff;
    connectedUsers.html(currentCount);
  }

  UserLocation.prototype.updateUser = function(data) {
    var marker = this.markers[data.key];
    if(marker) {
      marker.setPosition(new google.maps.LatLng(data.lat,data.lng));      
    } else {
      this.markers[data.key] = this.createMarker(data.lat, data.lng, data.name);
    }   
  }

  UserLocation.prototype.loadUsers = function(data) {
    for(key in data) {
      this.addUser(data[key]);
    }
  }

  UserLocation.prototype.initMap = function() {
    var defaultPosition = new google.maps.LatLng(-34.593246, -58.381113);
    var mapOptions = {
      zoom: 10,
      center: defaultPosition,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    this.map = new google.maps.Map(document.getElementById(this.mapContainerId), mapOptions);

    this.geolocate();
  }

  UserLocation.prototype.showAndEmitPosition = function(position) {
    var data = {
      lat : position.coords.latitude,
      lng : position.coords.longitude,
    }

    if (!this.myMarker) {
      this.myMarker = this.createMarker(data.lat, data.lng, 'Me');
      this.updateUsersCount(1);    
    } else {
      this.myMarker.setPosition(new google.maps.LatLng(data.lat, data.lng));
    }    

    this.map.setCenter(this.myMarker.getPosition());
    this.socket.emit("send location", data);
    this.markers[this.user.key] = this.myMarker;
  }

  UserLocation.prototype.createMarker = function(lat, lng, title) {

    var infowindow = new google.maps.InfoWindow({
      content: "<p>"+ title + "</p>"
    });

    var marker = new google.maps.Marker({
      title: title,
      map: this.map,
      position: new google.maps.LatLng(lat,lng),
      animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(this.map, marker);
    });

    return marker;
  }

  UserLocation.prototype.geolocate = function() {
    if(navigator.geolocation) {
      navigator.geolocation.watchPosition(this.showAndEmitPosition.bind(this), this.geolocationErrorHandler);
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }

  UserLocation.prototype.geolocationErrorHandler = function(error) {
    var errorStr;
    switch(error.code) {
    case error.PERMISSION_DENIED:
      errorStr = "Can not share location. Permission denied."
    case error.POSITION_UNAVAILABLE:
      errorStr = "Location information is unavailable."
    case error.TIMEOUT:
      errorStr = "The request to get your location timed out."
    case error.UNKNOWN_ERROR:
      errorStr = "An unknown error occurred."
    }
    alert(errorStr);
  }

  return UserLocation;

})();
