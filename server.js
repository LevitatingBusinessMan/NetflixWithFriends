const io = require("socket.io")()
const port = 8787

const rooms = {}

io.on("connection", client => {

	//Room create
	client.on("create", (allowControl, state) => {
		const hash = Math.random().toString(36).substring(7)
		console.log("Created room", hash)
		
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
	client.on("join", hash => {
		//Check if room exists
		if (io.sockets.adapter.rooms[hash]) {
			
			console.log("Client joined", hash)

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
			client.broadcast.to(hash).emit("member_join", client.id, members)
		}
		
		//Room doesnt exist
		else {
			console.log("Client tried joining empty room", hash)
			client.emit("joined", null)
		}
	})

	client.on("pause", () => {
		rooms[client.room].state.paused = true

		console.log(`${client.id.substr(0,4)} paused (Room: ${client.room})`)

		client.broadcast.to(client.room).emit("pause")
	})

	client.on("play", () => {
		rooms[client.room].state.paused = false

		console.log(`${client.id.substr(0,4)} resumed (Room: ${client.room})`)

		client.broadcast.to(client.room).emit("play")
	})
	
	client.on("seek", newTime => {
		rooms[client.room].state.time = newTime

		console.log(`${client.id.substr(0,4)} seeked (Room: ${client.room})`)

		client.broadcast.to(client.room).emit("seek", newTime)
	})

	client.on("beat", () => client.emit("beat", rooms[client.room].state))

	client.on("disconnect", () => {

		//If client was in a room, tell room
		if (client.room) {

			//Extra check if room exists
			if (io.sockets.adapter.rooms[client.room]) {
				console.log("User left", client.room)
				const members = Object.keys(io.sockets.adapter.rooms[client.room].sockets).length
				io.to(client.room).emit("member_leave", client.id, members)
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