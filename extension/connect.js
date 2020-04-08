//This file handles the initial connection to the server, and some logging

console.log("connect.js is here")

const serverLocation = "http://localhost:8787"

//Some global variables
var allowControl, socket, hash, connected = false, controller = null

if (location.hash) {

	hash = location.hash.substring(1)
	console.log("Hash:", hash)
	joinRoom(hash)

}

/* else
	waitForPlayer().then(() => startRoom(true, getPlayerState())) */


function joinRoom(hash) {

	socket = io.connect(serverLocation);
	setupLogging()

	//Join room
	socket.on("connect", () => {
		socket.emit("join", hash)
	})

	socket.on("disconnect", onDisconnect)

	//start app after we joined
	socket.on("joined", (members, controller, state) => {

		connected = true

		//app.js
		if (members) {
			setPlayerState(state)
			connectedToRoom(socket, controller, state)
		}

		//Empty room
		else {
			console.error("Failed to join", hash)
			location.hash = ""
		}

		//Inform the background/popup of the connection and hash
		chrome.runtime.sendMessage({message: "status", connected, hash: null})

	})

}

function startRoom(allowControl_, playerstate) {

	allowControl = allowControl_

	socket = io.connect(serverLocation);
	setupLogging()

	socket.on("connect", () => {
		socket.emit("create", allowControl, playerstate)
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
		chrome.runtime.sendMessage({message: "status", connected, hash: null})

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
	socket.on("member_join", (id, count) => {
		console.group("Member joined")
		console.log("ID:", id)
		console.log("Total members:", count)
		console.groupEnd()
	})

	//Other user left room
	socket.on("member_leave", (id, count) => {
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
}
