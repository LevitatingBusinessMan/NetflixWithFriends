function injectChat() {
	const chatDiv = document.createElement("DIV")
	chatDiv.innerHTML = 
	`
	<ul id="chat">
	</ul>
	<input id="input" placeholder="Write message"/>
	<button id="sendButton">SEND</button>
	`
	
	document.getElementsByClassName("AkiraPlayer")[0].appendChild(chatDiv)
}
