   /* UI Interactions */

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

   function removeButtonHighlights() {
       $('.ui-btn-active').removeClass('ui-btn-active'); // jQuery Mobile doesn't unhighlight clicked buttons automatically
   }