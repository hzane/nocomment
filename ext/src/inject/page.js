"use strict";
(function(){
/*************************************
## main obj literal
* listen for toggle request
* return status
* retrieves watch list
* generates CSS file 
* attach or removes css
*************************************/


	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			console.log("ok");
			clearInterval(readyStateCheckInterval);
			chrome.runtime.onMessage.addListener(main.buttonPress);
			setTimeout(function(){
				main.load(main.start);
			
			}, 100);
		}
	}, 100);

var main = {
	watch_list:{},
	page_selectors:[],
	current_page:'',
	uid:'',
	status:'',
	filter_name:'filter_list',
	filters:[]
};
main.buttonPress = function(request, sender, callback){
		if(request.cmd==='ping'){
		console.log("ping");
			callback(request.cmd);
		}else{
		console.log("ding");
		console.log(request.cmd);
			main[request.cmd](callback);
		}
};
main.load = function(callback){
	try{
			if(main.uid.length){console.log("!!!!");return false;}
			console.log("loading");
			main.current_page = window.location.href;
			main.uid = 'nocomment--cbxjyzbgty_32LLoX7978a';
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = handleStateChange;
			xhr.open("GET", chrome.extension.getURL('/src/watch_list.json'), true);
			xhr.send();
			function handleStateChange(){
				if (xhr.readyState === 4) {
					main.watch_list = JSON.parse(xhr.responseText);
					console.log(main.current_page);
					for(var i=0;i<main.watch_list.length;i++){
						console.log(main.watch_list[i].site);
						if(main.current_page.indexOf(main.watch_list[i].site)){
							console.log("watching "+main.watch_list[i].site);
							callback();
							break;
						}
					}
				}
			}

	}catch(e){
		console.log("error 0");
		console.log(e);
	}
	
}
main.start = function(){
	/* status == default active:hide comments || disabled:show ***********/
	main.status = 'active';
	console.log("start");
	var matches = main.sync_site();
	if(matches){
		console.log("1-"+main.status);
		main[main.status]();
	}
}
main.clear = function(){
	try{
		console.log("clearing");
		main.disabled();
		chrome.runtime.onMessage.removeListener(main.buttonPress);
		main = {};

	}catch(e){
		console.log(e);
	}
}
main.sync_site = function(){
	var current_page = main.current_page, key = 'site';
	console.log(current_page);
	var list = main.watch_list, res=[];
	main.page_selectors = [];
	console.log("syncing");
	console.log(list);
	for(var i in list){
		if(current_page.indexOf(list[i][key]) > -1){
			if(!filter(list[i][key], main.filters)){
				res.push(list[i]);
				main.page_selectors.push(list[i].selector);
			}
		}
	}
	console.log(main.page_selectors);
	function filter(needle, items){
		for(var i=0;i<items.length;i++){
			if(items[i].indexOf(needle) > -1){
				return true;
			}
		}
		return false;
	}
	return res.length;
}
main.toggle = function(callback){
	if(main.status !== 'active'){
		main.active();
		var val = 'active';
	}else{
		main.disabled();
		var val = 'disabled';
	}
console.log("toggling: " + val);
	if(typeof callback === 'function'){
		callback({cmd:val});
	}
}
main.active = function(callback){
	try{
		console.log("activate");
		var sheet = document.getElementById(main.uid);
		if(document.getElementsByTagName('body')[0].contains(sheet)){
			console.log("zz??");
		}
		main.status = 'active';
		var style = document.createElement('style');
		var sheet = style.sheet;
		style.type = 'text/css';
		style.id=main.uid;
		style.setAttribute('id', style.id);
		var rules = '';
		for(var i=0;i<main.page_selectors.length;i++){
			var selector = main.page_selectors[i];
			var rule = selector + '{display:none;}';
			rules += rule;
		}
		console.log('add ' + style.id);
		style.innerHTML = rules;
		setTimeout(function(){
			document.getElementsByTagName('body')[0].appendChild(style);	
		},2500)
		

		if(typeof callback === 'function'){
			var val = 'active';
			callback({cmd:val});
		}

	}catch(e){
		console.log("error 1");
		console.log(e);
	}
}
main.disabled = function(callback){
	try{
		main.status = 'disabled';
		var sheet = document.getElementById(main.uid);
		document.getElementsByTagName('body')[0].removeChild(sheet);

		console.log('remove ' + sheet.id);
		if(typeof callback === 'function'){
			var val = 'disabled';
			callback({cmd:val});
		}

	}catch(e){
		console.log("error 2");
		console.log(e);
	}
}


})();

