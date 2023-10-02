   /* List Manipulations */

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
                       currentSectionCounter++;
                   } else {
                       if( listItems[j].checkbox == false  && listItems[j-1].checkbox == false ) {
                           allItemsChecked = false;
                       }
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

       calculateProgress();
   }