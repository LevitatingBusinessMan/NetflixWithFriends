//Handles injecting and manipulating the chat.

//Fetch the HTML and inject it
function injectChat() {
	fetch(chrome.extension.getURL('/chat.html'))
	.then(data => data.text())
	.then(body => {
		const chatDiv = document.createElement("div")
		chatDiv.innerHTML = body
		chatDiv.id = "chat"
		
		document.body.appendChild(chatDiv)

		document.getElementById("usernameInput").placeholder = nick

		let lastMove = new Date()
		let visible = true
		document.body.onmousemove = () => {
			if (visible)
				lastMove = new Date()
			else {
				visible = true
				chatDiv.classList.toggle("hidden")
			}
		}

		setInterval(() => {
			if (visible) {
				if (lastMove.getTime() + 3000 < new Date().getTime()) {
					visible = false
					chatDiv.classList.toggle("hidden")
				}
			}
		}, 100)

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
	document.getElementById("sendButton").onclick = sendChatMessage
	document.getElementById("usernameButton").onclick = changeNickname

	socket.on("chat_message", createChatMessage)

	socket.on("member_join", (id, count) => {
		createEventMessage("joined the room", nick, id)
	})

	socket.on("member_leave", (id, count) => {
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

//Add chat message to the chat
function createChatMessage(id, nickname, message) {
	
	const chatUl = document.getElementById("messageList")
	const msg = document.createElement("li")

	const title = document.createElement("span")
	const content = document.createElement("span")
	
	msg.classList.add("message")
	title.classList.add("title")
	content.classList.add("content")

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
