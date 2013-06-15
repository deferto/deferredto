// This is an active module of the Kaigorodov (1) Add-on
exports.main = function() {};

var self = require("sdk/self");
var pageMod = require("sdk/page-mod");
var {Cc, Ci, Cu} = require("chrome");

const nsICacheService = Ci.nsICacheService;
const nsICache = Ci.nsICache;
var cacheService = Cc["@mozilla.org/network/cache-service;1"].getService(nsICacheService);

/**
 * see https://github.com/mozilla/releases-comm-central/blob/fd5141a15c3421ed0d5507683ba686bc814f4abf/suite/browser/metadata.js
 */
function installCacheListenersForImages(worker, url, $img) {
    var cacheListener = {
        onCacheEntryAvailable: function onCacheEntryAvailable(descriptor) {
            worker.port.emit("onCacheEntryAvailable", url, $img);
        },
        onCacheEntryDoomed: function(nsResult) {
            if(nsResult == Cu.NS_ERROR_NOT_AVAILABLE) {
                worker.port.emit("onCacheEntryDoomed", url, $img);
            }
        }
    };
    
    var httpCacheSession = cacheService.createSession("HTTP", nsICache.STORE_ANYWHERE, true);
    httpCacheSession.doomEntriesIfExpired = false;
    httpCacheSession.asyncOpenCacheEntry(url, nsICache.ACCESS_READ, cacheListener);
}    

//var tools = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools);
//var cache = tools.getImgCacheForDocument(relevantDocument);

function gotUrlInfo(response, worker, url) {
    if(response.status != 200) {
        console.warning("Could not get info for URL: " + url);
        worker.port.emit("noresponse");
        return;
    }
    var reply = response.text;

    if(reply != "") {
        worker.port.emit("response", response.text)
    } else {
        worker.port.emit("noresponse")
    }
}

pageMod.PageMod({
    include: /^http.*/,
    contentScriptFile: [self.data.url('jquery.js'), self.data.url('lazyload.js'), self.data.url('contentScript.js')],
    contentScriptWhen: "start",
    onAttach: function (worker) {
        worker.port.on("request", function (url) {
            var requestUrl = "http://www.deferredto.com/url?url=" + encodeURIComponent(url);
            require("sdk/request").Request({
                "url": requestUrl,
                onComplete: function (response) {
                    gotUrlInfo (response, worker, url);
                }
            }).get();        
        });
        worker.port.on("update", function(url, json) {
            console.info("update " + url + "; json: " + json);
            var requestUrl = "http://www.deferredto.com/update";
            require("sdk/request").Request({
                url: requestUrl,
                content: {
                    url: url,
                    info: json
                },
                onComplete: function (response) {
                    gotUrlInfo (response, worker, url);
                }
            }).post();        
        });
        worker.port.on("checkCache", function(url, $img) {
            installCacheListenersForImages(worker, url, $img)
        });
        worker.port.emit("getUrl");
    }
});

  
