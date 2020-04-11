//Pretty much just handles opening the popup

chrome.runtime.onInstalled.addListener(() => {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
		chrome.declarativeContent.onPageChanged.addRules(
			[
				{
					conditions: [new chrome.declarativeContent.PageStateMatcher({
						pageUrl: {hostEquals: 'www.youtube.com', pathEquals: "/watch"},
					})],
					actions: [new chrome.declarativeContent.ShowPageAction()]
				},
				{
					conditions: [new chrome.declarativeContent.PageStateMatcher({
						pageUrl: {hostEquals: 'www.netflix.com', pathContains: "/watch"},
					})],
					actions: [new chrome.declarativeContent.ShowPageAction()]
				}
			]
		);
	});
});

/* chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message == "status") {
		if (request.connected) {
			url.value = sender.url + "#" + request.hash
			connectedDiv.style.display = "block"
			notConnectedDiv.style.display = "none"
		} else {
			notConnectedDiv.style.display = "block"
			connectedDiv.style.display = "none"
		}
	}
}) */
