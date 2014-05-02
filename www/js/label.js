var label = {
    create: function(fieldValue){
        var inputValue = fieldValue;
        if( !inputValue ) inputValue = $('#inputField').val();
        if( !inputValue ) return;

        var itemNum = listItem.count;

        var newLabel = '<li class = "mjs-nestedSortable-no-nesting"><div class="label-'+itemNum+' checklist-label"><span>' + inputValue + '</span></div></li>';
        
        $('.list').append(newLabel);

        // add this new checkbox to the array, in the format of {jQuery selector, checkbox, checked, label, order}
        app.listItems.push( {
            "selector" : $('.label-'+itemNum),
            "value" : inputValue,
            "checkbox" : false, // label would be false
            "checked" : false, 
            "order" : itemNum, // probably not needed....
            "sectioned" : false,
        });

        // allow renaming
        $( 'div.label-'+itemNum ).bind( "taphold", function(event) {
            if( app.readOnly == true || app.disableRename == true ) return; // no changes allowed in readOnly

            app.disableRename = true; // do not allow multiple renames 

            console.log("Rename, cut off click or mouseup for now");
            $('#inputGrid').hide(); // if input grid was visible, hide it now
            $('#renameGrid').show();
            $('#renameField').val($(this).children('span').text());

            $(this).children('span').text($(this).children('span').text() + " (renaming)");
            $(this).toggleClass('rename');
            app.checkboxBeingRenamed = undefined;
            app.labelBeingRenamed = $(this).children('span');
        }); 

        $( 'div.label-'+itemNum ).bind("mousedown", function(event) {
            if( app.readOnly == true ) {                
                return false;
            }
        });

        listItem.count++;   

        app.listToArray();
        app.listToBareArray();

        $.jStorage.set(app.currentChecklist, app.bareListArray);
    }
}