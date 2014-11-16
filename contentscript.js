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
