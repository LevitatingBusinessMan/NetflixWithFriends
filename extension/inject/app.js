//This file handles most player related stuff

console.log("app.js is here")

//We cant set this var immediately because the player
//doesnt exist till a few seconds after the page loads
var player = document.getElementsByTagName("video")[0] || null

/*
When another client pauses, then this client pauses.
To prevent this client from then also shooting a pause event,
we have an integer called actions. Whenever the client receives an action it's incremented by 1
when the client does this actions its decremented by 1
We only start shooting events when it's at 0
*/
var actions = 0

var ping = 0

async function connectedToRoom(socket, controller) {

	//Create chat
	//if (window.location.hostname == "www.netflix.com")
		injectChat()

	if (!player)
		await waitForPlayer()
	

	player.onpause = () => {
		if (actions < 1)
			socket.emit("pause")
		else actions--
	}

	player.onplay = () => {

		//Make sure video didnt change
		if (getVideoID() != videoID)
			socket.disconnect()

		if (actions < 1)
			socket.emit("play")
		else actions--

	}

	player.onseeked = () => {
		if (actions < 1) 
			socket.emit("seek", player.currentTime)
		else actions--
	}
	
	//player.onwaiting = () => socket.emit("buffer")

	const myID = socket.id.substr(0,5)
	
	socket.on("pause", shortID => {
		if (shortID == myID)
			return
		actions++; player.pause()
	})

	socket.on("play", shortID => {
		if (shortID == myID)
			return
		actions++; player.play()
	})

	socket.on("seek", (time, shortID) => {
		if (shortID == myID)
			return
		actions++; player.currentTime = time
	})


	let lastSendBeat

	//Heartbeat
	setInterval(() => {
		lastSendBeat = new Date()
		socket.emit("beat")
	}, 2000)

	socket.on("beat", state => {
		ping = new Date() - lastSendBeat
		//console.log("Ping:", ping)

		const timediff = player.currentTime - state.time
		//console.log("Offset:", timediff)
	})

}

function getPlayerState() {

	if (!player) player = document.getElementsByTagName("video")[0]

	return {
		time: player.currentTime,
		paused: player.paused,
	} 
}

function setPlayerState(state) {
	actions++
	player.currentTime = state.time
	
	if (state.paused != player.paused) {
		actions++
		if (state.paused)
			player.pause()
		else player.play()
	}

}

function waitForPlayer() {
	return new Promise((resolve, reject) => {

		//First we check if there isnt already a player on the page
		if (player) return resolve(player)
		else {
			player = document.getElementsByTagName("video")[0]
			if (player) return resolve(player)
		}

		console.log("Waiting for player")
		const observer = new MutationObserver((mutationsList, observer) => {
			for(let mutation of mutationsList) {
				if (mutation.target.className = "sizing-wrapper"&& mutation.removedNodes.length) {
					if (mutation.removedNodes[0].className == "nfp AkiraPlayer") {
						console.log("Found player!")
						observer.disconnect()
						player = document.getElementsByTagName("video")[0]
						resolve(player)
						break
					}
				}
			}
		})
		observer.observe(document.body, {attributes: false, childList: true, subtree: true});
	})
}
