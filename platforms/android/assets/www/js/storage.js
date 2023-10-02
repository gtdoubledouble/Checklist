   /* Storage Management */

   function testStore() {
       if( !$('#inputField').val() ) return;
       $.jStorage.set($('#inputField').val(), "someValue");
       alert('stored the value key = ' + $('#inputField').val() + ', value = someValue');
   }

   function testRetrieve() {
       if( !$('#inputField').val() ) return;
       alert('retrieved the value (hopefully = someValue): ' + $.jStorage.get($('#inputField').val()));
   }