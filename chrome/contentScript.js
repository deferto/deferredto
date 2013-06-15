
// TODO Test it! 
// TODO add width, height styles injection and clean up

chrome.runtime.sendMessage({action: "init"})

var imgs;
var imgsLength;

function log(message) {
  chrome.runtime.sendMessage({action: "log", "message": message});
}

function imgOnload(e) {
  log("imgOnload " + this.src);
}

function imgOnerror(e) {
  log("imgOnload "+ this.src);
}

function initImages() {
  imgs = Array.prototype.slice.call(document.getElementsByTagName("img"));
  imgsLength = imgs.length;
  for (var i = imgs.length - 1; i >= 0; i--) {
    var img = imgs[i];
    img.setAttribute("data-src", img.src);
    img.onload = imgOnload;
    img.onerror = imgOnerror;
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  };
  log("imgsLength: " + imgsLength);
}

function inViewport(img) {
  var rect = img.getBoundingClientRect();
  return !(rect.top > window.scrollY + window.innerHeight || rect.top + rect.height < window.scrollY);
}

function removeDeferredImg(index) {
  if(index >= imgsLength || index < 0) {
    throw "IndexOutOfBounds: " + index + ", imgsLength: " + imgsLength;
  }
  imgs[index] = imgs[imgsLength-1];
  imgs[imgsLength-1] = null;
  imgsLength--;
}

function updateImages() {
  for (var i = imgsLength - 1; i >= 0; i--) {
    var img = imgs[i];
    if (inViewport(img)) {
      log("reloading " + img.getAttribute("data-src"));
      img.src = img.getAttribute("data-src");
      removeDeferredImg(i);
    }
  };
}

function installDeferredLoading() {
  window.addEventListener("resize", updateImages);
  document.addEventListener("scroll", updateImages);
}

/**
 * Preloading page DeferredTo metadata with onmouseover the anchor
 */

function preload(url) {
  chrome.runtime.sendMessage({action: "preload", "url": url});
}

function preloadLink (link) {
  // with #
  preload(link.href);
}

function preloadForm (form) {
  // with #
  // TODO get full url
  preload(form.action);
}

function installPreloaders() {
  console.error("skipping installPreloaders");
  return;
  var links = document.getElementsByTagName("a");
  for (var i = links.length - 1; i >= 0; i--) {
    links[i].addEventListener("mouseover", preloadLink);
  };
  var forms = document.getElementsByTagName("form");
  for (var i = forms.length - 1; i >= 0; i--) {
    forms[i].addEventListener("mouseover", preloadForm);
  };
}

function onDOMContentLoaded() {
  initImages();
  log("onDOMContentLoaded");
  chrome.runtime.sendMessage({action: "unblock"}, function () {
    log("after content script unblock");
    updateImages();
    installDeferredLoading();
  });
  installPreloaders();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);

window.onload = function () {
  chrome.runtime.sendMessage({action: "unblock"});
};

log("Content script loaded.")

