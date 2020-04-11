//Soon rewrite to not log stuff, but draft the amount of living rooms

const io = require("socket.io")()
const port = 8787

const rooms = {}

io.on("connection", client => {

	//Room create
	client.on("create", (nick, allowControl, state) => {
		const hash = Math.random().toString(36).substring(7)
		console.log("Created room", hash)
		
		client.shortId = client.id.substr(0,5)

		if (nick)
			client.nick = nick
		else client.nick = "Guest"

		//Join client
		client.join(hash)
		client.room = hash

		rooms[hash] = {controller: null}

		rooms[hash].state = state

		//console.log(rooms[hash])

		//Identify this client as controller
		if (!allowControl) {
			client.controller = true
			rooms[hash].controller = client.id
		}

		client.emit("created", hash)
	})

	//Client wants to join room
	client.on("join", (nick, hash) => {
		//Check if room exists
		if (io.sockets.adapter.rooms[hash]) {
			
			console.log("Client joined", hash)

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
		}
		
		//Room doesnt exist
		else {
			console.log("Client tried joining empty room", hash)
			client.emit("joined", null)
		}
	})

	client.on("pause", () => {
		rooms[client.room].state.paused = true

		console.log(`${client.shortId} paused (Room: ${client.room})`)

		io.to(client.room).emit("pause", client.shortId, client.nick)
	})

	client.on("play", () => {
		rooms[client.room].state.paused = false

		console.log(`${client.shortId} resumed (Room: ${client.room})`)

		io.to(client.room).emit("play", client.shortId, client.nick)
	})
	
	client.on("seek", newTime => {
		rooms[client.room].state.time = newTime

		console.log(`${client.shortId} seeked (Room: ${client.room})`)

		io.to(client.room).emit("seek", newTime, client.shortId, client.nick)
	})

	client.on("chat_message", msg => {
		console.log("Received message from", client.id)
		io.to(client.room).emit("chat_message", client.shortId, client.nick, msg)
	})

	client.on("change_nickname", nickname => {
		io.to(client.room).emit("nick_change", client.shortId, client.nick, nickname)
		client.nick = nickname
	})

	client.on("beat", () => client.emit("beat", rooms[client.room].state))

	client.on("disconnect", () => {

		//If client was in a room, tell room
		if (client.room) {

			//Extra check if room exists
			if (io.sockets.adapter.rooms[client.room]) {
				console.log("User left", client.room)
				const members = Object.keys(io.sockets.adapter.rooms[client.room].sockets).length
				io.to(client.room).emit("member_leave", client.id, client.nick, members)
			}
			
			//Check if we dont have a ghost room in our own object
			else if (rooms[client.room]) {
				delete rooms[client.room]
			}

		}

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
