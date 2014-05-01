function addItem() {
	createNewItem("hi");
}

function addSubItem() {
	createNewSublistItem("hi");
}

function tickSomething( sel ) {
	sel.prop("checked",true);
	sel.trigger("change");
	resave();
}

function runTests() {
	clearCurrentList();
	addItem();
	addSubItem();
	addSubItem();

	addItem();
	addSubItem();
	addSubItem();

	resave();

	saveTemplate("testing-template");

	loadChecklist("testing-template", listOfChecklists["testing-template"], true, false);

	if(currentChecklist == "testing-template") {
		console.log("Test 1 passed");
	}
	if(bareListArray.length > 0) {
		console.log("Test 2 passed");
	}

	// manually check the first parent box
	tickSomething(listItems[0].selector.children('input'));	
	// check if sub items are ticked as well
	if(listItems[0].sublist[0].checked && listItems[0].sublist[1].checked)
		console.log("Test 3 passed");

	// manually check child boxes of second sublist
	tickSomething(listItems[1].sublist[0].selector.children('input'));
	tickSomething(listItems[1].sublist[1].selector.children('input'));
	if(listItems[1].checked == true)
		console.log("Test 4 passed");

	// test the progress percentage thing
	if(progressPercentage == 100)
		console.log("Test 5 passed");

	setTimeout(function() {
		resetList();
	}, 500);

	if(progressPercentage == 0)
		console.log("Test 6 passed");


}