/**
 * Activates a search box for search through a given HTMLDomElement
 *
 * @param {HTMLDomElement} contents HTMLDomElement that search will be applied
 *   to
 * @param {HTMLDomElement} search Input element that search value will be
 *   retrieved from and the keyup event attached to
 * @param {Object} [options] Options
 * @param {String[]} [options.hideNodes] Node names of nodes to hide if the
 *   search string is not found in them
 *
 * @returns {Boolean} true, if the search string was found in the element,
 *   false otherwise
 */
function activateSearch(contents, search, options) {
  var searchSpans = [];
  var searchHidden = [];
  var previousValue;
  options = options || {};

  function searchAndReplace(elements, regex) {
    // Convert elements to array
    elements = Array.from(elements);
    var searchHit = false;
    
    elements.forEach(function(element) {
      var value, nextNode, match;
      switch (element.nodeType) {
        case 1: // Element node
          if (element.childNodes.length)  {
            if (searchAndReplace(element.childNodes, regex)) {
              searchHit = true;
            } else if (options.hideNodes
                && options.hideNodes.indexOf(element.nodeName) !== -1) {
              element.classList.add('searchHidden');
              searchHidden.push(element);
            }
          }
          break;
        case 3: // Text node
          nextNode = element.nextSibling;
          parentNode = element.parentNode;
          value = element.nodeValue;
          while((matches = regex.exec(value)) !== null) {
            searchHit = true;
            // Replace the text in the current text node
            element.nodeValue = matches[1];
            // Create a new span for the searched for text
            element = document.createElement('span');
            element.innerHTML = matches[2];
            element.className = 'searchHit';
            if (nextNode) {
              parentNode.insertBefore(element,
                  nextNode);
            } else {
              parentNode.appendChild(element);
            }
            // Store the span for later
            searchSpans.push(element);

            // Put the rest in a new text node
            element = document.createTextNode(matches[3]);
            if (nextNode) {
              parentNode.insertBefore(element,
                  nextNode);
            } else {
              parentNode.appendChild(element);
            }

            // Set value to the unsearched
            value = matches[3];
          }
          break;
      }
    });

    return searchHit;
  }

  // Add event listener to search box
  function updateSearch() {
    // Get new search value
    var value = search.value;
    // Escape search value
    var escapedValue = value.replace('/([\[\]\(\)\.\*\?\|\\\{\}\^])/', '\\$1');

    // Clear previous span
    if (searchSpans.length) {
      searchSpans.forEach(function(span) {
        var previousNode = span.previousSibling;
        var nextNode = span.nextSibling;
        var parentNode = span.parentNode;

        // Move through node if have a comment node
        while (previousNode && previousNode.nodeType === 8) {
          previousNode = previousNode.previousSibling;
        }
        
        while (nextNode && nextNode.nodeType === 8) {
          nextNode = nextNode.nextSibling;
        }

        if (previousNode && previousNode.nodeType === 3
            && nextNode && nextNode.nodeType === 3) {
          // Join everything back together
          previousNode.nodeValue = previousNode.nodeValue + span.textContent
              + nextNode.nodeValue;
          parentNode.removeChild(span);
          parentNode.removeChild(nextNode);
        } else if (previousNode && previousNode.nodeType === 3) {
          // Join span text onto previous node
          previousNode.nodeValue = previousNode.nodeValue + span.textContent;
          parentNode.removeChild(span);
        } else if (nextNode && nextNode.nodeType === 3) {
          // Join span text onto next node
          nextNode.nodeValue = nextNode.nodeValue + span.textContent;
          parentNode.removeChild(span);
        } else {
          // Replace the span with a text node
          parentNode.replaceChild(span, document.createTextNode(span.nodeValue));
        }
      });

      searchSpans = [];
    }

    // Show previously hidden sections
    if (searchHidden.length) {
      searchHidden.forEach(function(element) {
        element.classList.remove('searchHidden');
      });

      searchHidden = [];
    }

    if (value.length > 1 && contents.childNodes.length) {
      // Create Regular expression for search
      var regex = new RegExp('^(.*)(' + escapedValue + ')(.*)$', 'i');
      // Search through contents for search value
      searchAndReplace(contents.childNodes, regex);
    }
  }

  search.addEventListener('keyup', updateSearch);
  search.addEventListener('change', updateSearch);
  updateSearch();
}
