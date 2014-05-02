var listItem = {
	count: 1,
	
	create: function( fieldValue ) {
		var inputValue = fieldValue;
		if( !inputValue ) inputValue = $('#inputField').val();
		if( !inputValue ) return;

		var itemNum = listItem.count;

		var newItem = '<li><div class="checkbox-'+itemNum+'"><input class="css-checkbox" data-role="none" type="checkbox" name="checkbox-'+itemNum+'" id="checkbox-'+itemNum+'"  data-inline="true" />\
	                <label for="checkbox-'+itemNum+'" class="css-label">' + inputValue + '</label></div></li>';
	   
	    $('.list').append(newItem);

	    // add this new checkbox to the array, in the format of {jQuery selector, checkbox, checked, label, order}
	    app.listItems.push( {
	    	"selector" : $('.checkbox-'+itemNum),
	    	"label" : inputValue,
	    	"checkbox" : true, // label would be false
	    	"checked" : false,
	    	"order" : itemNum, // probably not needed....
	    });

	    // auto ticking of higher level boxes
		$('#checkbox-'+itemNum).change( function(event) { 

			if( app.readOnly == false || $(this).parent().hasClass('rename') ) {
				$(this).prop("checked", false);
				return; // don't trigger checkbox change event if renaming
			}

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
				app.listItems.forEach(function(element){ 
					if(element.order == myParent.attr('id').replace('checkbox-','')) {
						element.checked = otherItemsChecked;
					}
				});

				app.checkForCollapsableSection();
			}

			else {

				var parentChecked = $(this).is(':checked');
		    	
		    	$('#checkbox-'+itemNum).parent().parent().children('ul').find('input[type=checkbox]').prop( "checked", function( i, val ) {
		  		    return parentChecked;
				});			

				console.log("turned a checkbox into->" + parentChecked);

				// the following code is for collapsing each labelled section - we only care if the parent is checked or not
			   	// since if a section's sublist item is unchecked, its parent will not be checked regardless
				app.listItems.forEach(function(element) {
			    	if( element.order == itemNum ) {
			    		element.checked = parentChecked;
			    	}
			    });

			    app.checkForCollapsableSection();
		    }
	    }); 

	    $( 'div.checkbox-'+itemNum ).bind( "taphold", function(event) {
	    	if( app.readOnly == true || app.disableRename == true ) return; // no changes allowed in readOnly

	    	app.disableRename = true; // do not allow multiple renames 

	    	console.log("Rename, cut off click or mouseup for now");
	    	$('#inputGrid').hide(); // if input grid was visible, hide it now
	    	$('#renameGrid').show();
	    	$('#renameField').val($(this).children('label').text());

	    	app.checkboxBeingRenamed = $(this).children('input[type=checkbox]');

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
	    	if( app.readOnly == true ) {    		
	    		return false;
	    	}
	    });

	    // do not run this line if this is an item created from a template, or it will cause an infinite loop in loadChecklist()
	    if(!fieldValue) app.addToCollapsableSection(); // forces a collapsed section list to show itself again 

	    listItem.count++;

	    app.listToArray();
		app.listToBareArray();

	    $.jStorage.set(app.currentChecklist, app.bareListArray);
	}
}