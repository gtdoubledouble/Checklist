/* Notes:
To use default jQuery Mobile styling, remove checkbox class tag
and run $('[type="checkbox"]').checkboxradio(); everytime a new checkbox is rendered
*/

var listOfChecklists = {};

var readOnly = false;

var jStorageTesting = false; 
var currentChecklist = 'untitled'; // string name of the current list
var templateToLoad = null; // by default, app will load the checklist called 'untitled' and set this to be the contents of it (JSON)
var templateToDelete = null;

orderCount=1; // enumeration counter for each list item or label; one existing item so current counter starts off at 2
subOrderCount=1;

var inputField = '<div class="ui-block-a main"><input type="text" name="name" id="inputField" placeholder="Enter list item" /></div>';
var inputButton = '<div class="ui-block-b main"><input type="button" value="Add" id="inputButton" data-inline="false" data-icon="plus"/></div>';

var deleting = false;
var disableRename = false;

$.event.special.tap.emitTapOnTaphold = false;
var checkboxBeingRenamed = undefined;
var labelBeingRenamed = undefined;

function createNewSublistItem( fieldValue ) {
	var inputValue = fieldValue;

	console.log("make sublist item");

	// find the last item in the current checklist HTML, insert an <ul> if it doesnt exist, and then append the sublist item to the <ul>
	if($('#checklist').children('li').last().children('ul').length == 0 ) {
		$('#checklist').children('li').last().append('<ul></ul>');
		//subOrderCount = 1;
	}

	var newSublistItem = '<li class="noStyle"><div class="sublist-checkbox-'+subOrderCount+'"><input class="css-checkbox" data-role="none" type="checkbox" name="sublist-checkbox-'+subOrderCount+'" id="sublist-checkbox-'+subOrderCount+'"  data-inline="true" />\
                <label for="sublist-checkbox-'+subOrderCount+'" class="css-label">' + inputValue + '</label></div></li>';

    $('#checklist').children('li').last().children('ul').append(newSublistItem);

	$('#sublist-checkbox-'+subOrderCount).change( function(event) { 
		if( $(this).parent().hasClass('rename') ) return; // don't trigger checkbox change event if renaming

		if( $(this).parent().parent().parent().parent().children('div').children('a').length > 0 ) {
			
			var otherItemsChecked = true;

			$(this).parent().parent().parent().children('li').each( function() {
				if( $(this).children('div').html() ) { // prevents "ui-sortable-placeholder", an automatically inserted <li>, to be counted as a checkbox
					otherItemsChecked = otherItemsChecked && $(this).children('div').children('input[type=checkbox]').is(':checked');
				}
			});

			myParent = $(this).parent().parent().parent().parent().children('div').children('input[type=checkbox]');
			myParent.prop("checked", otherItemsChecked);

			// checking of a sublist item affects the parent's checked flag (true/false) in the listItems array
			listItems.forEach(function(element){ 
				if(element.order == myParent.attr('id').replace('checkbox-','')) {
					element.checked = otherItemsChecked;
				}
			});

			checkForCollapsableSection();
		}

		else {			

			var parentChecked = $(this).is(':checked');
	    	
	    	$('#checkbox-'+subOrderCount).parent().parent().children('ul').find('input[type=checkbox]').prop( "checked", function( i, val ) {
	  		    return parentChecked;
			});			

			console.log("turned a checkbox into->" + parentChecked);

			// the following code is for collapsing each labelled section - we only care if the parent is checked or not
		   	// since if a section's sublist item is unchecked, its parent will not be checked regardless
			listItems.forEach(function(element) {
		    	if( element.order == subOrderCount ) {
		    		element.checked = parentChecked;
		    	}
		    });

		    checkForCollapsableSection();
	    }
    }); 

    $( 'div.sublist-checkbox-'+subOrderCount ).bind( "taphold", function(event) {
    	if( readOnly == true || disableRename == true ) return; // no changes allowed in readOnly

    	disableRename = true; // do not allow multiple renames 

    	$('#inputGrid').hide(); // if input grid was visible, hide it now
    	$('#renameGrid').show();
    	$('#renameField').val($(this).children('label').text());

    	checkboxBeingRenamed = $(this).children('input[type=checkbox]'); // instead of $('#sublist-checkbox'+subOrderCount), because the naming is probably different at the time of binding

    	// add class to indicate renaming
    	$(this).children('label').text($(this).children('label').text() + " (renaming)");
    	$(this).toggleClass('rename');

    	// prevents checkbox from getting ticked, while line 43 if-return statement prevents bubbling up to parent
    	$(this).children('input[type=checkbox]').on('click mouseup', function(e) {
	    	console.log("Stop propagation of normal mouse click (prevent checkbox) due to taphold (rename)");
	    	e.stopPropagation();
	    	e.preventDefault();
	    });
    });

    $( 'div.sublist-checkbox-'+subOrderCount ).bind("mousedown", function(event) {
    	if( readOnly == true ) {
    		
    		return false;
    	}
    });

    subOrderCount++;
}

function createNewItem( fieldValue ) {
	var inputValue = fieldValue;
	if( !inputValue ) inputValue = $('#inputField').val();
	if( !inputValue ) return;

	var itemNum = orderCount;

	var newItem = '<li><div class="checkbox-'+itemNum+'"><input class="css-checkbox" data-role="none" type="checkbox" name="checkbox-'+itemNum+'" id="checkbox-'+itemNum+'"  data-inline="true" />\
                <label for="checkbox-'+itemNum+'" class="css-label">' + inputValue + '</label></div></li>';
   
    $('.list').append(newItem);

    // add this new checkbox to the array, in the format of {jQuery selector, checkbox, checked, label, order}
    listItems.push( {
    	"selector" : $('.checkbox-'+itemNum),
    	"label" : inputValue,
    	"checkbox" : true, // label would be false
    	"checked" : false,
    	"order" : itemNum, // probably not needed....
    });

    // auto ticking of higher level boxes
	$('#checkbox-'+itemNum).change( function(event) { 
		if( $(this).parent().hasClass('rename') ) return; // don't trigger checkbox change event if renaming

		if( $(this).parent().parent().parent().parent().children('div').children('a').length > 0 ) {
			
			var otherItemsChecked = true;

			$(this).parent().parent().parent().children('li').each( function() {
				if( $(this).children('div').html() ) { // prevents "ui-sortable-placeholder", an automatically inserted <li>, to be counted as a checkbox
					otherItemsChecked = otherItemsChecked && $(this).children('div').children('input[type=checkbox]').is(':checked');
				}
			});

			myParent = $(this).parent().parent().parent().parent().children('div').children('input[type=checkbox]');
			myParent.prop("checked", otherItemsChecked);

			// checking of a sublist item affects the parent's checked flag (true/false) in the listItems array
			listItems.forEach(function(element){ 
				if(element.order == myParent.attr('id').replace('checkbox-','')) {
					element.checked = otherItemsChecked;
				}
			});

			checkForCollapsableSection();
		}

		else {

			var parentChecked = $(this).is(':checked');
	    	
	    	$('#checkbox-'+itemNum).parent().parent().children('ul').find('input[type=checkbox]').prop( "checked", function( i, val ) {
	  		    return parentChecked;
			});			

			console.log("turned a checkbox into->" + parentChecked);

			// the following code is for collapsing each labelled section - we only care if the parent is checked or not
		   	// since if a section's sublist item is unchecked, its parent will not be checked regardless
			listItems.forEach(function(element) {
		    	if( element.order == itemNum ) {
		    		element.checked = parentChecked;
		    	}
		    });

		    checkForCollapsableSection();
	    }
    }); 

    $( 'div.checkbox-'+itemNum ).bind( "taphold", function(event) {
    	if( readOnly == true || disableRename == true ) return; // no changes allowed in readOnly

    	disableRename = true; // do not allow multiple renames 

    	console.log("Rename, cut off click or mouseup for now");
    	$('#inputGrid').hide(); // if input grid was visible, hide it now
    	$('#renameGrid').show();
    	$('#renameField').val($(this).children('label').text());

    	checkboxBeingRenamed = $(this).children('input[type=checkbox]');

    	// add class to indicate renaming
    	$(this).children('label').text($(this).children('label').text() + " (renaming)");
    	$(this).toggleClass('rename');

    	$(this).children('input[type=checkbox]').on('click mouseup', function(e) {
	    	console.log("Stop propagation of normal mouse click (prevent checkbox) due to taphold (rename)");
	    	e.stopPropagation();
	    	e.preventDefault();
	    });
    });  

    $( 'div.checkbox-'+itemNum ).bind("mousedown", function(event) {
    	if( readOnly == true ) {
    		
    		return false;
    	}
    });

    // do not run this line if this is an item created from a template, or it will cause an infinite loop in loadChecklist()
    if(!fieldValue) addToCollapsableSection(); // forces a collapsed section list to show itself again 

    orderCount++;

    listToArray();
	listToBareArray();

    $.jStorage.set(currentChecklist, bareListArray);
}

function createNewLabel(fieldValue) {
	var inputValue = fieldValue;
	if( !inputValue ) inputValue = $('#inputField').val();
	if( !inputValue ) return;

	var itemNum = orderCount;

	var newLabel = '<li class = "mjs-nestedSortable-no-nesting"><div class="label-'+itemNum+' checklist-label"><span>' + inputValue + '</span></div></li>';
	
	$('.list').append(newLabel);

	// add this new checkbox to the array, in the format of {jQuery selector, checkbox, checked, label, order}
    listItems.push( {
    	"selector" : $('.label-'+itemNum),
    	"value" : inputValue,
    	"checkbox" : false, // label would be false
    	"checked" : false, 
    	"order" : itemNum, // probably not needed....
    	"sectioned" : false,
    });

    // allow renaming
    $( 'div.label-'+itemNum ).bind( "taphold", function(event) {
    	if( readOnly == true || disableRename == true ) return; // no changes allowed in readOnly

    	disableRename = true; // do not allow multiple renames 

    	console.log("Rename, cut off click or mouseup for now");
    	$('#inputGrid').hide(); // if input grid was visible, hide it now
    	$('#renameGrid').show();
    	$('#renameField').val($(this).children('span').text());

    	$(this).children('span').text($(this).children('span').text() + " (renaming)");
    	$(this).toggleClass('rename');
    	checkboxBeingRenamed = undefined;
    	labelBeingRenamed = $(this).children('span');
    }); 

    $( 'div.label-'+itemNum ).bind("mousedown", function(event) {
    	if( readOnly == true ) {
    		
    		return false;
    	}
    });

  	orderCount++;	

  	listToArray();
	listToBareArray();

  	$.jStorage.set(currentChecklist, bareListArray);
}


// this method unhides all the checkbox items in a section after a new checkbox is added and removes the +/- button
function addToCollapsableSection() {
	// traverse backwards to find nearest label since there might be multiple sections
	for( i=listItems.length-1; i>=0; i-- ) {
		// add a label and its section into sectionedItems, then check whether or not its checkboxes are ticked
		if( listItems[i].checkbox == false ) {
			// label was found, remove its expand/collapse (+/-) button
			listItems[i].selector.children('a').remove();
			for( k = i+1; k<listItems.length; k++ ) {
				// unhide (show) all the collapsed elements 
				listItems[k].selector.show('slow');
			}
			break; // only remove +/- button and hide for newest section label, not the sections before it
		}
	}
}

function checkForCollapsableSection() {
	for( i=0; i<listItems.length; i++ ) {
		// add a label and its section into sectionedItems, then check whether or not its checkboxes are ticked
		if( listItems[i].checkbox == false && i < listItems.length-1 ) { // if label is very last item, don't bother
			
			var beginningElement = i+1;
			var allItemsChecked = true;
			var currentSectionCounter = i+1;

			var nextLabelFound = false;
			for( j=i+1; j<listItems.length; j++ ) {
				if( listItems[j].checkbox == true && nextLabelFound == false ) {
					console.log("Check if this item is checked: " + listItems[j].label + " = " + listItems[j].checked); // check if each checkbox is checked
					allItemsChecked = allItemsChecked & listItems[j].checked;
					//if(allItemsChecked == false) break;
					currentSectionCounter++;
				} else {
					nextLabelFound = true;
				}
			}
			
			// allow section to collapse
			/* 
			beginningElement-1 is the index in the listItems array corresponding to the label
			beginningElement is the index of the first checkbox item
			*/

			if( allItemsChecked == true ) {

				if( listItems[beginningElement-1].selector.children('a').length == 0 ) {
					var expandButton = '<a href="#" class="collapseSectionButton">(-)</a>'; // start off by collapsing, so display (+)
	    			listItems[beginningElement-1].selector.append(expandButton); // append '+' button   
	    			allowCollapsableSections();

	    			for( k = beginningElement; k<currentSectionCounter; k++ ) {
						//listItems[k].selector.hide('slow');
					}

	    		} else { 
	    			// show you can collapse by hiding section
	    			// console.log("toggle collapsable section");
	    			// toggleCollapseSection();
	    		}
	    		
	    	} else if( allItemsChecked == false ) {
				console.log("Label no longer has all ticked checkboxes, remove +/- button");
				listItems[beginningElement-1].selector.children('a').remove();

				for( k = beginningElement; k<currentSectionCounter; k++ ) {
					listItems[k].selector.show('slow');
				}
			}

			i=currentSectionCounter-1; // continue searching for next label in for-loop, where next i will be a label
		}
	}
}

function testStore() {
	if( !$('#inputField').val() ) return;
	$.jStorage.set($('#inputField').val(), "someValue");
	alert('stored the value key = ' + $('#inputField').val() + ', value = someValue');
}

function testRetrieve() {
	if( !$('#inputField').val() ) return;
	alert('retrieved the value (hopefully = someValue): ' + $.jStorage.get($('#inputField').val()));
}

function confirmDelete() {
	if(listItems){
		var n = Object.keys(listItems).length; // if there is at least one item in the current checklist, confirm its deletion with user
		if( n > 0 && templateToLoad == "untitled" ) {
			$("#confirmDelete").popup("open", { overlayTheme: "a" });
		}
	}
}

function confirmDeleteTemplate() {
	$("#confirmDeleteTemplate").popup("open", { overlayTheme: "a" });
}

function renderTemplates() {
	$('#listOfChecklists').remove();
	$('#templateGroup').append('<ul data-role="listview" data-filter="true" data-inset="true" id="listOfChecklists"></ul>');

	for (var key in listOfChecklists) {
		if (listOfChecklists.hasOwnProperty(key)) {
			if( key != "untitled" ) { // load untitled checklist in other page
		 		$('#listOfChecklists').append('<li id="listTemplate"><a href="#" id='+key+'>'+key+'</a></li>');	

		 		$('#'+key).on('vclick', function(){
		 			var checklistToLoad = $(this).attr('id');
					console.log("you have clicked on the template link : " + $(this).attr('id'));
			 		confirmDelete();
			 		console.log("loading this checklist: " + listOfChecklists[checklistToLoad]);
			 		console.log("key = " + key);
			 		console.log("currentChecklist = " + checklistToLoad);
			 		loadChecklist(checklistToLoad, listOfChecklists[checklistToLoad], true, false);
			 	});

			 	$('#'+key).on('taphold', function(e){
			 		e.stopPropagation();
			 		templateToDelete = $(this).attr('id');
			 		confirmDeleteTemplate();
			 	});
		 	}    	
		}

	 	$('#listOfChecklists:visible').listview('refresh');
	} 	 	
 	
}

function clearCurrentList() {

	listItems = [];
	bareListArray = [];
	sectionedItems = [];

	if( currentChecklist == "untitled" ) {
		$.jStorage.set('untitled', null);
	}

	$('#checklist').empty();

	readOnly = false;
	$('#homeTitle').text('New checklist (unsaved)');
	$('#editDialogLaunch').hide();

	orderCount = 1;

	//console.log('Cleared checklist, should be nothing here: ' + $('#checklist').html());
}

function decodeURIandLoad(cl){
	cl = cl.replace("http://checklist/", "");
	var decodedChecklist = decodeURIComponent(cl);
	console.log(decodedChecklist);
	loadChecklist(null, decodedChecklist, true, false);
}

function isChildItem() {

}

function isParentItem(selector){
	// is this checkbox selector a parent item?
	if( selector.children('ul').length != 0 ) 
		return true;
	else 
		return false;
}

function listToBareArray() {
	// like list to array but it only contains the values

	bareListArray = [];
	eachListItem = $('#checklist').children('li').each( function() {

		if( $(this).children('div').is('[class^="label"]') == true ) {
			bareListArray.push( {
		    	"label-text" : $(this).children('div').children('span').text(),
		    });
		} else {
			if( isParentItem($(this)) == true ) {
				var sublistObject = [];
				$(this).children('ul').children('li').each( function() {
					sublistObject.push( {
				    	"sublist-checkbox-label" : $(this).children('div').children('label').text(),
					});
				});

				bareListArray.push( {
			    	"checkbox-label" : $(this).children('div').children('label').text(),
			    	"sublist" : sublistObject,
			    });		

			} else {
				bareListArray.push( {
					"checkbox-label" : $(this).children('div').children('label').text(),
			    });	
			}
		}

	});

	console.log(JSON.stringify(bareListArray));

}

function listToArray(){
	//var start = window.performance.now();

	listItems = [];
	eachListItem = $('#checklist').children('li').each( function() {

		// add checkbox-item or label to current checklist array
		//console.log("is this a checkbox? " + $(this).children('div').is('[class^="label"]'));

		// each selector corresponds to the wrapping <div>
		if( $(this).children('div').is('[class^="label"]') == true ) {
			listItems.push( {
		    	"selector" : $(this).children('div'), // to test: console.log($(this).children('div').html());
		    	"value" : $(this).children('div').children('span').text(),
		    	"checkbox" : false, // label would be false
		    	"checked" : false,
		    	"order" : $(this).children('div').attr('class').replace('label-',''),
		    	"sectioned" : false,
		    });

		    orderCount++;
		} else {			

			if( isParentItem($(this)) == true ) {
				// push each sublist item into sublist
				var sublistObject = [];
				var counter = 1;				

				$(this).children('ul').children('li').each( function() {
					sublistObject.push( {
						"selector" : $(this).children('div'),
				    	"label" : $(this).children('div').children('label').text(),
				    	"checkbox" : true, // label would be false
				    	"checked" : $(this).children('div').children('input[type=checkbox]').is(':checked'),
				    	"order" : counter, // probably not needed....
					});
					counter++;
				});

				listItems.push( {
			    	"selector" : $(this).children('div'),
			    	"label" : $(this).children('div').children('label').text(),
			    	"checkbox" : true, // label would be false
			    	"checked" : $(this).children('div').children('input[type=checkbox]').is(':checked'),
			    	"order" : $(this).children('div').attr('class').replace('checkbox-',''),
			    	"sublist" : sublistObject,
			    });		    	

			    orderCount++;

			} else {

				parentTester = $(this).children('div').children('input[type=checkbox]');

				listItems.push( {
			    	"selector" : $(this).children('div'), // <input class="css-checkbox"....><label>...
			    	"label" : $(this).children('div').children('label').text(),
			    	"checkbox" : true, // label would be false
			    	"checked" : $(this).children('div').children('input[type=checkbox]').is(':checked'),
			    	"order" : $(this).children('div').attr('class').replace('checkbox-',''),
			    });			    

			    orderCount++;
			}
		}
	});

	//var end = window.performance.now();
	//var time = end - start;
	//console.log('Execution time (in milliseconds) ' + time);
}

function rerender() {
	// refreshes the current checklist based on data in bareListArray, useful when undesirable change occurs

	// case used - deleting a sublisted item but undo-ing it puts the item into main list instead of sublist, so doing a rerender will override that
	loadChecklist(null, bareListArray, false, true);
}

function loadChecklist(nameOfTemplate, template, transitionToHome, refresh) {
	clearCurrentList();

	if( refresh == false ) {

		var template = JSON.parse(template);

		if(!nameOfTemplate) { // when we load from a URI link
			for( i=0; i<template.length; i++ ) {
				for( var key in template[i] ) {
					if( key.match("name") ) {
						nameOfTemplate = template[i][key];
					}
				}
			}
		}

		// change heading title of home page, restrict it to use-mode only
		$('#homeTitle').text(nameOfTemplate + ' (unsaved)');
		$('#editDialogLaunch').show();
		$('#editDialogLaunch').text("Edit Mode");
		readOnly = true;

		templatechecker = template;

	}

	if( nameOfTemplate ) currentChecklist = nameOfTemplate;
	else currentChecklist = 'untitled';

	try {
		for ( i=0; i<template.length; i++) {
			for (var insideKey in template[i]) { // each insideKey = 'checkbox-label' or 'label-text'
		  		if( insideKey.match("label-text") != null ) {
		    		createNewLabel(template[i][insideKey]);
		    	}
		    	else if( insideKey.match("checkbox-label") != null ) {
		    		createNewItem(template[i][insideKey]);
		    	}
		    	else if( insideKey.match("sublist") != null ) {
		    		for( k=0; k<template[i]['sublist'].length; k++ ) { // traverse through the sublist array of a checkbox item
		    			//console.log("***" + template[i]['sublist'][k]["sublist-checkbox-label"]);
		    			createNewSublistItem(template[i]['sublist'][k]["sublist-checkbox-label"]); 
		    		}
		    	}	    	
		  	}
		}

		resave(); // run this once to add +/- buttons to parent checkbox items

		// transition to current checklist page
		if(transitionToHome == true) {
			$.mobile.changePage('#home', {transition: 'slide', reverse: false});
		}		

	} catch (err) {
		console.log("Template was not valid, " + err);
	}	
}

function resave(){
	if( deleting == true ) return; // resave only when a delete is actually confirmed.

	// if item or label was also being renamed and then dragged, cancel that
	cancelRename();

	$('ul#checklist > li').each(function() {
    	if( $(this).children('ul').html() == '' ) { 
    		// if sublist no longer exists, remove the (+) button
    		console.log('remove (+) button');
			$(this).children('div').children('a').remove();
    	} else if( typeof $(this).children('ul').html() != "undefined" && $(this).children('div').children('a').length == 0 ){ // cannot be undefined
    		// collapsable button is only added if it didn't exist already (jQuery selector for it should have length of 0 then)
    		console.log("we're adding a (+) button due to this html: " + $(this).children('ul').html());
    		var expandButton = '<a href="#" class="collapseButton">(-)</a>';
    		$(this).children('div').append(expandButton); // append '+' button   
    		allowCollapsableSublists();  
    	}    	
	});

	$('li').addClass('noStyle');

	checkForCollapsableSection(); // if section is now empty, the label should not have a +/- button anymore
	// this must come before listToArray() - listToArray sets all checkboxes back to false

	listToArray();
	listToBareArray();

	$.jStorage.set(currentChecklist, bareListArray);
	
}

function allowSortable() {
	console.log('allow sortable');

    $('#checklist').nestedSortable({
        handle: 'div',
        items: 'li',
        toleranceElement: '> div'
    });    
}

function allowCollapsableSections() {
	// this function is run on a nestedSortable->mouseStop(), since a new collapsable button is created and needs to have a listener
	// it is also run on the page loading to attach listeners to all existing collapsable buttons
	
	$('.collapseSectionButton').off('vclick');

	$('.collapseSectionButton').on('vclick', function(){
		console.log("collapse section button pressed");

		// identify current section first by getting selector for <div> of the related label
		var currentLabel = $(this).parent();

		for( i=0; i<listItems.length; i++ ) {
			if( listItems[i].selector.html() == currentLabel.html() ) {
				for( j=i+1; j<listItems.length; j++ ) {
					if( listItems[j].checkbox == true ) {
						listItems[j].selector.toggle('slow');
						// if this item has sublist items, hide/show those too
						if( listItems[j].sublist ) {
							for( k=0; k<listItems[j].sublist.length; k++ ) {
								listItems[j].sublist[k].selector.toggle('slow');
							}
						}
					} else {
						break;
					}
				}
			}
		}

		$(this).toggleClass('collapsed');
		if( $(this).hasClass('collapsed') ) {
			// if collapsed, the button should become '+'
			$(this).text("(+)");
		}
		else {
			$(this).text("(-)");
		}
	});
}

function allowCollapsableSublists() {
	// this function is run on a nestedSortable->mouseStop(), since a new collapsable button is created and needs to have a listener
	// it is also run on the page loading to attach listeners to all existing collapsable buttons

	$('.collapseButton').off('vclick'); // remove existing listeners to avoid duplicates, or else function will run multiple times on a click
	$('.collapseButton').on('vclick', function(){
		console.log("Collapse button is working");
		$(this).parent().parent().children('ul').toggle('fast');
		$(this).toggleClass('collapsed');
		if( $(this).hasClass('collapsed') ) {
			// if collapsed, the button should become '+'
			$(this).text("(+)");
		}
		else {
			$(this).text("(-)");
		}
	});
}

function changeName() {
	console.log("lets try renaming");
	if(checkboxBeingRenamed != undefined) {
		checkboxBeingRenamed.next('label').text($('#renameField').val());
		checkboxBeingRenamed.off('click mouseup');
		checkboxBeingRenamed.parent().toggleClass('rename');
	} else if( labelBeingRenamed != undefined ) { 
		labelBeingRenamed.text($('#renameField').val());
		labelBeingRenamed.parent().toggleClass('rename');
	}

	$('#renameGrid').hide();

	listToArray();
	listToBareArray();
	$.jStorage.set(currentChecklist, bareListArray);

	disableRename = false; // allow renaming again
}

function cancelRename() {
	if( checkboxBeingRenamed != undefined ) {
		checkboxBeingRenamed.off('click mouseup');
		checkboxBeingRenamed.parent().removeClass('rename');
		checkboxBeingRenamed.next('label').text( checkboxBeingRenamed.next('label').text().replace(" (renaming)", "") ); // ugly code 
	} else if( labelBeingRenamed != undefined ) { 
		labelBeingRenamed.parent().removeClass('rename');
		labelBeingRenamed.text( labelBeingRenamed.text().replace(" (renaming)", "") );
	}

	$('#renameGrid').hide();

	disableRename = false; // allow renaming again
}

function deleteDetected(item, pos) {
	
	disableRename = true; // disable taphold (renaming) for all items

	something = item; // for debug

	if( pos < -20 && deleting == false) {
		deleting = true;
		// treat as a swipe left delete
		console.log('remove an item (undo and delete allowed)');		
		//item.remove();

		var confirmDeleteButton = '<a href="#" id="confirmDeleteItem" class="ui-btn ui-icon-delete ui-btn-icon-notext ui-corner-all ui-btn-inline"></a>';
        var undoDeleteButton = '<a href="#" id="undoDeleteItem" class="ui-btn ui-icon-back ui-btn-icon-notext ui-corner-all ui-btn-inline"></a>';

		$(item).hide('fast'); // where $(item) corresponds to the <li> of the sublist item
		$(item).after(confirmDeleteButton);
		$(item).after(undoDeleteButton);

		$('#undoDeleteItem').on('vclick', function(e) {
			$(item).show('slow');
			deleting = false;
			disableRename = false;
			$('#undoDeleteItem').remove();
			$('#confirmDeleteItem').remove();
			//rerender(); // bug exists where a sublisted item is not placed back into the sublist, need to re-render list from raw data
			// however rerendering unchecks all boxes, which is undesirable
		});

		$('#confirmDeleteItem').on('vclick', function(e) {
			$(item).remove();
			deleting = false;
			disableRename = false;
			$('#undoDeleteItem').remove();
			$('#confirmDeleteItem').remove();
			resave();	
		});			
	}	

	$('[data-role="button"]').button(); 
}

function removeButtonHighlights() {
	$('.ui-btn-active').removeClass('ui-btn-active'); // jQuery Mobile doesn't unhighlight clicked buttons automatically
}

$(document).ready(function() {	

	allowSortable();

	// $('#checklist').on('mouseleave', sayHi); // triggers every time a dragged item passes by another one
	// for a 'finished-dragging' event, refer to mouseStop() in nestedSortable.js=

	var addingItem = true;
	var storing = true; // for testing only
	var inputShown = false;

	// prepend text field to footer
	// $('#inputGrid').append(inputField);
	// $('#inputGrid').append(inputButton);
	// jquery mobile re-style
	$('[type="text"]').textinput();
	$('[type="button"]').button();

	$('#inputGrid').hide();	
	$('#renameGrid').hide();	

	$('#newItem').on('vclick', function(){
		if( readOnly == true ) {
			removeButtonHighlights();
			return; // no changes allowed in readOnly
		}

		cancelRename();

		if( inputShown == false ) {
			$('#inputGrid').show();
			addingItem = true;
			inputShown = true;			
		}
		else {
			$('#inputGrid').hide();
			inputShown = false;		
			setTimeout(function(){
				$('#newItem').children('a').removeClass('ui-btn-active');
			},0);			
		}		
	});

	$('#newLabel').on('vclick', function(){
		if( readOnly == true ) {
			removeButtonHighlights();
			return; // no changes allowed in readOnly
		}

		cancelRename();

		$('#inputGrid').show();
		if( inputShown == false ) {
			$('#inputGrid').show();
			addingItem = false;
			inputShown = true;
		}
		else {
			$('#inputGrid').hide();
			inputShown = false;
			setTimeout(function(){
				$('#newLabel').children('a').removeClass('ui-btn-active');
			},0);	
		}	
	});

	$('#templatesLink').on('vclick', function(){
		cancelRename();
		// load page manually instead of using the a href link, which uses the default slow click
		$.mobile.changePage('#templates', {transition: 'slide'});

	});

	$('#homeLink').on('vclick', function(){
		// load page manually instead of using the a href link, which uses the default slow click
		$.mobile.changePage('#home', {transition: 'slide', reverse: true});
	});

	/* Delete the whole list */
	$('#clearDialogLaunch').on('vclick', function(){ 
		cancelRename();
		$('#clearDialog').popup("open", { overlayTheme: "a" });
	});

	$('#clear').on('vclick', function(){ 
		clearCurrentList();
		removeButtonHighlights();
	});

	/* Share the list */
	// as JSON URI
	$('#shareDialogLaunch').on('vclick', function(){

		// append list of checklists to this popup window
		$('#listOfTemplates').empty();
		$('#listOfTemplates').append($('#listOfChecklists').html());
		$('#shareTemplateDialog').popup("open", { overlayTheme: "a" });

		var templateListCounter = 1;
		eachTemplate = $('#listOfTemplates').children('li').each( function() {
			$(this).children('a').attr('id', 'sharableTemplate-' + templateListCounter);
			
			$('#sharableTemplate-' + templateListCounter).on('vclick', function(e){
				templateToShare = $(this).text();
				console.log("Sharing template called " + templateToShare);
				//doAppendFile(); // automatically outputs to file directory in Android as fileIO.js line 59's test.txt
				//-----
				console.log("Stringified: " + listOfChecklists[templateToShare] );
				stringifiedTemplate = listOfChecklists[templateToShare].replace(/[|]|\//, '');
				console.log("Stringified and replaced: " + stringifiedTemplate);

				var encodedURL = 'http://checklist/' + encodeURIComponent(stringifiedTemplate);
				console.log("Send out this URL: " + encodedURL);
				window.plugins.socialsharing.share(null, null, null, encodedURL);
			});	

			templateListCounter++;
		});
			
	});	

	$('#editDialogLaunch').on('vclick', function(){

		var readOnlyTemp = readOnly; // because below methods will change readOnly's value,
		// so we need to store what readOnly is before the methods and interpret that instead

		// re-render
		var currentBareListArray = bareListArray;
		clearCurrentList();
		loadChecklist(currentChecklist, JSON.stringify(currentBareListArray), false, false);

		if( readOnlyTemp == false ) {
			$('#homeTitle').text(currentChecklist + ' (use mode)');
			$(this).text("Edit Mode");
			readOnly = true;
		}
		else {
			$('#homeTitle').text(currentChecklist + ' (edit mode)');
			$(this).text("Use Mode");
			readOnly = false;
		}
	});

	/* Save the list as a template */
	$('#saveDialogLaunch').on('vclick', function(){ 
		cancelRename();
		if( bareListArray.length == 0 ) {
			$('#noSavingDialog').popup("open", { overlayTheme: "a" });
			setTimeout(function(){ 
				removeButtonHighlights(); // since this line is called before button becomes highlighted, need to delay the removal
			}, 300);
		} else {
			$('#saveDialog').popup("open", { overlayTheme: "a" });
		}
	});

	$('#save').on('vclick', function(){

		var savedListName = $('#saveField').val().replace(/\s/g,"-"); // replace spaces with hyphens for valid id
		savedListName = savedListName.replace(/\./g, '-'); // replace periods with hyphens

		bareListArray.push( { "name" : savedListName } ); // bareListArray.name or ["name"] = savedListName; won't be seen or stringified
	
		// save the list into local storage
		console.log(JSON.stringify(bareListArray));
		var savedListString = JSON.stringify(bareListArray);
		$.jStorage.set(savedListName, savedListString);
		console.log("Saved list named: " + savedListName + " and the list looks like this:\n" + savedListString);
		$.jStorage.set('untitled', null); // wipe untitled list

		// save the templates into local storage
		listOfChecklists[savedListName] = savedListString;
		$.jStorage.set('listOfChecklists', listOfChecklists);

		renderTemplates();

		$('#homeTitle').text(savedListName + ' (saved)');
	});

	/* Template page template links */
	$('#confirmLoadTemplate').on('vclick', function(){
		loadChecklist(null, templateToLoad, true, false);
	});

	if( jStorageTesting == true ) {
		/* Testing only */
		$('#testStore').on('vclick', function(){
			$('#inputGrid').show();
			addingItem = false;	
			storing = true;	
		});

		$('#testRetrieve').on('vclick', function(){
			$('#inputGrid').show();
			addingItem = false;	
			storing = false;	
		});
		/**/
	}

	/* Load a list as a template */
	$('#loadDialogLaunch').on('vclick', function(){ 
		$('#loadDialog').popup("open", { overlayTheme: "a" });
	});

	$('#load').on('vclick', function(){
		decodeURIandLoad($('#loadField').val());
	});

	/* Input field for new items or labels */

	$("#inputField").focus(function() {
	    $(this).data("hasfocus", true);
	});

	$("#inputField").blur(function() {
	    $(this).data("hasfocus", false);
	});

	$(document.body).keyup(function(ev) {
	    // 13 is ENTER
	    if (ev.which === 13 && $("#inputField").data("hasfocus")) {
	        addItemOrLabel();
	    }
	});

	function addItemOrLabel() {
		if( addingItem == true ) {
			createNewItem();
		}
		else {
			createNewLabel();
		}
		$('#inputField').val('');
		$('#inputField').focus();
	}

	$('#inputButton').on('vclick', function() {
		addItemOrLabel();
	});	

	$('#renameButton').on('vclick', function() {
		removeButtonHighlights();
		changeName();
	});	

	$('#cancelRenameButton').on('vclick', function() {
		removeButtonHighlights();
		cancelRename();
	});	

	$('.cancelBtn').on('vclick', function() {
		removeButtonHighlights();
	});	

	$('#confirmDeleteTemplateBtn').on('vclick', function() {
		console.log("delete this template");
		$('#'+templateToDelete).remove();
		for( var key in listOfChecklists ) {
			if( key == templateToDelete ) {
				delete listOfChecklists[key];
			}
		}

		$.jStorage.set('listOfChecklists', listOfChecklists);

		$( "#confirmDeleteTemplate" ).popup( "close" )
	});	

	// load existing checklist
	var existingChecklist = $.jStorage.get('untitled');
	loadChecklist(null, existingChecklist, false, true); // name of template is [null] (untitled), template, transitionToHome, refresh

	// load the template page
	listOfChecklists = $.jStorage.get('listOfChecklists') || {}; // if variable didn't exist in local storage, use empty object instead
	renderTemplates();

	$('#editDialogLaunch').hide();


	/*------- For templates page --------*/
	$('#shareTemplate').on('vclick', function(event){

	});
});