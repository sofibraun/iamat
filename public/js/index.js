$(document).ready(function(){
  var socket = io.connect(window.location.hostname);
  var userLocation;

  $('#connect').on('submit', function(e){
    
    var username = $('#name').val();
    $('#user-connect').remove();
    $("#user-name").html(username);
    $('#user-connected').show();
    $('#connected-users').show();

    userLocation = new UserLocation(username, socket, 'map-canvas');

    e.preventDefault();    
  });

});

