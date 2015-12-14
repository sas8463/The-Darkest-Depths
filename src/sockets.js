//var app = require('http').createServer(handler)
//var io = require('socket.io')(app);
var fs = require('fs');
var models = require('./models/');
var Player = models.Player;
//var PORT = process.env.PORT || process.env.NODE_PORT || 3000;

//app.listen(PORT);

var users = {};

//The map object that defines a large amount of our game.
//It is a javascript object that contains definitions for each room
//Each room has a position on the map, its connections, and is either safe or dangerous
//If its not safe, there is an enemy with a name, health, damage, and a spawn timer.
var gameMap = {
	room1: {posX: 180, posY: 230, up: 'room2', down: null, left: null, right: null, safe:true},
	room2: {posX: 180, posY: 210, up: 'room3', down: 'room1', left: null, right: null, safe:false, enemy:{name:"Slime", alive:true, health:20, maxHealth:20, damage: 12, timer:10000, maxTimer:10000}},
	room3: {posX: 180, posY: 190, up: null, down: 'room2', left: 'room4', right: 'room5', safe:false, enemy:{name:"Wolf", alive:true, health:40, maxHealth:40, damage: 15, timer:10000, maxTimer:10000}},
	room4: {posX: 160, posY: 190, up: null, down: null, left: 'room6', right: 'room3', safe:true},
	room5: {posX: 200, posY: 190, up: null, down: null, left: 'room3', right: 'room9', safe:true},
	room6: {posX: 140, posY: 190, up: null, down: null, left: 'room7', right: 'room4', safe:false, enemy:{name:"Skeleton", alive:true, health:60, maxHealth:60, damage: 15, timer:15000, maxTimer:15000}},
	room7: {posX: 120, posY: 190, up: 'room8', down: null, left: null, right: 'room6', safe:false, enemy:{name:"Zombie", alive:true, health:40, maxHealth:40, damage: 17, timer:20000, maxTimer:20000}},
	room8: {posX: 120, posY: 170, up: null, down: 'room7', left: 'room12', right: null, safe:false, enemy:{name:"Necromancer", alive:true, health:100, maxHealth:100, damage: 20, timer:25000, maxTimer:25000}},
	room9: {posX: 220, posY: 190, up: null, down: null, left: 'room5', right: 'room10', safe:false, enemy:{name:"Bandit Rogue", alive:true, health:40, maxHealth:40, damage: 17, timer:15000, maxTimer:15000}},
	room10: {posX: 240, posY: 190, up: 'room11', down: null, left: 'room9', right: null, safe:false, enemy:{name:"Bandit Warrior", alive:true, health:60, maxHealth:60, damage: 15, timer:20000, maxTimer:20000}},
	room11: {posX: 240, posY: 170, up: null, down: 'room10', left: null, right: 'room13', safe:false, enemy:{name:"Bandit Champion", alive:true, health:100, maxHealth:100, damage: 20, timer:25000, maxTimer:25000}},
	room12: {posX: 100, posY: 170, up: null, down: null, left: 'room23', right: 'room8', safe:true},
	room13: {posX: 260, posY: 170, up: null, down: null, left: 'room11', right: 'room14', safe:true},
	room14: {posX: 280, posY: 170, up: 'room19', down: null, left: 'room13', right: 'room15', safe:false, enemy:{name:"Practice Area Entrance Sign", alive:true, health:1, maxHealth:1, damage: 1, timer:60000, maxTimer:60000}},
	room15: {posX: 300, posY: 170, up: 'room18', down: null, left: 'room14', right: 'room16', safe:false, enemy:{name:"Practice Enemy", alive:true, health:300, maxHealth:300, damage: 15, timer:5000, maxTimer:5000}},
	room16: {posX: 320, posY: 170, up: 'room17', down: null, left: 'room15', right: null, safe:false, enemy:{name:"Practice Miniboss", alive:true, health:500, maxHealth:500, damage: 20, timer:5000, maxTimer:5000}},
	room17: {posX: 320, posY: 150, up: 'room22', down: 'room16', left: 'room18', right: null, safe:false, enemy:{name:"Practice Boss", alive:true, health:500, maxHealth:500, damage: 40, timer:5000, maxTimer:5000}},
	room18: {posX: 300, posY: 150, up: 'room21', down: 'room15', left: 'room19', right: 'room17', safe:false, enemy:{name:"Practice Miniboss", alive:true, health:400, maxHealth:400, damage: 25, timer:5000, maxTimer:5000}},
	room19: {posX: 280, posY: 150, up: 'room20', down: 'room14', left: null, right: 'room18', safe:false, enemy:{name:"Practice Enemy", alive:true, health:200, maxHealth:200, damage: 20, timer:5000, maxTimer:5000}},
	room20: {posX: 280, posY: 130, up: null, down: 'room19', left: null, right: 'room21', safe:false, enemy:{name:"Practice Miniboss", alive:true, health:300, maxHealth:300, damage: 30, timer:5000, maxTimer:5000}},
	room21: {posX: 300, posY: 130, up: null, down: 'room18', left: 'room20', right: 'room22', safe:false, enemy:{name:"Practice Boss", alive:true, health:750, maxHealth:750, damage: 30, timer:5000, maxTimer:5000}},
	room22: {posX: 320, posY: 130, up: null, down: 'room17', left: 'room21', right: null, safe:false, enemy:{name:"The Unkillable Practice Dummy", alive:true, health:999999, maxHealth:999999, damage: 1, timer:900000, maxTimer:900000}},
	room23: {posX: 80, posY: 170, up: null, down: null, left: 'room24', right: 'room12', safe:false, enemy:{name:"Shade", alive:true, health:200, maxHealth:200, damage: 20, timer:20000, maxTimer:20000}},
	room24: {posX: 60, posY: 170, up: 'room25', down: null, left: null, right: 'room23', safe:false, enemy:{name:"Wraith", alive:true, health:300, maxHealth:300, damage: 30, timer:30000, maxTimer:30000}},
	room25: {posX: 60, posY: 150, up: 'room26', down: 'room24', left: null, right: null, safe:false, enemy:{name:"Demon", alive:true, health:500, maxHealth:500, damage: 40, timer:40000, maxTimer:40000}},
	room26: {posX: 60, posY: 130, up: null, down: 'room25', left: 'room27', right: 'room28', safe:true},
	room27: {posX: 40, posY: 130, up: 'room29', down: null, left: null, right: 'room26', safe:false, enemy:{name:"Basilisk", alive:true, health:750, maxHealth:750, damage: 30, timer:30000, maxTimer:30000}},
	room28: {posX: 80, posY: 130, up: 'room30', down: null, left: 'room26', right: null, safe:false, enemy:{name:"Basilisk", alive:true, health:750, maxHealth:750, damage: 30, timer:30000, maxTimer:30000}},
	room29: {posX: 40, posY: 110, up: 'room31', down: 'room27', left: null, right: null, safe:false, enemy:{name:"Behemoth", alive:true, health:750, maxHealth:750, damage: 40, timer:40000, maxTimer:40000}},
	room30: {posX: 80, posY: 110, up: 'room32', down: 'room28', left: null, right: null, safe:false, enemy:{name:"Behemoth", alive:true, health:750, maxHealth:750, damage: 40, timer:40000, maxTimer:40000}},
	room31: {posX: 40, posY: 90, up: 'room33', down: 'room29', left: null, right: null, safe:false, enemy:{name:"Wyvern", alive:true, health:1000, maxHealth:1000, damage: 50, timer:50000, maxTimer:50000}},
	room32: {posX: 80, posY: 90, up: 'room34', down: 'room30', left: null, right: null, safe:false, enemy:{name:"Wyvern", alive:true, health:1000, maxHealth:1000, damage: 50, timer:50000, maxTimer:50000}},
	room33: {posX: 40, posY: 70, up: 'room35', down: 'room31', left: null, right: null, safe:false, enemy:{name:"Gryphon", alive:true, health:1500, maxHealth:1500, damage: 75, timer:60000, maxTimer:60000}},
	room34: {posX: 80, posY: 70, up: 'room36', down: 'room32', left: null, right: null, safe:false, enemy:{name:"Gryphon", alive:true, health:1500, maxHealth:1500, damage: 75, timer:60000, maxTimer:60000}},
	room35: {posX: 40, posY: 50, up: null, down: 'room33', left: null, right: 'room37', safe:true},
	room36: {posX: 80, posY: 50, up: null, down: 'room34', left: 'room37', right: null, safe:true},
	room37: {posX: 60, posY: 50, up: 'room38', down: null, left: 'room35', right: 'room36', safe:false, enemy:{name:"Dragonling", alive:true, health:2500, maxHealth:2500, damage: 125, timer:5000, maxTimer:5000}},
	room38: {posX: 60, posY: 30, up: null, down: 'room37', left: null, right: null, safe:false, enemy:{name:"Dragon", alive:true, health:5000, maxHealth:5000, damage: 250, timer:120000, maxTimer:120000}}
};

function updateSpawnTimers(){
	var mapArray = Object.keys(gameMap);
	mapArray.forEach(function(value, index, ar)
	{
		//If the room is not safe, there is an enemy
		if(!(gameMap[value].safe))
		{
			//If the enemy is not alive, update his spawn timer
			if(!(gameMap[value].enemy.alive))
			{
				gameMap[value].enemy.timer -= 1000;
				if(gameMap[value].enemy.timer <= -1)
				{
					//Respawn the enemy at the end of the timer.
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
	//Checks for dead enemies every second
	setInterval(updateSpawnTimers, 1000);
	
	io.on('connection', function (socket) {
	
		socket.on("join", function(data) {
			//Add the user to the list, set the socket name, send out a few server messages.
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
			//Save the player data upon exiting.
			Player.PlayerModel.savePlayerData(data.player);
		});
		
		socket.on('save', function(data){
			//Save the players data every once in a while.
			Player.PlayerModel.savePlayerData(data.player);
		});
		
		socket.on('getMap', function(data) {
			io.sockets.emit('getMap', {gameMap: gameMap}); 
		});
		
		socket.on('playerDeath', function() {
			//Let players know when someone has died.
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
			
			//Check if the enemy was killed
			if(gameMap[room].enemy.health <= 0)
			{
				//Update the enemies info and inform the local players
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
			if(data.damageTaken !== 0)
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
			
			//Now that you've changed rooms, let the player know whos there.
			message = "List of players in this room:\n";
			socket.emit('updateCombatLog', {msg: message});
			var usersArr = Object.keys(users);
			var emptyRoom = true;
			usersArr.forEach(function(value, index, ar)
			{
				//Loop through every user
				if(users[value].name !== socket.name)
				{
					//If the user isn't you and rooms match, emit the name.
					if(users[value].currentRoom == data.newRoom)
					{
						emptyRoom = false;
						message = users[value].name + "\n";
						socket.emit('updateCombatLog', {msg: message});
					}
				}
			});
			//If nobodies name was printed, let the player know its empty.
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
			//Mainly for chat messages, send to everyone.
			io.sockets.emit('msg', {
				name: socket.name,
				msg: data.msg
			});
		});
	});
	
};

module.exports.configureSockets = configureSockets;