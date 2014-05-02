var sublistItem = {
	count: 1,

	create: function(fieldValue) {
		var inputValue = fieldValue;

		console.log("make sublist item");

		// find the last item in the current checklist HTML, insert an <ul> if it doesnt exist, and then append the sublist item to the <ul>
		if($('#checklist').children('li').last().children('ul').length == 0 ) {
			$('#checklist').children('li').last().append('<ul class="padding"></ul>');
		}

		var newSublistItem = '<li class="noStyle"><div class="sublist-checkbox-'+sublistItem.count+'"><input class="css-checkbox" data-role="none" type="checkbox" name="sublist-checkbox-'+sublistItem.count+'" id="sublist-checkbox-'+sublistItem.count+'"  data-inline="true" />\
	                <label for="sublist-checkbox-'+sublistItem.count+'" class="css-label">' + inputValue + '</label></div></li>';

	    $('#checklist').children('li').last().children('ul').append(newSublistItem);

		$('#sublist-checkbox-'+sublistItem.count).change( function(event) { 
			if( app.readOnly == false || $(this).parent().hasClass('rename') ) {
				$(this).prop("checked", false);
				return; // don't trigger checkbox change event if renaming
			}

			if( $(this).parent().parent().parent().parent().children('div').children('a').length > 0 ) {
				
				var otherItemsChecked = true;

				$(this).parent().parent().parent().children('li').each( function() {
					if( $(this).children('div').html() ) { // prevents "ui-sortable-placeholder", an automatically inserted <li>, to be sublistItem.counted as a checkbox
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
		    	
		    	$('#checkbox-'+sublistItem.count).parent().parent().children('ul').find('input[type=checkbox]').prop( "checked", function( i, val ) {
		  		    return parentChecked;
				});			

				console.log("turned a checkbox into->" + parentChecked);

				// the following code is for collapsing each labelled section - we only care if the parent is checked or not
			   	// since if a section's sublist item is unchecked, its parent will not be checked regardless
				app.listItems.forEach(function(element) {
			    	if( element.order == sublistItem.count ) {
			    		element.checked = parentChecked;
			    	}
			    });

			    app.checkForCollapsableSection();
		    }
	    }); 

	    $( 'div.sublist-checkbox-'+sublistItem.count ).bind( "taphold", function(event) {
	    	if( app.readOnly == true || app.disableRename == true ) return; // no changes allowed in readOnly

	    	app.disableRename = true; // do not allow multiple renames 

	    	$('#inputGrid').hide(); // if input grid was visible, hide it now
	    	$('#renameGrid').show();
	    	$('#renameField').val($(this).children('label').text());

	    	app.checkboxBeingRenamed = $(this).children('input[type=checkbox]'); // instead of $('#sublist-checkbox'+sublistItem.count), because the naming is probably different at the time of binding

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

	    $( 'div.sublist-checkbox-'+sublistItem.count ).bind("mousedown", function(event) {
	    	if( app.readOnly == true ) {	    		
	    		return false;
	    	}
	    });

	    sublistItem.count++;
	}
}