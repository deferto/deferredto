
if (chrome && chrome.webRequest) {
	// google chrome
	function sendEvent(action, params, sendResponse) {
		if (!params) {
			params = {"action": action};
		} else {
			params["action"] = action;
		}
		chrome.runtime.sendMessage(params, sendResponse);
	}

	function installEventHandler(action, eventHandler) {
	}

} else {
	//firefox

	var   = {};

	function sendEvent(action, params, sendResponse) {
		actionResponses[action] = sendResponse;
		self.port.on(action + "_response", sendResponse);
		self.port.emit(action, params);

	}

	function installEventHandler(action, eventHandler) {
		self.port.on(action, function(params) {
			var result = eventHandler(params);
			self.port.emit(action + "_response", result);
		});
	}
}