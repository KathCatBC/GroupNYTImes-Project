$(document).ready(function(){
	var url = ""; // The url to use in the ajax call.
	var apiKey = "b29c6f530cde4cb2b7c6de45520eee27";
	var term = ""; // The search-term; corresponds to parameter 'q'.
	var yearStart = ""; // the year to put into parameter 'begin-date'. 
	var yearEnd = ""; // the year to put into parameter 'end-date'.
	var quantityRequested; // The quantity of articles requested by the user
	var params = {}; // we can build the complete url dynamically using this variable. See 'if statements' below.
	var page ="";
	var articleNumber = 0;   // used for odd # articles and display article# on results. Will be reset to zero each time QueryApi() is called.
	var	pagesNeeded = 0;    // used to calc # of API calls that are needed
	var	partialPage = 0;    // used to calculate if a user request 5 or 25 articles
	var errLoopCounter = 0;



	function queryApi() {
		url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";  // the base url to which we add parameters
	
		// changed to pagesNeeded  from page to deal with odd # article request
		params['page'] = page; // sets the url's 'page' ******************** KATHLEEN, I CHANNGED HOW THIS WORKS. ************************
		url += '?' + $.param(params); // builds the url based on the user's input.
		
	    $.ajax({
			url: url,
			method: 'GET',
		}).done(function(result) {
			
			if (result.response.docs.length == 0) { // no records just stop searching
				$('#newMessage').text("Quantity of articles found: " + articleNumber);
				return
			}

			for (i=0; (i < result.response.docs.length && articleNumber < quantityRequested); i++) {
				mainheadline = result.response.docs[i].headline.main;
				if (mainheadline != "") {   //only display the article if it has a headine
					articleNumber++;	
					if (result.response.docs[i].byline == null || result.response.docs[i].byline.length == 0) {
						articlefrom = "";
					}
					else {
						articlefrom = result.response.docs[i].byline.original;      // Handle if no docs found 
					}

					// assemble each article/hyperlink before outputting to screen.
					var a = $("<a target = _blank />");
					a.attr("href",result.response.docs[i].web_url);
					a.html(articleNumber + " - "  + result.response.docs[i].headline.main);
				
					if (articlefrom == "undefined") { 
						articlefrom = ""; 
					} // just in case one sneaks by
					
					var item2 = ('<p>       '  + articlefrom + '</p><br>');		  // assemble the byline before outputting to screen.	
					if (articleNumber == 1) {
						$('#resultsText').append("<br>");  // neaten up the display	
					}
					
					var doc = $('<div>').addClass("docHolder");
					doc.append(a).append(item2);
					$('#resultsText').append(doc);				

				}  // end of checking for blank headline
			} // end for i
			
			page--; //*****************// That page is done, so decrement the counter variable 'page'.

			if (page >= 0) {
				setTimeout(queryApi, 1000);  // IF there is a 'next page' ... WAIT 1 SECOND TO AVOID error429...
			} else {
				if (articleNumber < quantityRequested) { // if fewer articles found than requested, then...
					$('#newMessage').text("Quantity of articles found: " + articleNumber); // ... display the qty of articles found.
				}
			}

		}).fail(function(err) {		
			if (err == 429){
				setTimeout(queryApi, 1500);
				errLoopCounter++
				if (errLoopCounter > 3) {
					$('#newMessage').text("Quantity of articles found: " + articleNumber);
					throw err;
				}
			}
			else {
				$('#newMessage').text("Quantity of articles found: " + articleNumber);
				throw err;
			};
		}); // end of .fail;
	} // end of function queryApi()


	$(document).on('click','#searchButton', function(event){
		event.preventDefault(); // prevents form from submittimg http request/reloading page.
		term = $('#searchText').val().trim();
		quantityRequested = $('#recordsToRetrieve').val().trim();
		yearStart = $('#startYear').val().trim();
		yearEnd = $('#endYear').val().trim();


		// we'll always need the apiKey in the url.
		params['api-key'] = apiKey;
		// if the user sets a value for a given parameter, then include that parameter in the url.
		if (term != "") { params['q'] = term; }
		if (yearStart != "") {
			// Make sure the user entered a YEAR correctly, and...
			if ((Number.isInteger(parseInt(yearStart))) && (yearStart.length == 4)) {
			params['begin_date'] = (yearStart + '0101');

			// ... if they didnt --> add a message into the text input field, and AVOID API ERROR.
			} else {
				$('#startYear').attr("placeholder", " Please enter a four digit year").val("").blur();
				return false;
			} // if-else isInteger
		}
		if (yearEnd != "") {
			// Make sure the user entered a YEAR correctly, and...
			if ((Number.isInteger(parseInt(yearEnd))) && (yearEnd.length == 4)) {
			params['end_date'] = (yearEnd + '0101');

			// ... if they didnt --> add a message into the text input field, and AVOID API ERROR.
			} else {
				$('#endYear').attr("placeholder", " Please enter a four digit year").val("").blur();
				return false;
			} // if-else isInteger
		}

		// calculate pages need to retrieved based on user's request
		pagesNeeded = Math.floor(quantityRequested/10);
		partialPage = quantityRequested%10;    // used to calculate if a user request 5 or 25 articles
		if (partialPage === 0) {   				// pages start at zero so if user needs 10 articles 
			pagesNeeded--;              			// we only need pages 0 etc
		}
		
		page = pagesNeeded; 

		$('#results').show();
		$('#newMessage').show();
		$('#search').hide(); //

		queryApi();
	}); // on click


	$(document).on('click', '#newSearch', function(event){
		event.preventDefault();
		// Reset search variables; and Display defaults.
		term = "";
		$('#searchText').val(term);
		quantityRequested = "5";
		$('#recordsToRetrieve').val(quantityRequested);
		yearStart = "";
		$('#startYear').val(yearStart);
		yearEnd = "";
		$('#endYear').val(yearEnd);

		$('#resultsText').empty(); // clears-out the results div, so it is ready to recieve results of the next search.
		
		$('#results').hide();
		$('#search').show(); // shows the search screen.
	
		articleNumber = 0; // resets articleNumber for the next search.
		errLoopCounter = 0;
		$('#newMessage').text(""); // clears the message area for the next search.
		params = {}; // clears the params for the next search, so if a field is left blank, it won't use the parameter from the previous search.
	}); // on click end
}); // document.ready