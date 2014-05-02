function addItem() {
	listItem.create("hi");
}

function addSubItem() {
	sublistItem.create("hi");
}

function tickSomething( sel ) {
	sel.prop("checked",true);
	sel.trigger("change");
	app.resave();
}

function runTests() {
	app.clearCurrentList();
	addItem();
	addSubItem();
	addSubItem();

	addItem();
	addSubItem();
	addSubItem();

	app.resave();

	app.saveTemplate("testing-template");

	app.loadChecklist("testing-template", listOfChecklists["testing-template"], true, false);

	if(app.currentChecklist == "testing-template") {
		console.log("Test 1 passed");
	}
	if(app.bareListArray.length > 0) {
		console.log("Test 2 passed");
	}

	// manually check the first parent box
	tickSomething(app.listItems[0].selector.children('input'));	
	// check if sub items are ticked as well
	if(app.listItems[0].sublist[0].checked && app.listItems[0].sublist[1].checked)
		console.log("Test 3 passed");

	// manually check child boxes of second sublist
	tickSomething(app.listItems[1].sublist[0].selector.children('input'));
	tickSomething(app.listItems[1].sublist[1].selector.children('input'));
	if(app.listItems[1].checked == true)
		console.log("Test 4 passed");

	// test the progress percentage thing
	if(app.progressPercentage == 100)
		console.log("Test 5 passed");

	setTimeout(function() {
		app.resetList();
	}, 500);

	if(app.progressPercentage == 0)
		console.log("Test 6 passed");


}