
// TODO make update call smart 
// by applying difference
// with 50% propabylity, try to keep server simple

// TODO remove debug messages


if(!!!window.frameElement) {

self.imgsInfo = false;

function sizeEmptyImg($img, imgInfo) {
    if(!imgInfo) {
        console.warning("Could not sizeEmptyImg: !imgInfo");
        return;
    }
    var width = $img.attr("width");
    var height = $img.attr("height");
    if(width && height) {
        return;
    } else if(!width && !height) {
        $src.attr("width", imgInfo.width);
        $src.attr("height", imgInfo.height);
    } else if(width) { // && !height
        if(imgInfo.width != 0) {
            height = height * imgInfo.height / imgInfo.width; 
            $src.attr("height", imgInfo.height);
        }
    } else { // height && !width
        if(imgInfo.height != 0) {
            width = width * imgInfo.width / imgInfo.height; 
            $src.attr("width", imgInfo.width);
        }
    }
}

var images = {};
var imagesByNames = {};

window.addEventListener("DOMContentLoaded", function() {
    var gotUrlInfoBeforeBeforeReady = !!self.imgsInfo;
    var imageNum = 0;
    
    $("img").each(function() {
      $img = $(this);
      var src = $img.attr("src");
      if(src) {
          src = src.split("#")[0];
      }
      if(src && src != "" && "data" != src.slice(0, 4)) {
       $img.data("deferredto-src", src);
       images[$img] = 1;
       var imageName = "imgCallback" + imageNum++;
       imagesByNames[imageName] = $img;
       self.port.emit("checkCache", src, imageName);
       $img.addClass("deferredto-lazy")
       $img.attr("src", "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==");
      }
    });

    $(".deferredto-lazy").lazyload({ threshold : 200, data_attribute: "deferredto-src"});
});


function deferredtoOnloadedAll() {
 if(imgsInfo) {
     return;
 }
 var obj = {};
 $("img").each(function() {
  var src = this.src;
  if(src) {
    src = src.split("#")[0];
  }
  if(src && src != "" && "data" != src.slice(0, 4)) {
    obj[src] = {width: this.width, height: this.height};
  }
 });
 self.port.emit("update", window.location.href.split("#")[0], JSON.stringify(obj));
}

self.port.on("response", function (info) {
    info = JSON.parse(info);
    self.imgsInfo = info;
    $.each(images, function($img, value) {    
        if(value == 2) {
            var imgInfo = info[$img.data("deferredto-src")];
            sizeEmptyImg($img, imgInfo);
        }
        /** 
         * else no cache info about this image yet,
         * cache callbacks do resizing or image src restoration
         */
    });
});

self.port.on("onCacheEntryAvailable", function(src, imageName) {
    $img = imagesByNames[imageName];
    $img.attr("src", $img.data('deferredto-src'));
    delete images[$img];
});

self.port.on("onCacheEntryDoomed", function(src, imageName) {
    $img = imagesByNames[imageName];
    if(self.imgsInfo) {
        var imgInfo = info[$img.data("deferredto-src")];
        sizeEmptyImg($img, imgInfo);
    } else {
        /* mark to resize on response with urlInfo */
        images[$img] = 2;
    }
});

/**
 * This is callback because main.js needs to install listeners before
 * we provide url
 */
self.port.on("getUrl", function () {
    self.port.emit("request", window.location.href.split("#")[0]);
});

} //end if not frame
