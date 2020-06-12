//Handles injecting and manipulating the chat.

//Fetch the HTML and inject it
function injectChat() {
	fetch(chrome.extension.getURL('/inject/chat.html'))
	.then(data => data.text())
	.then(body => {
		const chatDiv = document.createElement("div")
		chatDiv.innerHTML = body
		chatDiv.id = "chat"
		
		if (window.location.hostname == "www.netflix.com") {
			document.getElementsByClassName("AkiraPlayer")[0].appendChild(chatDiv)
		}

		if (window.location.hostname == "www.youtube.com") {
			document.querySelector("#container.ytd-player").style.position = "absolute"
			document.getElementById("ytd-player").appendChild(chatDiv)
		}

		document.getElementById("usernameInput").placeholder = nick
		document.getElementById("shareURL").value = location.origin + location.pathname + location.search + "#" + hash

		document.getElementById("shareURL").onclick = function() {
			this.select()
			document.execCommand('copy')
			window.getSelection().removeAllRanges()
		}

		let lastMove = new Date()
		let visible = true
		document.body.onmousemove = () => {
			if (visible)
				lastMove = new Date()
			else {
				visible = true
/* 				chatDiv.classList.toggle("hidden_") */
			}
		}

/* 		setInterval(() => {
			if (visible) {
				if (lastMove.getTime() + 3000 < new Date().getTime()) {
					visible = false
					chatDiv.classList.toggle("hidden_")
				}
			}
		}, 100) */

		console.log("Injected chat")

		//Start listening for socket events
		startListening()

		createEventMessage("Joined room")

	})

}

function deleteChat() {
	if (document.getElementById("chat"))
		document.getElementById("chat").remove()
}

function startListening() {

	// listen for enter button
	document.getElementById("chatInput").onkeydown = (e) => {
		e = e || window.event
		var keyCode = e.keyCode || e.which
		if(keyCode==13) {
			sendChatMessage()
		}
	}

	document.getElementById("sendButton").onclick = sendChatMessage
	document.getElementById("usernameButton").onclick = changeNickname

	document.getElementById("syncButton").onclick = syncButtonPressed

	socket.on("chat_message", createChatMessage)

	socket.on("member_join", (id, nick, members) => {
		createEventMessage("joined the room", nick, id)
	})

	socket.on("member_leave", (id, nick, members) => {
		createEventMessage("left the room", nick, id)
	})

	socket.on("pause", (id, nick) => createEventMessage("paused", nick, id))

	socket.on("play", (id, nick) => createEventMessage("resumed", nick, id))

	socket.on("seek", (time, id, nick) => createEventMessage(`jumped to ${convertTime(time)}`, nick, id))

	socket.on("nick_change", nickChange)

}

function convertTime(time) {
	time = Math.round(time)
	const d = new Date(time*1000)

	if (d.getHours() > 1)
		return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
	else
		return `${d.getUTCMinutes()}:${d.getUTCSeconds()}`
}

function changeNickname() {
	const input = document.getElementById("usernameInput")
	const nickname = input.value

	if (!nickname) nickname = "Guest"

	input.placeholder = nickname
	input.value = ""
	nick = nickname

	socket.emit("change_nickname", nickname)
	chrome.runtime.sendMessage({message: "set_nick", nick: nickname})

}

function createEventMessage(msg, nick, id) {

	const chatUl = document.getElementById("messageList")
	const li = document.createElement("li")
	const content =  document.createElement("span")
	
	li.classList.add("event")
	
	if (id)
		li.classList.add(id)

	content.innerHTML = msg

	if (nick) {
		const nickSpan =  document.createElement("span")
		nickSpan.innerHTML = nick
		li.appendChild(nickSpan)
	}

	li.appendChild(content)

	chatUl.appendChild(li)
}

const availableNameColors = [
	"ff0000",
	"3385ff",
	"00cc99",
	"ff9933",
	"009900",
	"cc00cc",
	"6666ff",
	"ffff4d",
	"1affc6"
]
let nameColorIndex = Math.floor( Math.random() * availableNameColors.length);

// All users' colors
const nameColors = {}

//Add chat message to the chat
function createChatMessage(id, nickname, message) {
	
	if (!nameColors[id]) {

		nameColorIndex++

		if (nameColorIndex >= availableNameColors.length)
			nameColorIndex = 0;

		nameColors[id] = availableNameColors[nameColorIndex]
	}

	const chatUl = document.getElementById("messageList")
	const msg = document.createElement("li")

	const title = document.createElement("span")
	const content = document.createElement("span")
	
	msg.classList.add("message")
	title.classList.add("title")
	content.classList.add("content")

	title.style.color = "#" + nameColors[id]

	msg.classList.add(id)

	title.innerHTML = nickname
	content.innerHTML = message

	msg.appendChild(title)
	msg.appendChild(content)

	chatUl.appendChild(msg)

}

function sendChatMessage() {

	const input = document.getElementById("chatInput")
	const message = input.value
	input.value = ""
	
	socket.emit("chat_message", message)

}

function nickChange(id, old, new_) {
	createEventMessage(`changed his name to ${new_}`, old, id)
}

function showTimeDiff(ping, timediff) {
	if (document.getElementById("timediff"))
		document.getElementById("timediff").innerHTML = parseFloat(timediff).toFixed(1) + "s";
	if (document.getElementById("ping"))
		document.getElementById("ping").innerHTML = Math.round(parseInt(ping)) + "ms";
}

function syncButtonPressed() {

	//app.js might not be loaded yet
	if (syncUp) {
		syncUp()
	}

}
