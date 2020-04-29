const io = require("socket.io")()
const port = 8080

const rooms = {}
let users = 0

io.on("connection", client => {

	users++

	//Room create
	client.on("create", (nick, allowControl, state, videoID) => {

		console.log("Create: ", videoID);

		const hash = Math.random().toString(36).substring(7)
		
		client.shortId = client.id.substr(0,5)

		if (nick)
			client.nick = nick
		else client.nick = "Guest"

		//Join client
		client.join(hash)
		client.room = hash

		rooms[hash] = {controller: null}

		rooms[hash].videoID = videoID;

		rooms[hash].state = state

		//Identify this client as controller
		if (!allowControl) {
			client.controller = true
			rooms[hash].controller = client.id
		}

		client.emit("created", hash)

		listen()

		writeStatus()

	})

	//Client wants to join room
	client.on("join", (nick, hash, videoID) => {
		//Check if room exists
		if (!io.sockets.adapter.rooms[hash])
			return client.emit("joined", null)
		
		//Check if room was for this videoID
		if (rooms[hash].videoID != videoID)
			return client.emit("joined", null)


		client.shortId = client.id.substr(0,5)

		if (nick)
			client.nick = nick
		else client.nick = "Guest"

		//Join client
		client.join(hash)
		client.room = hash

		const members = Object.keys(io.sockets.adapter.rooms[hash].sockets).length
		
		//Get controller of room if set
		const controller = rooms[hash].controller
		const state = rooms[hash].state

		//Tell client
		client.emit("joined", members, controller, state)

		//Tell all other clients
		client.broadcast.to(hash).emit("member_join", client.id, nick, members)

		listen()

		writeStatus()
					
	})

	function listen() {

		client.on("pause", () => {

			rooms[client.room].state.paused = true
			io.to(client.room).emit("pause", client.shortId, client.nick)
		
		})
	
		client.on("play", () => {
	
			rooms[client.room].state.paused = false
			io.to(client.room).emit("play", client.shortId, client.nick)
	
		})
		
		client.on("seek", newTime => {
	
			rooms[client.room].state.time = newTime
			io.to(client.room).emit("seek", newTime, client.shortId, client.nick)
	
		})
	
		client.on("chat_message", msg => {
	
			io.to(client.room).emit("chat_message", client.shortId, client.nick, msg)
		
		})
	
		client.on("change_nickname", nickname => {
	
			io.to(client.room).emit("nick_change", client.shortId, client.nick, nickname)
			client.nick = nickname
	
		})
	
		client.on("beat", () => client.emit("beat", rooms[client.room].state))

	}

	client.on("disconnect", () => {

		users--

		//If client was in a room, tell room
		if (client.room) {

			//Extra check if room exists
			if (io.sockets.adapter.rooms[client.room]) {
				const members = Object.keys(io.sockets.adapter.rooms[client.room].sockets).length
				io.to(client.room).emit("member_leave", client.id, client.nick, members)
			}
			
			//Check if we dont have a ghost room in our own object
			else if (rooms[client.room]) {
				delete rooms[client.room]
			}

		}

		writeStatus()

	})

})

//Increase duration every second
setInterval(() => {

	for (hash in rooms) {
		const room = rooms[hash]
		
		if(!room.state.paused)
			room.state.time++
	}

}, 1000)

io.listen(port)
console.log("Signaling server on", port)

writeStatus(true)

function writeStatus(init) {
	
/* 	//For pm2
	if (!process.stdout.moveCursor)
		return

	if (!init) {
		process.stdout.moveCursor(0, -2)
		process.stdout.clearScreenDown()
	}
	
	console.log("Rooms:", Object.keys(rooms).length)
	console.log("Users:", users) */

}
