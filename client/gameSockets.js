"use strict";

var canvas;
var ctx;
var socket;
var chat, send, message;
var combatLog;
var player;
var up, down, left, right, attack;

function updateMap(data){

}

function drawMap(data){

}

function updateCombatLog(data){
	combatLog.innerHTML += ("\n" + data.msg);
}

function updateChatLog(data){
	console.log("msg:" + data.msg);
	chat.innerHTML += ("\n" + data.name + ": " + data.msg);
}

function sendMessage(){
	console.log(message.value);
	socket.emit('msgToServer', {msg:message.value});
}

function move(){
	
}

function attack(){
	
}

function onClose()
{
	socket.emit('close', {name: player.name});
	socket.onclose = function(){};
	socket.close();
}

function init() {
	canvas = document.querySelector("#canvas");
	ctx = canvas.getContext("2d");
	chat = document.querySelector("#chat");
	combatLog = document.querySelector("#combatLog");
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
		defense: player.dataset.defense
	}
	
	console.log(player);
	
	socket = io.connect();
	socket.on('connect', function () {
		socket.emit('join', {name: player.name});
	});

	send.addEventListener('click', sendMessage);
	up.addEventListener('click', move);
	down.addEventListener('click', move);
	left.addEventListener('click', move);
	right.addEventListener('click', move);
	attack.addEventListener('click', attack);
	
	socket.on('draw', drawMap);
	socket.on('getMap', updateMap);
	socket.on('attackReceived', updateCombatLog);
	socket.on('msg', updateChatLog);
}

window.onbeforeunload = onClose;
window.onload = init;