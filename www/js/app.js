/* Notes:
To use default jQuery Mobile styling, remove checkbox class tag
and run $('[type="checkbox"]').checkboxradio(); everytime a new checkbox is rendered
*/

$.event.special.tap.emitTapOnTaphold = false;

var app = {
	listOfChecklists : {},
	readOnly : false,
	jStorageTesting : false,
	currentChecklist : 'untitled', // string name of the current list
	templateToLoad : null, // by default, app will load the checklist called 'untitled' and set this to be the contents of it (JSON)
	templateToDelete : null,

	inputField : '<div class="ui-block-a main"><input type="text" name="name" id="inputField" placeholder="Enter list item" /></div>',
	inputButton : '<div class="ui-block-b main"><input type="button" value="Add" id="inputButton" data-inline="false" data-icon="plus"/></div>',

	deleting : false,
	disableRename : false,

	checkboxBeingRenamed : undefined,
	labelBeingRenamed : undefined,

	progressPercentage : 0,

	addToCollapsableSection: function() {
		// traverse backwards to find nearest label since there might be multiple sections
		for( i=app.listItems.length-1; i>=0; i-- ) {
			// add a label and its section into sectionedItems, then check whether or not its checkboxes are ticked
			if( app.listItems[i].checkbox == false ) {
				// label was found, remove its expand/collapse (+/-) button
				app.listItems[i].selector.children('a').remove();
				for( k = i+1; k<app.listItems.length; k++ ) {
					// unhide (show) all the collapsed elements 
					app.listItems[k].selector.show('slow');
				}
				break; // only remove +/- button and hide for newest section label, not the sections before it
			}
		}
	},

	checkForCollapsableSection: function() {
		for( i=0; i<app.listItems.length; i++ ) {
			// add a label and its section into sectionedItems, then check whether or not its checkboxes are ticked
			if( app.listItems[i].checkbox == false && i < app.listItems.length-1 ) { // if label is very last item, don't bother
				
				var beginningElement = i+1;
				var allItemsChecked = true;
				var currentSectionCounter = i+1;

				var nextLabelFound = false;
				for( j=i+1; j<app.listItems.length; j++ ) {
					if( app.listItems[j].checkbox == true && nextLabelFound == false ) {
						console.log("Check if this item is checked: " + app.listItems[j].label + " = " + app.listItems[j].checked); // check if each checkbox is checked
						allItemsChecked = allItemsChecked & app.listItems[j].checked;
						currentSectionCounter++;
					} else {
						if( app.listItems[j].checkbox == false  && app.listItems[j-1].checkbox == false ) {
							allItemsChecked = false;
						}
						nextLabelFound = true;
					}
				}
				
				// allow section to collapse
				/* 
				beginningElement-1 is the index in the app.listItems array corresponding to the label
				beginningElement is the index of the first checkbox item
				*/

				if( allItemsChecked == true ) {

					if( app.listItems[beginningElement-1].selector.children('a').length == 0 ) {
						var expandButton = '<a href="#" class="collapseSectionButton">(-)</a>'; // start off by collapsing, so display (+)
		    			app.listItems[beginningElement-1].selector.append(expandButton); // append '+' button   
		    			app.allowCollapsableSections();

		    			for( k = beginningElement; k<currentSectionCounter; k++ ) {
							//app.listItems[k].selector.hide('slow');
						}

		    		} else { 
		    			// show you can collapse by hiding section
		    			// console.log("toggle collapsable section");
		    			// toggleCollapseSection();
		    		}
		    		
		    	} else if( allItemsChecked == false ) {
					console.log("Label no longer has all ticked checkboxes, remove +/- button");
					app.listItems[beginningElement-1].selector.children('a').remove();

					for( k = beginningElement; k<currentSectionCounter; k++ ) {
						app.listItems[k].selector.show('slow');
					}
				}

				i=currentSectionCounter-1; // continue searching for next label in for-loop, where next i will be a label
			}
		}	

		app.calculateProgress();
	},

	confirmDelete: function() {
		if(app.listItems){
			var n = Object.keys(app.listItems).length; // if there is at least one item in the current checklist, confirm its deletion with user
			if( n > 0 && templateToLoad == "untitled" ) {
				$("#confirmDelete").popup("open", { overlayTheme: "a" });
			}
		}
	},

	confirmDeleteTemplate: function() {
		$("#confirmDeleteTemplate").popup("open", { overlayTheme: "a" });
	},

	renderTemplates: function() {
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
				 		app.loadChecklist(checklistToLoad, listOfChecklists[checklistToLoad], true, false);
				 	});

				 	$('#'+key).on('taphold', function(e){
				 		e.stopPropagation();
				 		templateToDelete = $(this).attr('id');
				 		confirmDeleteTemplate();
				 	});
			 	}    	
			}
		} 	 

		// buggy; jQuery Mobile does not manually refresh the template list view sometimes and the styling is lost
		$('#listOfChecklists').listview();
		$('#listOfChecklists').filterable();
	},

	clearCurrentList: function() {

		app.listItems = [];
		app.bareListArray = [];
		app.sectionedItems = [];

		if( app.currentChecklist == "untitled" ) {
			$.jStorage.set('untitled', null);
		}

		$('#checklist').empty();

		app.editMode();
		$('#homeTitle').text('New checklist (unsaved, edit mode)');
		$('#editDialogLaunch').hide();

		listItem.count = 1;

		//console.log('Cleared checklist, should be nothing here: ' + $('#checklist').html());
	},

	decodeURIandLoad: function(cl){
		console.log("Decode incoming URI");
		cl = cl.replace("http://checklist/", "");
		var decodedChecklist = decodeURIComponent(cl);
		console.log("The decoded checklist = " + decodedChecklist);
		app.loadChecklist(null, decodedChecklist, false, false);
	},

	isParentItem: function(selector){
		// is this checkbox selector a parent item?
		if( selector.children('ul').length != 0 ) 
			return true;
		else 
			return false;
	},


	listToBareArray: function() {
		// like list to array but it only contains the values

		app.bareListArray = [];
		eachListItem = $('#checklist').children('li').each( function() {

			if( $(this).children('div').is('[class^="label"]') == true ) {
				app.bareListArray.push( {
			    	"label-text" : $(this).children('div').children('span').text(),
			    });
			} else {
				if( app.isParentItem($(this)) == true ) {
					var sublistObject = [];
					$(this).children('ul').children('li').each( function() {
						sublistObject.push( {
					    	"sublist-checkbox-label" : $(this).children('div').children('label').text(),
						});
					});

					app.bareListArray.push( {
				    	"checkbox-label" : $(this).children('div').children('label').text(),
				    	"sublist" : sublistObject,
				    });		

				} else {
					app.bareListArray.push( {
						"checkbox-label" : $(this).children('div').children('label').text(),
				    });	
				}
			}

		});

		//console.log(JSON.stringify(bareListArray));
	},

	listToArray: function(){
		//var start = window.performance.now();

		app.listItems = [];
		eachListItem = $('#checklist').children('li').each( function() {

			// add checkbox-item or label to current checklist array
			//console.log("is this a checkbox? " + $(this).children('div').is('[class^="label"]'));

			// each selector corresponds to the wrapping <div>
			if( $(this).children('div').is('[class^="label"]') == true ) {
				app.listItems.push( {
			    	"selector" : $(this).children('div'), // to test: console.log($(this).children('div').html());
			    	"value" : $(this).children('div').children('span').text(),
			    	"checkbox" : false, // label would be false
			    	"checked" : false,
			    	"order" : $(this).children('div').attr('class').replace('label-',''),
			    	"sectioned" : false,
			    });

			    listItem.count++;
			} else {			

				if( app.isParentItem($(this)) == true ) {
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

					app.listItems.push( {
				    	"selector" : $(this).children('div'),
				    	"label" : $(this).children('div').children('label').text(),
				    	"checkbox" : true, // label would be false
				    	"checked" : $(this).children('div').children('input[type=checkbox]').is(':checked'),
				    	"order" : $(this).children('div').attr('class').replace('checkbox-',''),
				    	"sublist" : sublistObject,
				    });		    	

				    listItem.count++;

				} else {

					parentTester = $(this).children('div').children('input[type=checkbox]');

					app.listItems.push( {
				    	"selector" : $(this).children('div'), // <input class="css-checkbox"....><label>...
				    	"label" : $(this).children('div').children('label').text(),
				    	"checkbox" : true, // label would be false
				    	"checked" : $(this).children('div').children('input[type=checkbox]').is(':checked'),
				    	"order" : $(this).children('div').attr('class').replace('checkbox-',''),
				    });			    

				    listItem.count++;
				}
			}
		});

		//var end = window.performance.now();
		//var time = end - start;
		//console.log('Execution time (in milliseconds) ' + time);
	},

	resetList: function() {
		for( var i=0; i<app.listItems.length; i++ ) {
			if( app.listItems[i].checkbox == true ) {
				app.listItems[i].checked = false;
				app.listItems[i].selector.children('input[type=checkbox]').prop('checked', false);
				if( app.listItems[i].sublist != null && app.listItems[i].sublist.length > 0 ) {
					for( var k=0; k<app.listItems[i].sublist.length; k++ ) {
						app.listItems[i].sublist[k].checked = false;
						app.listItems[i].sublist[k].selector.children('input[type=checkbox]').prop('checked', false);
					}
				}
			}
		}

		app.calculateProgress();
		app.checkForCollapsableSection();

		app.expandAll();
	},


	expandAll: function() {
		// expand all possible lists
		for( var i=0; i<app.listItems.length; i++ ) {
			app.listItems[i].selector.show();
			if( app.listItems[i].sublist != null && app.listItems[i].sublist.length > 0 ) {
				app.listItems[i].selector.parent().children('ul').show();
				// make all the expand/collapse buttons into (-), toggle the collapsed class properly
				app.listItems[i].selector.children('a').removeClass('collapsed');
				app.listItems[i].selector.children('a').text('(-)');
				for( var k=0; k<app.listItems[i].sublist.length; k++ ) {
					app.listItems[i].sublist[k].selector.show();
				}
			}		
		}
	},

	rerender: function() {
		// refreshes the current checklist based on data in bareListArray, useful when undesirable change occurs

		// case used - deleting a sublisted item but undo-ing it puts the item into main list instead of sublist, so doing a rerender will override that
		app.loadChecklist(null, app.bareListArray, false, true);
	},

	loadChecklist: function(nameOfTemplate, template, transitionToHome, refresh) {

		app.clearCurrentList();

		console.log("load checklist using " + template);

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
			$('#homeTitle').text(nameOfTemplate + ' (Use Mode)');
			$('#editDialogLaunch').show();
			$('#editDialogLaunch').text("Edit Mode");
			
			app.readOnlyMode();

			templatechecker = template;

		}

		if( nameOfTemplate ) currentChecklist = nameOfTemplate;
		else currentChecklist = 'untitled';

		try {
			for ( i=0; i<template.length; i++) {
				for (var insideKey in template[i]) { // each insideKey = 'checkbox-label' or 'label-text'
			  		if( insideKey.match("label-text") != null ) {
			    		label.create(template[i][insideKey]);
			    	}
			    	else if( insideKey.match("checkbox-label") != null ) {
			    		listItem.create(template[i][insideKey]);
			    	}
			    	else if( insideKey.match("sublist") != null ) {
			    		for( k=0; k<template[i]['sublist'].length; k++ ) { // traverse through the sublist array of a checkbox item
			    			//console.log("***" + template[i]['sublist'][k]["sublist-checkbox-label"]);
			    			sublistItem.create(template[i]['sublist'][k]["sublist-checkbox-label"]); 
			    		}
			    	}	    	
			  	}
			}

			resave(); // run this once to add +/- buttons to parent checkbox items

			// transition to current checklist page
			if(transitionToHome == true) {
				$.mobile.changePage('#home', {transition: 'slide', reverse: false});
				app.resetButtons();
			}		

		 } catch (err) {
		 	console.log("Template was not valid, " + err);
		 }	
	},

	readOnlyMode: function() { // aka. USE MODE
		app.readOnly = true;

		// in app.readOnly mode, remove new item and new label option
		$('#newItem').hide();
		$('#newLabel').hide();
		$('#saveDialogLaunch').attr('id','resetDialogLaunch');
		$('#resetDialogLaunch').children('a').text('Reset');

		$('#progressbar').show();
		$('#progressPercent').show();

		$('#homeFooter').removeClass('ui-grid-c');
		$('#homeFooter').addClass('ui-grid-a');
		$('#clearDialogLaunch').removeClass('ui-block-c').addClass('ui-block-a');
		//$('#saveDialogLaunch').removeClass('ui-block-d').addClass('ui-block-b');
		$('#resetDialogLaunch').removeClass('ui-block-d').addClass('ui-block-b');

	},

	editMode: function() { // aka. EDIT MODE
		app.readOnly = false;
		$('#newItem').show();
		$('#newLabel').show();
		$('#resetDialogLaunch').attr('id','saveDialogLaunch');
		$('#saveDialogLaunch').children('a').text('Save');

		$('#progressbar').hide();
		$('#progressPercent').hide();

		$('#homeFooter').removeClass('ui-grid-a');
		$('#homeFooter').addClass('ui-grid-c');

		$('#clearDialogLaunch').removeClass('ui-block-a').addClass('ui-block-c');
		$('#saveDialogLaunch').removeClass('ui-block-b').addClass('ui-block-d');
	},

	resave: function(){
		if( app.deleting == true ) return; // resave only when a delete is actually confirmed.

		console.log('resave');
		// if item or label was also being renamed and then dragged, cancel that
		app.cancelRename();

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
	    		app.allowCollapsableSublists(); 
	    		$(this).children('ul').addClass('padding'); 
	    	}    	
		});

		$('li').addClass('noStyle');

		app.checkForCollapsableSection(); // if section is now empty, the label should not have a +/- button anymore
		// this must come before listToArray() - listToArray sets all checkboxes back to false

		app.listToArray();
		app.listToBareArray();

		$.jStorage.set(app.currentChecklist, app.bareListArray);
		
	},

	allowSortable: function() {
		console.log('allow sortable');

	    $('#checklist').nestedSortable({
	        handle: 'div',
	        items: 'li',
	        toleranceElement: '> div'
	    });    
	},

	// this function is run on a nestedSortable->mouseStop(), since a new collapsable button is created and needs to have a listener
	// it is also run on the page loading to attach listeners to all existing collapsable buttons
	allowCollapsableSections: function() {
	
		$('.collapseSectionButton').off('vclick');

		$('.collapseSectionButton').on('vclick', function(){
			console.log("collapse section button pressed");

			// identify current section first by getting selector for <div> of the related label
			currentLabel = $(this).parent().parent().html();

			var endOfSectionFound = false;
			for( i=0; i<app.listItems.length; i++ ) {
				if( app.listItems[i].selector.parent().html() == currentLabel ) {
					for( j=i+1; j<app.listItems.length; j++ ) {
						if( app.listItems[j].checkbox == true && endOfSectionFound == false ) {
							app.listItems[j].selector.toggle('slow');
							console.log("collapse this checkbox = " + j);
							// if this item has sublist items, hide/show those too
							if( app.listItems[j].sublist ) {
								for( k=0; k<app.listItems[j].sublist.length; k++ ) {
									app.listItems[j].sublist[k].selector.toggle('slow');
								}
							}
						} else if( app.listItems[j].checkbox == false ) {
							endOfSectionFound = true;
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
	},


	// this function is run on a nestedSortable->mouseStop(), since a new collapsable button is created and needs to have a listener
	// it is also run on the page loading to attach listeners to all existing collapsable buttons
	allowCollapsableSublists: function() {
		
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
	},

	changeName: function () {
		if(app.checkboxBeingRenamed != undefined) {
			app.checkboxBeingRenamed.next('label').text($('#renameField').val());
			app.checkboxBeingRenamed.off('click mouseup');
			app.checkboxBeingRenamed.parent().toggleClass('rename');
		} else if( app.labelBeingRenamed != undefined ) { 
			app.labelBeingRenamed.text($('#renameField').val());
			app.labelBeingRenamed.parent().toggleClass('rename');
		}

		$('#renameGrid').hide();

		app.listToArray();
		app.listToBareArray();
		$.jStorage.set(app.currentChecklist, app.bareListArray);

		app.disableRename = false; // allow renaming again
	},

	cancelRename: function() {
		if( app.checkboxBeingRenamed != undefined ) {
			app.checkboxBeingRenamed.off('click mouseup');
			app.checkboxBeingRenamed.parent().removeClass('rename');
			app.checkboxBeingRenamed.next('label').text( app.checkboxBeingRenamed.next('label').text().replace(" (renaming)", "") ); // ugly code 
		} else if( app.labelBeingRenamed != undefined ) { 
			app.labelBeingRenamed.parent().removeClass('rename');
			app.labelBeingRenamed.text( app.labelBeingRenamed.text().replace(" (renaming)", "") );
		}

		$('#renameGrid').hide();

		app.disableRename = false; // allow renaming again
	},

	deleteDetected: function(item, pos) {
	
		app.disableRename = true; // disable taphold (renaming) for all items

		something = item; // for debug

		if( pos < -20 && app.deleting == false) {
			app.deleting = true;
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
				app.deleting = false;
				app.disableRename = false;
				$('#undoDeleteItem').remove();
				$('#confirmDeleteItem').remove();
				//rerender(); // bug exists where a sublisted item is not placed back into the sublist, need to re-render list from raw data
				// however rerendering unchecks all boxes, which is undesirable
			});

			$('#confirmDeleteItem').on('vclick', function(e) {
				$(item).remove();
				app.deleting = false;
				app.disableRename = false;
				$('#undoDeleteItem').remove();
				$('#confirmDeleteItem').remove();
				resave();	
			});			
		}	

		$('[data-role="button"]').button(); 
	},


	calculateProgress: function () {

		currentProgress = 0;
		progressDenominator = 0;

		for( var i=0; i<app.listItems.length; i++ ) {
			if( app.listItems[i].checkbox == true ) {
				if( app.listItems[i].selector.children('input[type=checkbox]').prop('checked') == true ) {
					if( app.listItems[i].sublist == null || app.listItems[i].sublist.length == 0 ) {
						currentProgress++;	
					}
				}

				if( app.listItems[i].sublist != null && app.listItems[i].sublist.length > 0 )	{
					for( var j=0; j<app.listItems[i].sublist.length; j++ ) {
						if( app.listItems[i].sublist[j].selector.children('input[type=checkbox]').prop('checked') == true ) {
							currentProgress++;
						}					
					}
					progressDenominator = progressDenominator + app.listItems[i].sublist.length;
				}	
				
				if( app.listItems[i].sublist == null || app.listItems[i].sublist.length == 0 ) progressDenominator++;
			}
		}

		app.progressPercentage = currentProgress/progressDenominator * 100;

		$( '#progressbar' ).progressbar({
	      value: app.progressPercentage
	    });

	    app.progressPercentage = Math.round(app.progressPercentage);

	    $( '#progressPercent' ).text('Progress: ' + app.progressPercentage + '%');

	    if( app.progressPercentage >= 100 )
	    	$('#completedPopup').popup("open");
	},

	resetButtons: function () {
		removeButtonHighlights();
		$('#inputGrid').hide();
	},

	removeButtonHighlights: function () {
		$('.ui-btn-active').removeClass('ui-btn-active'); // jQuery Mobile doesn't unhighlight clicked buttons automatically
	},

	saveTemplate: function( nameToSave ) {
		if( nameToSave ) {
			var savedListName = nameToSave;
		} else {
			var savedListName = $('#saveField').val().replace(/\s/g,"-"); // replace spaces with hyphens for valid id
			savedListName = savedListName.replace(/\./g, '-'); // replace periods with hyphens
		}
		
		app.bareListArray.push( { "name" : savedListName } ); // bareListArray.name or ["name"] = savedListName; won't be seen or stringified

		// save the list into local storage
		console.log(JSON.stringify(app.bareListArray));
		var savedListString = JSON.stringify(app.bareListArray);
		$.jStorage.set(savedListName, savedListString);
		console.log("Saved list named: " + savedListName + " and the list looks like this:\n" + savedListString);
		$.jStorage.set('untitled', null); // wipe untitled list

		// save the templates into local storage
		listOfChecklists[savedListName] = savedListString;
		$.jStorage.set('listOfChecklists', listOfChecklists);

		app.renderTemplates();

		app.clearCurrentList();

		setTimeout(function() {
			$('#savedDialog').popup("open");
		}, 300);
	},

	initialize: function() {

		app.allowSortable();

		var addingItem = true;
		var storing = true; // for testing only
		var inputShown = false;

		// jquery mobile re-style
		$('[type="text"]').textinput();
		$('[type="button"]').button();

		$('#inputGrid').hide();	
		$('#renameGrid').hide();	

		$('#newItem').on('vclick', function(){
			if( app.readOnly == true ) {
				removeButtonHighlights();
				return; // no changes allowed in read-only mode
			}

			app.cancelRename();

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
			if( app.readOnly == true ) {
				removeButtonHighlights();
				return; // no changes allowed in read-only mode
			}

			app.cancelRename();

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
			app.cancelRename();
			// load page manually instead of using the a href link, which uses the default slow click
			$.mobile.changePage('#templates', {transition: 'slide'});
		});

		$('#homeLink').on('vclick', function(){
			// load page manually instead of using the a href link, which uses the default slow click
			$.mobile.changePage('#home', {transition: 'slide', reverse: true});
		});

		/* Delete the whole list */
		$('#clearDialogLaunch').on('vclick', function(){ 
			app.cancelRename();
			$('#clearDialog').popup("open", { overlayTheme: "a" });
		});

		$('#clear').on('vclick', function(){ 
			app.clearCurrentList();
			app.resetButtons();
		});

		// sharing the list as a JSON URI via Android SocialSharing plugin to any textable application
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

			var readOnlyTemp = app.readOnly; // because below methods will change app.readOnly's value,
			// so we need to store what app.readOnly is before the methods and interpret that instead

			// re-render
			var currentBareListArray = app.bareListArray;
			app.clearCurrentList();
			app.loadChecklist(app.currentChecklist, JSON.stringify(currentBareListArray), false, false);

			if( app.readOnlyTemp == false ) {
				$('#homeTitle').text(currentChecklist + ' (use mode)');
				$(this).text("Edit Mode");
				app.readOnly = true;
			}
			else {
				$('#homeTitle').text(currentChecklist + ' (edit mode)');
				$(this).text("Use Mode");
				app.editMode();
			}
		});

		/* Save the list as a template */
		$('#saveDialogLaunch').on('vclick', function(){ 

			app.app.resetButtons();

			if( app.readOnly == true ) {
				$('#resetDialog').popup("open");
				return;
			}

			app.cancelRename();
			if( app.bareListArray.length == 0 ) {
				$('#noSavingDialog').popup("open", { overlayTheme: "a" });
				setTimeout(function(){ 
					removeButtonHighlights(); // since this line is called before button becomes highlighted, need to delay the removal
				}, 300);
			} else {
				$('#saveDialog').popup("open", { overlayTheme: "a" });
			}
		});

		$('#resetDialogLaunch').on('vclick', function(){ 
			$('#resetDialog').popup("open", { overlayTheme: "a" });
		});

		$('#resetConfirm').on('vclick', function(){ 
			app.resetList();
			app.app.resetButtons();
		});	

		$('#save').on('vclick', function() {
			app.saveTemplate();
		});

		/* Template page template links */
		$('#confirmLoadTemplate').on('vclick', function(){
			app.loadChecklist(null, templateToLoad, true, false);
		});

		if( app.jStorageTesting == true ) {
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
		}

		/* Load a list as a template */
		$('#loadDialogLaunch').on('vclick', function(){ 
			$('#loadDialog').popup("open", { overlayTheme: "a" });
		});

		$('#load').on('vclick', function(){
			decodeURIandLoad($('#loadField').val());
		});

		$("#inputField").focus(function() {
		    $(this).data("hasfocus", true);
		});

		$("#inputField").blur(function() {
		    $(this).data("hasfocus", false);
		});

		$(document.body).keyup(function(ev) {
		    if (ev.which === 13) {
		    	if($("#inputField").data("hasfocus"))
		        	addItemOrLabel();
		        
		        if($('#saveField').data("hasfocus"))
		        	saveTemplate();
		    }	    	
		});

		function addItemOrLabel() {
			if( addingItem == true ) {
				listItem.create();
			}
			else {
				label.create();
			}
			$('#inputField').val('');
			setTimeout(function() {
				$('#inputField').focus();
			}, 200);
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
			app.cancelRename();
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

		var existingChecklist = $.jStorage.get('untitled');
		app.loadChecklist(null, existingChecklist, false, true); // name of template is [null] (untitled), template, transitionToHome, refresh
		app.editMode();

		// load the template page
		listOfChecklists = $.jStorage.get('listOfChecklists') || {}; // if variable didn't exist in local storage, use empty object instead
		app.renderTemplates();

		$('#editDialogLaunch').hide();

		$( '#progressbar' ).progressbar({
	      value: 0
	    });

	    $('#progressPercent').text('Progress: 0%');

		// initialize PhoneGap/Cordova code
		index.initialize();
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

$(document).ready(function() {	
	app.initialize();
});