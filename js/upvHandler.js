'use strict';

function isPdfDownloadable(details) {
  return details.url.indexOf('pdfjs.action=download') >= 0;
}

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (isPdfDownloadable(details))
      return;

    var viewerPage = 'viewer.html';
    var url = chrome.extension.getURL(viewerPage) +
      '?file=' + encodeURIComponent(details.url);
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
    types: ['main_frame']
  },
  ['blocking']);