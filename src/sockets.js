//var app = require('http').createServer(handler)
//var io = require('socket.io')(app);
var fs = require('fs');
var models = require('./models/');
var Player = models.Player;
//var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

//app.listen(PORT);

var users = {};

var gameMap = {
	room1: {posX: 145, posY: 180, up: 'room2', down: null, left: null, right: null, safe:true},
	room2: {posX: 145, posY: 160, up: 'room3', down: 'room1', left: null, right: null, safe:false, enemy:{name:"Slime", alive:true, health:10, maxHealth:10, damage: 10, timer:10000, maxTimer:10000}},
	room3: {posX: 145, posY: 140, up: null, down: 'room2', left: 'room4', right: 'room5', safe:false, enemy:{name:"Wolf", alive:true, health:20, maxHealth:20, damage: 13, timer:10000, maxTimer:10000}},
	room4: {posX: 125, posY: 140, up: null, down: null, left: 'room6', right: 'room3', safe:true},
	room5: {posX: 165, posY: 140, up: null, down: null, left: 'room3', right: 'room9', safe:true},
	room6: {posX: 105, posY: 140, up: null, down: null, left: 'room7', right: 'room4', safe:false, enemy:{name:"Skeleton", alive:true, health:30, maxHealth:30, damage: 13, timer:15000, maxTimer:15000}},
	room7: {posX: 85, posY: 140, up: 'room8', down: null, left: null, right: 'room6', safe:false, enemy:{name:"Zombie", alive:true, health:20, maxHealth:20, damage: 15, timer:20000, maxTimer:20000}},
	room8: {posX: 85, posY: 120, up: null, down: 'room7', left: 'room12', right: null, safe:false, enemy:{name:"Necromancer", alive:true, health:50, maxHealth:50, damage: 20, timer:25000, maxTimer:25000}},
	room9: {posX: 185, posY: 140, up: null, down: null, left: 'room5', right: 'room10', safe:false, enemy:{name:"Bandit Rogue", alive:true, health:20, maxHealth:20, damage: 15, timer:15000, maxTimer:15000}},
	room10: {posX: 205, posY: 140, up: 'room11', down: null, left: 'room9', right: null, safe:false, enemy:{name:"Bandit Warrior", alive:true, health:30, maxHealth:30, damage: 13, timer:20000, maxTimer:20000}},
	room11: {posX: 205, posY: 120, up: null, down: 'room10', left: null, right: 'room13', safe:false, enemy:{name:"Bandit Champion", alive:true, health:50, maxHealth:50, damage: 20, timer:25000, maxTimer:25000}},
	room12: {posX: 65, posY: 120, up: null, down: null, left: null, right: 'room8', safe:true},
	room13: {posX: 225, posY: 120, up: null, down: null, left: 'room11', right: null, safe:true}
};

function updateSpawnTimers(){
	var mapArray = Object.keys(gameMap);
	mapArray.forEach(function(value, index, ar)
	{
		if(!(gameMap[value].safe))
		{
			if(!(gameMap[value].enemy.alive))
			{
				gameMap[value].enemy.timer -= 1000;
				if(gameMap[value].enemy.timer <= -1)
				{
					gameMap[value].enemy.timer = gameMap[value].enemy.maxTimer;
					gameMap[value].enemy.health = gameMap[value].enemy.maxHealth; 
					gameMap[value].enemy.alive = true; 
				}
				io.sockets.in(value).emit('getMap', {gameMap: gameMap});
			}
		}
	});
}

var configureSockets = function(socketio)
{
	io = socketio;
	
	setInterval(updateSpawnTimers, 1000);
	
	io.on('connection', function (socket) {
	
		socket.on("join", function(data) {
			
			socket.name = data.name;
			users[socket.name] = {name: socket.name, currentRoom: data.location};
			var joinMsg = {
				name: 'Server',
				msg: 'There are ' + Object.keys(users).length + ' users online.'
			};
			
			socket.emit('msg', joinMsg);
			
			socket.join(data.location);
			
			socket.broadcast.emit('msg', {
				name: 'Server',
				msg: data.name + " has joined the server."
			});
			
			socket.emit("msg", {
				name: 'Server',
				msg: 'You joined the server.'
			});
			
			//After connecting, get the current map and draw it
			socket.emit('getMap', {gameMap: gameMap}); 
			socket.emit('drawMap'); 
			var message = "You are in " + users[socket.name].currentRoom + "! \n";
			socket.emit('updateCombatLog', {msg: message});			
		});
		
		socket.on('close', function(data) {
			delete users[socket.name];
			console.log("Disconnected " + socket.name);
			io.sockets.emit('msg', {
				name: 'Server',
				msg: socket.name + " has disconnected."
			});
			
			Player.PlayerModel.savePlayerData(data.player);
		});
		
		socket.on('getMap', function(data) {
			io.sockets.emit('getMap', {gameMap: gameMap}); 
		});
		
		socket.on('playerDeath', function() {
			var message = socket.name + " has perished!\n";
			io.sockets.emit('updateCombatLog', {msg: message}); 
		});
		
		socket.on('attackEnemy', function(data) {
			//Update the attack to the map
			var room = users[socket.name].currentRoom;
			gameMap[room].enemy.health -= data.damageDealt;
			
			//You attacked Enemy for all other players
			var message = socket.name + " attacked " + gameMap[room].enemy.name + " for " + data.damageDealt + " damage! \n";
			socket.broadcast.in(room).emit('updateCombatLog', {msg: message});
			
			//You attacked enemy for yourself
			message = "You attacked " + gameMap[room].enemy.name + " for " + data.damageDealt + " damage! \n";
			socket.emit('updateCombatLog', {msg: message});
			
			//You were attacked by the enemy for all other players
			message = gameMap[room].enemy.name + " attacked " + socket.name + " for " + data.damageTaken + " damage in retaliation! \n";
			socket.broadcast.in(room).emit('updateCombatLog', {msg: message});
			
			//You were attacked by the enemy for yourself
			message = gameMap[room].enemy.name + " attacked you in retaliation for " + data.damageTaken + " damage in retaliation! \n";
			socket.emit('updateCombatLog', {msg: message});
			
			//Update yourself based on the attack
			socket.emit('attackReceived', {damage: data.damageTaken}); 
			
			if(gameMap[room].enemy.health <= 0)
			{
				gameMap[room].enemy.alive = false;
				gameMap[room].enemy.health = 0;
				message = gameMap[room].enemy.name + " has been slain! \n";
				io.sockets.in(room).emit('updateCombatLog', {msg: message});

				io.sockets.in(room).emit('gainExp', {exp: (gameMap[room].enemy.maxHealth * 5)});
			}
			
			//Send everyone the new map data, due to damaged enemy
			io.sockets.emit('getMap', {gameMap: gameMap});
		});
		
		socket.on('changeRoom', function(data) {
			socket.join(data.newRoom);
			var message;
			if(data.damageTaken != 0)
			{
				//You were attacked upon leaving for all other players
				message = gameMap[data.oldRoom].enemy.name + " attacked " + socket.name + " for " + data.damageTaken + " damage as he left the room! \n";
				socket.broadcast.in(data.oldRoom).emit('updateCombatLog', {msg: message});
				
				//You were attacked upon leaving for yourself
				message = gameMap[data.oldRoom].enemy.name + " attacked you for " + data.damageTaken + " damage as you left the room! \n";
				socket.emit('updateCombatLog', {msg: message});
				
				//Update yourself based on the attack
				//Enemy was unchanged so don't update map
				socket.emit('attackReceived', {damage: data.damageTaken}); 
			}
			else{
				//Inform all other local players that you left
				message = socket.name + " left the room! \n";
				socket.broadcast.in(data.oldRoom).emit('updateCombatLog', {msg: message});
			}
			//Update your map, miniMap, socket room, and server location
			users[socket.name].currentRoom = data.newRoom;
			socket.emit('getMap', {gameMap: gameMap});	
			socket.emit('drawMap');
			socket.leave(data.oldRoom);
			
			//Update the new room's players that you entered
			message = socket.name + " has entered your room! \n";
			socket.broadcast.in(data.newRoom).emit('updateCombatLog', {msg: message});
			
			message = "List of players in this room:\n";
			socket.emit('updateCombatLog', {msg: message});
			var usersArr = Object.keys(users);
			var emptyRoom = true;
			usersArr.forEach(function(value, index, ar)
			{
				if(!(users[value].name == socket.name))
				{
					if(users[value].currentRoom == data.newRoom)
					{
						emptyRoom = false;
						message = users[value].name + "\n";
						socket.emit('updateCombatLog', {msg: message});
					}
				}
			});
			if(emptyRoom)
			{
				message = "There are no players in this room.\n";
				socket.emit('updateCombatLog', {msg: message});
			}
		});
		
		socket.on('disconnect', function(data) {
			socket.leave(users[socket.name].currentRoom);
		});
		
		socket.on('msgToServer', function(data) {
			io.sockets.emit('msg', {
				name: socket.name,
				msg: data.msg
			}); //sends to everyone including self
		});
	});
	
};

module.exports.configureSockets = configureSockets;