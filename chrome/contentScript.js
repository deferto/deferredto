
// TODO Test it! 
// TODO add width, height styles injection and clean up

chrome.runtime.sendMessage({action: "init"})

var imgs;
var imgsLength;

function initImages() {
  imgs = document.getElementsByTagName("img");
  imgsLength = imgs.length;
  console.log("imgsLength: " + imgsLength);
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
      var src = img.src;
      img.src = "";
      chrome.runtime.sendMessage({action: "unblock"}, function() {
        img.src = src;
      });
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
  updateImages();
  installDeferredLoading();
  installPreloaders();
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);

window.onload = function () {
  chrome.runtime.sendMessage({action: "unblock"});
};

