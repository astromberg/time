// This method is called when a message is passed. It should provide the selected text.
var exists = false;
function onRequest(request, sender, sendResponse) {
  if (!request['valid']) {
    chrome.contextMenus.remove('timestamp');
	exists = false;
	return;
  }
  if (exists) {
    chrome.contextMenus.update(
	'timestamp',
	{
      title: request['formattedTimestamp'],
    });
  } else {
    exists = true;
    chrome.contextMenus.create({
      id: 'timestamp',
      title: request['formattedTimestamp'],
      contexts: ['selection'],
    });
  }

  // Return nothing to let the connection be cleaned up.
  sendResponse({});
};

// Listen for the content script to send a message to the background page (this script).
chrome.extension.onMessage.addListener(onRequest);
