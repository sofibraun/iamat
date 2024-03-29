var fs = require('fs'),
   url = require('url'),
  http = require('http'),
  path = require('path'),
  mime = require('mime'),
  socketio   = require('socket.io');

var httpServer = http.createServer(function(request, response) {
  var pathname = url.parse(request.url).pathname;
  if(pathname == "/") pathname = "index.html";
  var filename = path.join(process.cwd(), 'public', pathname);

  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.write("404 Not Found");
      response.end();
      return;
    }

    response.writeHead(200, { 'Content-Type': mime.lookup(filename) });
    fs.createReadStream(filename, {
      'flags': 'r',
      'encoding': 'binary',
      'mode': 0666,
      'bufferSize': 4 * 1024
    }).addListener("data", function(chunk) {
      response.write(chunk, 'binary');
    }).addListener("close", function() {
      response.end();
    });
  });
});

var connectedUsers = {};
var webSocket = socketio.listen(httpServer);

if(process.env.NODE_ENV == 'production') {
  webSocket.configure(function () { 
    webSocket.set("transports", ["xhr-polling"]); 
    webSocket.set("polling duration", 10); 
  });
}

webSocket.sockets.on('connection', function(socket) {
  
  socket.on('join', function(user) {
    socket.set('userkey', user.key);
    console.log(user);
    connectedUsers[user.key] = user;
  });

  socket.on("send location", function(data) {
    socket.get('userkey', function(err, key) {
      var user = connectedUsers[key];
      if(user) {
        user.lat = data.lat;
        user.lng = data.lng;
        data.name = user.name
        data.key = key;
        socket.broadcast.emit("location update", data);
      }
    });
  });

  socket.on("request locations", function(sendData) {
    sendData(connectedUsers);
  });

  socket.on('disconnect', function() {
    socket.get('userkey', function(err, key) {
      var userInfo = connectedUsers[key];
      if(userInfo) {
        console.log('User ', userInfo.name, ' has disconnected. Key = ', key);
        delete connectedUsers[key];        
        socket.broadcast.emit("user disconnected", key);
      }
    });
  });
});

httpServer.listen(process.env.PORT || 8080);
console.log('Server running at 8080');
