"use strict";

var canvas;
var ctx;
var socket;
var chat, send, message;
var combatLog;
var player;
var up, down, left, right, attack;
var gameMap;
var playerHealth, playerLevel, playerExp;
var enemyName, enemyHealth, enemySpawnTimer;

function updateMap(data){
	gameMap = data.gameMap;
	if(gameMap[player.location].safe)
	{
		enemyName.innerHTML = "Name: This room is safe!";
		enemyHealth.innerHTML = "Health: You can recover health over time here.";
		enemySpawnTimer.innerHTML = "Timer: 1 second";
	}
	else
	{
		enemyName.innerHTML = "Name: " + gameMap[player.location].enemy.name;
		enemyHealth.innerHTML = "Health: " + gameMap[player.location].enemy.health + " hp";
		enemySpawnTimer.innerHTML = "Spawn Timer: " + (gameMap[player.location].enemy.timer/1000) + " second(s)";	
	}
}

function drawMap(){
	var mapArray = Object.keys(gameMap);
	mapArray.forEach(function(value, index, ar){
		ctx.beginPath();
		if(value == player.location)
			ctx.fillStyle = "gray";
		else
			ctx.fillStyle = "black";
		var xPos = gameMap[value].posX;
		var yPos = gameMap[value].posY;
		ctx.rect(xPos,yPos,18,18);
		ctx.closePath();
		ctx.fill();
	});
}

function updateCombatLog(data){
	combatLog.innerHTML += (data.msg);
	combatLog.scrollTop = combatLog.scrollHeight;
}

function updateChatLog(data){
	chat.innerHTML += (data.name + ": " + data.msg + "\n");
	chat.scrollTop = chat.scrollHeight;
}

function sendMessage(){
	if(message.value == "")
		return;
	socket.emit('msgToServer', {msg:message.value});
	message.value = "";
}

function moveUp(){
	if(gameMap[player.location].up == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		var damage = 0;
		var prevRoom = player.location;
		if(!(gameMap[prevRoom].safe))
		{
			if(gameMap[prevRoom].enemy.health > 0)
			{
				damage = gameMap[prevRoom].enemy.damage - player.defense;
				if(damage <= 0)
					damage = 1;
			}
		}	
		player.location = gameMap[player.location].up;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");		
		socket.emit('changeRoom', {newRoom: player.location, oldRoom: prevRoom, damageTaken: damage});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;	
}

function moveDown(){
	if(gameMap[player.location].down == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		var damage = 0;
		var prevRoom = player.location;
		if(!(gameMap[prevRoom].safe))
		{
			if(gameMap[prevRoom].enemy.health > 0)
			{
				damage = gameMap[prevRoom].enemy.damage - player.defense;
				if(damage <= 0)
					damage = 1;
			}
		}	
		player.location = gameMap[player.location].down;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");		
		socket.emit('changeRoom', {newRoom: player.location, oldRoom: prevRoom, damageTaken: damage});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function moveLeft(){
	if(gameMap[player.location].left == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		var damage = 0;
		var prevRoom = player.location;
		if(!(gameMap[prevRoom].safe))
		{
			if(gameMap[prevRoom].enemy.health > 0)
			{
				damage = gameMap[prevRoom].enemy.damage - player.defense;
				if(damage <= 0)
					damage = 1;
			}
		}
		player.location = gameMap[player.location].left;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");
		socket.emit('changeRoom', {newRoom: player.location, oldRoom: prevRoom, damageTaken: damage});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function moveRight(){
	if(gameMap[player.location].right == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		var damage = 0;
		var prevRoom = player.location;
		if(!(gameMap[prevRoom].safe))
		{
			if(gameMap[prevRoom].enemy.health > 0)
			{
				damage = gameMap[prevRoom].enemy.damage - player.defense;
				if(damage <= 0)
					damage = 1;
			}
		}
		player.location = gameMap[player.location].right;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");
		socket.emit('changeRoom', {newRoom: player.location, oldRoom: prevRoom, damageTaken: damage});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function receiveAttack(data){
	player.health -= data.damage;
	if(player.health <= 0)
	{
		player.health = 0;
		player.exp = 0;
		socket.emit('changeRoom', {newRoom: 'room1', oldRoom: player.location, damageTaken: 0});
		player.location = 'room1';
		socket.emit('playerDeath');
	}
	playerHealth.innerHTML = "Health: " + player.health;
}

function attackEnemy(){
	if(gameMap[player.location].safe || !(gameMap[player.location].enemy.alive))
	{
		combatLog.innerHTML += ("Currenty, there is no enemy in this room! \n");
		return;
	}
	var damageTaken = gameMap[player.location].enemy.damage - player.defense;
	if(damageTaken <= 0)
		damageTaken = 1;
	var damageDealt = player.damage;
	socket.emit('attackEnemy', {damageTaken: damageTaken, damageDealt: damageDealt});
}

function healPlayer(){
	if(gameMap[player.location].safe)
	{
		player.health++;
		if(player.health > player.maxHealth)
		{
			player.health = player.maxHealth;
		}
		playerHealth.innerHTML = "Health: " + player.health;
	}
}

function onClose()
{
	socket.emit('close', {player: player});
	//socket.onclose = function(){};
	socket.close();
}

function init() {
	canvas = document.querySelector("#canvas");
	ctx = canvas.getContext("2d");
	chat = document.querySelector("#chat");
	combatLog = document.querySelector("#combat");
	send = document.querySelector("#sendButton");
	message = document.querySelector("#chatField");
	up = document.querySelector("#moveUp");
	down = document.querySelector("#moveDown");
	left = document.querySelector("#moveLeft");
	right = document.querySelector("#moveRight");
	attack = document.querySelector("#attack");
	player = document.querySelector("#playerVar");
	playerHealth = document.querySelector("#playerHealth");
	playerLevel = document.querySelector("#playerLevel");
	playerExp = document.querySelector("#playerExp");
	enemyName = document.querySelector("#enemyName");
	enemyHealth = document.querySelector("#enemyHealth");
	enemySpawnTimer = document.querySelector("#enemySpawnTimer");
	
	player = {
		name: player.dataset.name,
		level: player.dataset.level,
		exp: player.dataset.exp,
		health: player.dataset.health,
		maxHealth: player.dataset.maxhealth,
		damage: player.dataset.damage,
		defense: player.dataset.defense,
		location: player.dataset.location
	}
	
	socket = io.connect();
	
	socket.on('getMap', updateMap);
	socket.on('drawMap', drawMap);
	socket.on('updateCombatLog', updateCombatLog);
	socket.on('attackReceived', receiveAttack);
	socket.on('msg', updateChatLog);
	
	socket.on('connect', function () {
		socket.emit('join', {name: player.name, location: player.location});
	});

	send.addEventListener('click', sendMessage);
	window.onkeydown = function(e){
		if (!e) e = window.event;
		var keyCode = e.keyCode || e.which;
		if (keyCode == '13'){
			// Enter pressed
			sendMessage();
			return false;
		}
	}
	up.addEventListener('click', moveUp);
	down.addEventListener('click', moveDown);
	left.addEventListener('click', moveLeft);
	right.addEventListener('click', moveRight);
	attack.addEventListener('click', attackEnemy);
	
	setInterval(healPlayer,1000);
}

window.onbeforeunload = onClose;
window.onload = init;