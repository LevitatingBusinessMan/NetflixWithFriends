//Communicates with popup.html

console.log("listener.js is here")

//Initial message may the popup be open
chrome.runtime.sendMessage({message: "status", connected, hash})

//Start room message from popup.html
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message == "startRoom") {
		console.log("Received startRoom message")
		waitForPlayer().then(() => startRoom(true, getPlayerState()))
	}

	//popup opened
	if (request.message == "open") {

		console.log("Sendig popup current connection state")
		
		chrome.runtime.sendMessage({message: "status", connected, hash})

	}

	//Disconnect button pressed
	if (request.message == "disconnect") {
		
		console.log("Disconnecting...")

		if (socket)
			socket.disconnect()
		
		//Some syncing messed up here, because popup did not realize there was no connection
		else chrome.runtime.sendMessage({message: "status", connected: false, hash})

	}

})
