

/**
 * List of blocked image urls (without#)
 */
var blocked = [];
var unblocked = [];
var blockedTabs = {};

function preload(request) {
  var url = request.preload;
  return;
  console.log("preload: " + url);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://www.deferredto.com/?url" + encodeURIComponent(url), true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      console.log("preload xhr.responseText=" + xhr.responseText);
      var resp = JSON.parse(xhr.responseText);
      // TODO add some images to block list
    }
  }
  xhr.send();
}

function tabInit(request, sender) {
  var tabBlocker = blockedTabs[sender.tab.id];
  if (tabBlocker) {
    var tabBlocker = function(details) {
      console.log("block " + details.tabId + " " + details.url);
      return {cancel: true};
    };
    chrome.webRequest.onBeforeRequest.addListener(
      tabBlocker,
      {urls: ["http://*/*"], types: ["image"]},
      ["blocking"]);
    blockedTabs[sender.tab.id] = tabBlocker;

    console.log("tabInit: " + JSON.stringify(blockedTabs));
  }
}

function tabUnblock(request, sender) {
  var tabBlocker = blockedTabs[sender.tab.id];
  if (tabBlocker) {
    delete blockedTabs[sender.tab.id];
    chrome.webRequest.onBeforeRequest.removeListener(tabBlocker);
    console.log("tabUnblock: " + JSON.stringify(blockedTabs));
  }
}

function logMain(request, sender) {
  console.log(sender.tab.id, request.message);
}

var actions = {
  "preload": preload,
  "unblock": tabUnblock,
  "init": tabInit
};

function dispather(request, sender, sendResponse) {
  if (!request.action) {
    console.log("dispather !request.action");
    return;  
  }

  if (!sender.tab || sender.tab.id == -1) {
    // just skip
    return;  
  }

  var response;
  if ("log" == request.action) {
    logMain(request, sender);
  } else {
    console.log("dispather " + request.action);
    var action = actions[request.action];
    if (action) {
      response = action(request, sender);
    } else {
      var message = "Unknown dispather action: " + request.action;
      console.error(message);
      throw message;
    }
  }

  sendResponse(response);
}

chrome.runtime.onMessage.addListener(dispather);

console.log("DeferredTo background.js initialized.")

