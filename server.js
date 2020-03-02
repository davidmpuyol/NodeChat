process.env.PWD = process.cwd()
var express = require("express");
var siofu = require("socketio-file-upload");
var app = express();
app.use(siofu.router).listen(8000);
app.use(express.static(__dirname));
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var usuariosConectados = [];
var mensajesAnteriores = [];
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    var uploader = new siofu();
    uploader.dir = "./uploads";
    uploader.listen(socket);
    uploader.on('progress',function(event){
      socket.emit('progreso', event);
    });
    uploader.on('start',function(){
      socket.emit('inicioSubida');
    })
    uploader.on('complete',function(event){
      socket.emit('finSubida');
      socket.broadcast.emit('archivoEnviado', event);
    })
    socket.on('chat message', function(msg){
        mensaje = {message : msg.message, id : socket.id, author: msg.nick};
        mensajesAnteriores.push(mensaje);
        socket.broadcast.emit('chat message', mensaje);
    });
    socket.on('disconnect', function(){
      usuariosConectados = usuariosConectados.filter((usuario) => usuario.id != socket.id);
      socket.broadcast.emit('usuarioDesconectado',socket.id);
      console.log(usuariosConectados);
    });
    socket.on('escribiendo', function(datos){
      console.log(datos.user + " está escribiendo.");
      socket.broadcast.emit('escribiendo', {usuario: datos.user});
    });
    socket.on('sesionIniciada',function(usuario){
      socket.emit('usuarios',usuariosConectados);
      socket.emit('mensajesAnteriores',mensajesAnteriores);
      usuario["imagen"] = __dirname+"\\iconousuario.png";
      usuariosConectados.push(usuario);
      socket.broadcast.emit('usuarioConectado',usuario);
    });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

