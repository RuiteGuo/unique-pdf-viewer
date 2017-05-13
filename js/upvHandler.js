'use strict';

var targetURL;

function isPdfDownloadable(details) {
  return details.url.indexOf('pdfjs.action=download') >= 0;
}


chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (isPdfDownloadable(details))
      return;

    targetURL = details.url;
    var viewerPage = 'viewer.html';
    var url = chrome.extension.getURL(viewerPage) 

    console.log(url);

    return { redirectUrl: url };
  },
  {
    urls: [
      'http://*/*.pdf',
      'https://*/*.pdf',
      'file://*/*.pdf',
      'http://*/*.PDF',
      'https://*/*.PDF',
      'file://*/*.PDF'
    ],
    types: ['main_frame', 'sub_frame']
  },
  ['blocking']);


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    sendResponse({URL: targetURL});
  });




