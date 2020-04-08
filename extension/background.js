//Pretty much just handles opening the popup

chrome.runtime.onInstalled.addListener(() => {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
		chrome.declarativeContent.onPageChanged.addRules(
			[
				{
					conditions: [new chrome.declarativeContent.PageStateMatcher({
						pageUrl: {hostEquals: 'www.youtube.com'},
					})],
					actions: [new chrome.declarativeContent.ShowPageAction()]
				},
				{
					conditions: [new chrome.declarativeContent.PageStateMatcher({
						pageUrl: {hostEquals: 'www.netflix.com'},
					})],
					actions: [new chrome.declarativeContent.ShowPageAction()]
				}
			]
		);
	});
});
