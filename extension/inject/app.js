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
var timediff = 0
var lastServerState
var netflix_player

using_netflix = location.hostname == "www.netflix.com"

async function connectedToRoom(socket, controller) {

	console.log("Starting up!")

	if (!player)
		await waitForPlayer();
	
	if (using_netflix) {
		let s = document.createElement("script");
		s.src = chrome.extension.getURL("/inject/netflix_player.js");
		console.log("Injecting netflix_player script");
		(document.head||document.documentElement).appendChild(s);
	}

	//Create chat
	injectChat(player)

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
		actions++;
		if (using_netflix)
			run_code(`netflix_player.seek(${time * 1000})`)
		else player.currentTime = time
	})


	let lastSendBeat

	//Heartbeat
	setInterval(() => {
		lastSendBeat = new Date()
		socket.emit("beat")
	}, 2000)

	socket.on("beat", state => {

		lastServerState = state

		ping = (new Date() - lastSendBeat) / 2
		//console.log("Ping:", ping)

		timediff = player.currentTime - state.time
		//console.log("Offset:", timediff)

		showTimeDiff(ping, timediff)
	})

	// Immediately make sure there are stats to show
	showTimeDiff(0, 0)

}

function syncUp() {
	if (player) {
		
		newstate = lastServerState || getPlayerState()

		// The state given to use by the server is as old as the ping (in ms)
		newstate.time += ping / 1000

		setPlayerState(newstate)
	}
}

function getPlayerState() {

	if (!player) player = document.getElementsByTagName("video")[0]

	return {
		time: player.currentTime,
		paused: player.paused,
	} 
}

async function setPlayerState(state) {

	if (!player)
		await waitForPlayer()

	console.log("Setting player state")

	actions++

	//Netflix crashes with the normal api
	if (using_netflix) {
		actions++
		//This currently fails the first time because the netflix_player script isn't injected yet.
		run_code(`netflix_player.seek(${state.time * 1000})`)
	}
	else player.currentTime = state.time
	
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
						observer.disconnect()
						player = document.getElementsByTagName("video")[0]
						console.log("Found player!", player)
						resolve(player)
						break
					}
				}
			}
		})
		observer.observe(document.body, {attributes: false, childList: true, subtree: true});
	})
}

//For running code inside the main "window" of the tab
function run_code(code) {
	console.log("Running code: ",code)
	let s = document.createElement("script");
	s.innerHTML = code;
	(document.head||document.documentElement).appendChild(s);
	s.onload = function() {
		s.remove();
	};
}
