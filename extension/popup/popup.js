
// Ask for current state
sendMessage({message: "open"}, response => {
	console.log(response);
	if (response.message == "status") {
		
		if (startButton.disabled)
			startButton.disabled = false

		if (response.connected) {
			url.value = sender.url + "#" + response.hash
			connectedDiv.style.display = "block"
			notConnectedDiv.style.display = "none"
		} else {
			notConnectedDiv.style.display = "block"
			connectedDiv.style.display = "none"
		}

	}
})

const startButton = document.getElementById("startButton")
const disconnectButton = document.getElementById("disconnectButton")

const notConnectedDiv = document.getElementById("notconnected")
const connectedDiv = document.getElementById("connected")

const url = document.getElementById("url")

startButton.onclick = () => {
	sendMessage({"message": "startRoom"})
}

disconnectButton.onclick = () => {
	sendMessage({"message": "disconnect"})
}

/* chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

})
 */
function sendMessage(msg, callback) {
	chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
		const activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, msg, callback);
	});
}
