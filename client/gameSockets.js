"use strict";

var canvas;
var ctx;
var socket;
var chat, send, message;
var combatLog;
var player;
var up, down, left, right, attack;
var gameMap;

function updateMap(data){
	gameMap = data.gameMap;
	drawMap();
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
	combatLog.innerHTML += ("\n" + data.msg);
}

function updateChatLog(data){
	chat.innerHTML += ("\n" + data.name + ": " + data.msg);
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
		player.location = gameMap[player.location].up;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");		
		socket.emit('changeRoom', {room: player.location});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;	
}

function moveDown(){
	if(gameMap[player.location].down == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		player.location = gameMap[player.location].down;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");		
		socket.emit('changeRoom', {room: player.location});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function moveLeft(){
	if(gameMap[player.location].left == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		player.location = gameMap[player.location].left;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");
		socket.emit('changeRoom', {room: player.location});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function moveRight(){
	if(gameMap[player.location].right == null)
		combatLog.innerHTML += ("There is no room in that direction! \n");
	else
	{
		player.location = gameMap[player.location].right;
		combatLog.innerHTML += ("You've moved to " + player.location + "\n");
		socket.emit('changeRoom', {room: player.location});	
	}
	combatLog.scrollTop = combatLog.scrollHeight;
}

function attack(){
	
}

function onClose()
{
	socket.emit('close', {player: player});
	socket.onclose = function(){};
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
	
	console.log(player);
	
	player = {
		name: player.dataset.name,
		level: player.dataset.level,
		exp: player.dataset.exp,
		health: player.dataset.health,
		damage: player.dataset.damage,
		defense: player.dataset.defense,
		location: player.dataset.location
	}
	
	console.log(player);
	
	socket = io.connect();
	
	socket.on('draw', drawMap);
	socket.on('getMap', updateMap);
	socket.on('attackReceived', updateCombatLog);
	socket.on('msg', updateChatLog);
	
	socket.on('connect', function () {
		socket.emit('join', {name: player.name});
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
	attack.addEventListener('click', attack);
}

window.onbeforeunload = onClose;
window.onload = init;