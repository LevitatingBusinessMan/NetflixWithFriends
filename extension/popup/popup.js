chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message == "status") {
		handleStatus(request, sender)
	}
})

// Ask for current state
sendMessage({message: "open"})

const startButton = document.getElementById("startButton")
const disconnectButton = document.getElementById("disconnectButton")

const notConnectedDiv = document.getElementById("notconnected")
const connectedDiv = document.getElementById("connected")

const url = document.getElementById("url")

function handleStatus(request, sender) {
	if (startButton.disabled)
	startButton.disabled = false

	if (request.connected) {
		url.value = sender.url + "#" + request.hash
		connectedDiv.style.display = "block"
		notConnectedDiv.style.display = "none"
	} else {
		notConnectedDiv.style.display = "block"
		connectedDiv.style.display = "none"
	}
}

startButton.onclick = () => {
	sendMessage({"message": "startRoom"})
}

disconnectButton.onclick = () => {
	sendMessage({"message": "disconnect"})
}

url.onclick = function() {
	this.select()
	document.execCommand('copy')
	window.getSelection().removeAllRanges()
}

function sendMessage(msg, callback) {
	chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
		const activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, msg, callback);
	});
}
