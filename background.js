// This method is called when a message is passed. It should provide the selected text.
var exists = false;
function onRequest(request, sender, sendResponse) {
  // Show the page action for the tab that the sender (content script)
  // was on.
  // chrome.pageAction.show(sender.tab.id);

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

// This is if I wanted someone to update the whole page. Maybe in the future I will bring this back.
/* chrome.pageAction.onClicked.addListener(function(tabs) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    }
    chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {});
  });
});
*/

