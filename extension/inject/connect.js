//This file handles the initial connection to the server, and some logging

console.log("connect.js is here")

const serverLocation = "https://syncer.reinfernhout.xyz"

//Some global variables
var socket, hash, connected = false, controller = null, nick = "Guest", others = {}

//Request nickname from localstorage
chrome.runtime.sendMessage({message: "get_nick"}, response => {
	if (response.nick) {
		nick = response.nick
		console.log("Found nick:", nick)
	}

	//After storage stuff is gained, login
	if (location.hash) {

		hash = location.hash.substring(1)
		console.log("Hash:", hash)
		joinRoom(nick, hash)
	
	}

})

/* else
	waitForPlayer().then(() => startRoom(true, getPlayerState())) */


function joinRoom(nick , hash) {

	console.log("Conneting...")

	socket = io.connect(serverLocation);
	setupLogging()

	//Join room
	socket.on("connect", () => {
		console.log("Connected")
		socket.emit("join", nick, hash)
	})

	socket.on("disconnect", onDisconnect)

	//start app after we joined
	socket.on("joined", (members, controller, state) => {

		//app.js
		if (members) {
			connected = true
			setPlayerState(state)
			connectedToRoom(socket, controller, state)
			//Inform the background/popup of the connection and hash
			chrome.runtime.sendMessage({message: "status", connected, hash})
		}

		//Empty room
		else {
			console.log("Failed to join", hash)
			if (location.hostname != "www.youtube.com")
				location.hash = ""
			socket.disconnect()
		}

	})

}

function startRoom(allowControl_, playerstate) {

	allowControl = allowControl_

	console.log("Conneting...")

	socket = io.connect(serverLocation);
	setupLogging()

	socket.on("connect", () => {
		console.log("Connected")
		socket.emit("create", nick, allowControl, playerstate)
	})

	socket.on("disconnect", onDisconnect)

	//Created room, set hash in url, start app
	socket.on("created", hash_ => {
		
		hash = hash_

		connected = true

		console.log("Share:", `${location.href}#${hash}`)
		
		//Youtube will reload if you change the hash
		if (location.hostname != "www.youtube.com")
			location.hash = hash

		//Inform the background/popup of the connection and hash
		chrome.runtime.sendMessage({message: "status", connected, hash})

		//app.js
		connectedToRoom(socket, controller, null)

	})

}

function setupLogging() {

	//Joined room
	socket.on("joined", (members, controller, state) => {
		if (members) {
			console.group("Joined room")
			console.log("Hash:", hash)
			console.log("Members:", members)
			console.log("controller:", controller)
			console.log("state:", state)
			console.groupEnd()
		}			
	})

	//Created room
	socket.on("created", hash => {
		console.group("Created room")
		console.log("Hash:", hash)
		console.log("AllowControl:", allowControl)
		console.groupEnd()
	})

	//Other user joined room
	socket.on("member_join", (id, nick, count) => {
		console.group("Member joined")
		console.log("ID:", id)
		console.log("Total members:", count)
		console.groupEnd()
	})

	//Other user left room
	socket.on("member_leave", (id, nick, count) => {
		console.group("Member left")
		console.log("ID:", id)
		console.log("Total members:", count)
		console.groupEnd()
	})

}

//When socket disconnects
function onDisconnect () {

	console.log("Disconnected")

	connected = false
	socket = null
	chrome.runtime.sendMessage({message: "status", connected: false, hash})

	//chat.js
	deleteChat()

}
