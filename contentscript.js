// This is a pile of code for when I originally wanted to replace all the timestamps on a page.
/* var timestamps = [];
var timestampNodes = [];
var timestampsConverted = false;
var timestampNodesProcessed = false;

function Timestamp(container) {
  this.container = container;
  this.originalValue = container.firstChild.nodeValue;
  this.timestampInMillis = Number(this.originalValue);
  // It's probably in seconds, convert it to millis
  if (this.timestampInMillis < Math.pow(10, 10)) {
    this.timestampInMillis = this.timestampInMillis * 1000;
  }
  // If the user chooses to convert the timestamp, we have an overlay with more info.
  this.overlay = null;
}

Timestamp.prototype.flip = function(showOriginalValue) {
  if (showOriginalValue) {
    this.container.innerHTML = this.originalValue;
  } else {
    this.container.innerHTML = formatTimestamp(this.timestampInMillis);
  }
}


function findPotentialTimestamps() {
  var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
  );

  var node;
  while(node = walker.nextNode()) {
    // If it's a value embedded in a script tag, ignore it.
	if (isChildOfScriptNode(node)) {
	  continue;
	}
	// If it doesn't have anything that looks like a timestamp in it, ignore it.
	if (!/\d{7,13}/.test(node.nodeValue)) {
	  continue;
    }
	timestampNodes.push(node);
  }
}

function isChildOfScriptNode(node) {
  var currentNode = node.parentNode;
  while (currentNode != null) {
    if (currentNode.nodeName === "SCRIPT") {
	  return true;
	}
    currentNode = currentNode.parentNode
  }
  return false;
}

function highlightTimestamps() {
  // If all we have is a bunch of refences to nodes, process these nodes into something that can
  // be highlighted / hovered / manipulated / etc.
  if (!timestampNodesProcessed) {
    processTimestampNodes();
    timestampNodesProcessed = true;
  }
  
  var length = timestamps.length;
  for (var i = 0; i < length; i++) {
    var timestamp = timestamps[i];
    timestamp.flip(timestampsConverted);
  }
  timestampsConverted = !timestampsConverted;
}

function processTimestampNodes() {
  var length = timestampNodes.length;
  for (var i = 0; i < length; i++) {
    var node = timestampNodes[i];
    node.parentNode.replaceChild(buildNewNodes(node.nodeValue), node);
  }
}

function buildNewNodes(originalText) {
    var newContents = document.createElement('span');
    var result;
	var regex = /\d{7,13}/
	var i = 0;
	var text = originalText;
	// Regex.exec blows because it doesn't handle whitespace only lines correctly.
	// That is why we are jumping through this hoop of removing text on each iteration.
    while (result = regex.exec(text)) {
      newContents.appendChild(
        document.createTextNode(text.substring(0, result['index'])));
	  var start = result['index'] + result[0].length;
	  var end = text.length;
	  remainingText = text.substring(start, end);
      text = remainingText;
	  i++;
	  var timestamp = document.createElement('b');
	  timestamp.innerHTML = result[0];
	  newContents.appendChild(timestamp);
	  timestamps.push(new Timestamp(timestamp));
    }
	// Add the trailing text back in.
    newContents.appendChild(document.createTextNode(remainingText));
	return newContents;
}

function findElementPosition(obj) {
  var curleft = curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while (obj = obj.offsetParent);
    return [curleft, curtop];
  }
} 

function bind(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  }
}

// The initial work to identify nodes with timestamps gets kicked off here
findPotentialTimestamps();

if (timestampNodes.length > 0) {
  // Tell Chrome that we should display the page action widget.
  chrome.extension.sendMessage({}, function(response) {});
  chrome.runtime.onMessage.addListener(highlightTimestamps);
} */
var lastSeenTimestamp = -1;

function getSelectedText() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }
    return text;
}

function formatTimestamp(timestamp) {
  var now = new Date(timestamp);

  var date = [ now.getFullYear(), now.getMonth() + 1, now.getDate() ];
 
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
 
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";
 
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
 
  time[0] = time[0] || 12;
 
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
 
  return date.join("/") + " " + time.join(":") + " " + suffix;
}

function timeSinceLastStamp(timestampInMillis, lastSeenTimestamp) {
  if (lastSeenTimestamp < 0) {
    return '';
  }
  var diff = Math.abs(timestampInMillis - lastSeenTimestamp);
  if (diff == 0) {
    return 'same as last.';
  }
  var moreRecent = timestampInMillis < lastSeenTimestamp;
  var secondInMillis = 1000;
  var minuteInMillis = secondInMillis * 60;
  var hourInMillis = minuteInMillis * 60;
  var dayInMillis = hourInMillis * 24;
  
  var days = Math.floor(diff / dayInMillis);
  var hours = Math.floor((diff - dayInMillis * days) / hourInMillis);
  var minutes = Math.floor((diff - days * dayInMillis - hours * hourInMillis) / minuteInMillis);
  var seconds = Math.floor((diff - days * dayInMillis - hours * hourInMillis - minutes * minuteInMillis) / secondInMillis);
  var milliseconds = diff % 1000;
  var stringPieces = [];
  if (days > 0) {
    stringPieces.push(days + 'd');
  }
  if (hours > 0) {
    stringPieces.push(hours + 'h');
  }
  if (minutes > 0) {
    stringPieces.push(minutes + 'm');
  }
  if (seconds > 0) {
    stringPieces.push(seconds + 's');
  }
  if (milliseconds > 0) {
    stringPieces.push(milliseconds + 'ms');
  }
  return stringPieces.join(' ') + (moreRecent ? " earlier" : " later");
}

function guessTimestampInfo(text) {
  var timestampInMillis = Number(text);
  var originalUnits = 'milliseconds';
  if (timestampInMillis < Math.pow(10, 10)) {
    // It's probably in seconds, since this timestamp is so close to 1970.
    timestampInMillis = timestampInMillis * 1000;
	originalUnits = 'seconds';
  } else if (timestampInMillis > Math.pow(10, 13)) {
	// It's probably in microseconds, since this timestamp is beyond the year 2286.
	timestampInMillis = timestampInMillis / 1000;
	originalUnits = 'microseconds';
  }
  var timeSinceLast = timeSinceLastStamp(timestampInMillis, lastSeenTimestamp);
  var timeString = formatTimestamp(timestampInMillis) + ' in ' + originalUnits;
  if (timeSinceLast != '') {
    timeString = timeString + ', ' + timeSinceLast;
  }
  lastSeenTimestamp = timestampInMillis;
  return {
    'valid': true,
	'formattedTimestamp': timeString,
  };
}

function handleTextMaybeSelected(event) {
  if (event.which != 1) {
    return;
  }
  // Check to see if we actually have selected text.
  var selectedText = getSelectedText();
  if (!selectedText) {
    return;
  }
  // See if it looks kinda like a timestamp.
  if (/^\d{7,16}$/.test(selectedText)) {
    chrome.extension.sendMessage(guessTimestampInfo(selectedText), function(response) {});
  } else {
    chrome.extension.sendMessage({'valid': false}, function(response) {});
  }
}

document.addEventListener('mouseup', handleTextMaybeSelected);
