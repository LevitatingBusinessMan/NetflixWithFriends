//Pretty much just handles opening the popup and storage

//popup
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

//storage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.message) {
		case "get_nick":
			chrome.storage.sync.get(['nickname'], result => {
				sendResponse({nick: result.nickname})
				console.log(result.nickname)
			})

			//https://stackoverflow.com/a/56483156/8935250
			return true

			break
		case "set_nick":
			chrome.storage.sync.set({nickname: request.nick})
	}
})
