//var app = require('http').createServer(handler)
//var io = require('socket.io')(app);
var fs = require('fs');
var models = require('./models/');
var Player = models.Player;
//var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

//app.listen(PORT);

var users = {};

var gameMap = {
	room1: {posX: 145, posY: 290, up: null, down: null, left: null, right: null, safe:true},
	room2: {posX: 145, posY: 280, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Slime", alive:true, health:5, damage: 1, timer:10000}},
	room3: {posX: 145, posY: 270, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Wolf", alive:true, health:10, damage: 2, timer:10000}},
	room4: {posX: 135, posY: 270, up: null, down: null, left: null, right: null, safe:true},
	room5: {posX: 155, posY: 270, up: null, down: null, left: null, right: null, safe:true},
	room6: {posX: 125, posY: 270, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Skeleton", alive:true, health:15, damage: 2, timer:15000}},
	room7: {posX: 115, posY: 270, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Zombie", alive:true, health:10, damage: 3, timer:20000}},
	room8: {posX: 115, posY: 260, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Necromancer", alive:true, health:25, damage: 5, timer:25000}},
	room9: {posX: 165, posY: 270, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Bandit Rogue", alive:true, health:10, damage: 3, timer:15000}},
	room10: {posX: 175, posY: 270, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Bandit Warrior", alive:true, health:15, damage: 2, timer:20000}},
	room11: {posX: 175, posY: 260, up: null, down: null, left: null, right: null, safe:false, enemy:{name:"Bandit Champion", alive:true, health:25, damage: 5, timer:25000}}
};

//Begin Set Connections
var setUpMapConnections = function()
{
	gameMap.room1.up = gameMap.room2; gameMap.room1.down = null; gameMap.room1.left = null; gameMap.room1.right = null; 
	gameMap.room2.up = gameMap.room3; gameMap.room2.down = gameMap.room1; gameMap.room2.left = null; gameMap.room2.right = null; 
	gameMap.room3.up = null; gameMap.room3.down = gameMap.room2; gameMap.room3.left = gameMap.room4; gameMap.room3.right = gameMap.room5; 
	gameMap.room4.up = null; gameMap.room4.down = null; gameMap.room4.left = gameMap.room6; gameMap.room4.right = gameMap.room3; 
	gameMap.room5.up = null; gameMap.room5.down = null; gameMap.room5.left = gameMap.room3; gameMap.room5.right = gameMap.room9; 
	gameMap.room6.up = null; gameMap.room6.down = null; gameMap.room6.left = gameMap.room7; gameMap.room6.right = gameMap.room4; 
	gameMap.room7.up = gameMap.room8; gameMap.room7.down = null; gameMap.room7.left = null; gameMap.room7.right = gameMap.room6; 
	gameMap.room8.up = null; gameMap.room8.down = gameMap.room7; gameMap.room8.left = null; gameMap.room8.right = null; 
	gameMap.room9.up = null; gameMap.room9.down = null; gameMap.room9.left = gameMap.room5; gameMap.room9.right = gameMap.room10; 
	gameMap.room10.up = gameMap.room11; gameMap.room10.down = null; gameMap.room10.left = gameMap.room9; gameMap.room10.right = null; 
	gameMap.room11.up = null; gameMap.room11.down = gameMap.room10; gameMap.room11.left = null; gameMap.room11.right = null; 
}
//End Set Connections

/*function handler (req, res) {
  fs.readFile(__dirname + '/../client/index.html', function (err, data) {
    if (err) {
      throw err;
    }

    res.writeHead(200);
    res.end(data);
  });
}*/

var configureSockets = function(socketio)
{
	setUpMapConnections();
	io = socketio;
	
	io.on('connection', function (socket) {
		//socket.join('room1');
	
		socket.on("join", function(data) {
			// console.log(data);
			
			socket.name = data.name;
			
			users[socket.name] = {name: socket.name, currentRoom: gameMap.room1};
			
			var joinMsg = {
				name: 'Server',
				msg: 'There are ' + Object.keys(users).length + ' users online.'
			};
			
			socket.emit('msg', joinMsg);
			
			socket.join('room1');
			
			socket.broadcast.emit('msg', {
				name: 'Server',
				msg: data.name + " has joined the server."
			});
			
			socket.emit("msg", {
				name: 'Server',
				msg: 'You joined the server.'
			});
			//console.log(gameMap);
			socket.emit('getMap', gameMap); 	
		});
		
		socket.on('close', function(data) {
			delete users[socket.name];
			console.log("Disconnected " + socket.name);
			io.sockets.in('room1').emit('msg', {
				name: 'Server',
				msg: socket.name + " has disconnected."
			});
			
			Player.PlayerModel.savePlayerData(data.player);
		});
		
		socket.on('draw', function(data) {	
			io.sockets.in('room1').emit('draw', {name:data.name, coords:data.coords}); 
		});
		
		socket.on('getMap', function(data) {
			console.log("updating map");
			io.sockets.in('room1').emit('updateMap', {gameMap:gameMap}); 
		});
		
		socket.on('attackEnemy', function(data) {
			//Update the attack to the map
			io.sockets.in('room1').emit('attackReceived', {msg:data.msg, gameMap:gameMap}); 
		});
		
		socket.on('changeRoom', function(data) {
			users[socket.name].currentRoom = data.room;
			//io.sockets.in('room1').emit('attackReceived', {msg:data.msg}); 
		});
		
		socket.on('disconnect', function(data) {
			socket.leave('room1');
		});
		
		socket.on('msgToServer', function(data) {
			console.log(data.msg);
			io.sockets.emit('msg', {
				name: socket.name,
				msg: data.msg
			}); //sends to everyone including self
		});
	});
	
};

module.exports.configureSockets = configureSockets;