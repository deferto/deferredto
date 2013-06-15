

/**
 * List of blocked image urls (without#)
 */
var blocked = [];
var unblocked = [];
var blockedTabs = [];

function preload(url) {
  console.log("preload: " + url + " (fake)");
  return;

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

// function unblock(url) {
//     console.log("in unblock: " + url + ", " + unblocked.length);
//     unblocked.push(url);

//     var urlIndex = blocked.indexOf(url);
//     if (urlIndex >= 0) {
//       blocked.splice(urlIndex, 1);
//     }
// }

function tabInit(tab) {
  var tabIndex = blockedTabs.indexOf(tab.id);
  if (tabIndex == -1) {
    blockedTabs.push(tab.id);
    console.log("tabInit: " + JSON.stringify(blockedTabs));
  }
}

function tabUnblock(tab) {
  var tabIndex = blockedTabs.indexOf(tab.id);
  if (tabIndex != -1) {
    blockedTabs.splice(tabIndex, 1);
    console.log("tabUnblock: " + JSON.stringify(blockedTabs));
  }
}

function dispather(request, sender, sendResponse) {
  console.log("in dispather");
  if (!request.action) {
    console.log("!request.action");
    return;  
  }

  if (!sender.tab || sender.tab.id == -1) {
    // just skip
    return;  
  }

  if("preload" == request.action) {
    preload(request.url);
  } else if("unblock" == request.action) {
    tabUnblock(sender.tab);
  } else if ("init" == request.action) {
    tabInit(sender.tab);
  }
}


function requestBlocker(details) {
    if (
      details.method != "GET" || 
      details.tabId == -1 || 
      details.type != "image") {
        // console.log("skip in requestBlocker "+ JSON.stringify(details));

        return {cancel: false};
    }
    var result = {cancel: blockedTabs.indexOf(details.tabId) != -1};
    console.log("block in requestBlocker " + JSON.stringify(result));
    return result;
}

chrome.runtime.onMessage.addListener(dispather);

chrome.webRequest.onBeforeRequest.addListener(
  requestBlocker,
  {urls: ["<all_urls>"]},
  ["blocking"]);

console.log("DeferredTo background.js initialized.")

