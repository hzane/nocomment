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
		clearInterval(readyStateCheckInterval);
		chrome.runtime.onMessage.addListener(main.handleButton);
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
main.handleButton = function(request, sender, callback){
		if(request.cmd==='ping'){
			callback(request.cmd);
		}else{
			main[request.cmd](callback);
		}
};
main.load = function(callback){
	try{
			if(main.uid.length){return false;}
			main.current_page = window.location.href;
			main.uid = 'nocomment--cbxjyzbgty_32LLoX7978a';
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = handleStateChange;
			xhr.open("GET", chrome.extension.getURL('/src/watch_list.json'), true);
			xhr.send();
			function handleStateChange(){
				if (xhr.readyState === 4) {
					main.watch_list = JSON.parse(xhr.responseText);
					for(var i=0;i<main.watch_list.length;i++){
						if(main.current_page.indexOf(main.watch_list[i].site)){
							callback();
							break;
						}
					}
				}
			}

	}catch(e){
		console.log(e);
	}
	
}
main.start = function(){
	/* active:hide comments || disabled:show */
	main.status = 'active';
	var matches = main.sync_site();
	if(matches){
		main.active();
	}
}
main.sync_site = function(){
	var current_page = main.current_page, key = 'site';
	var list = main.watch_list, res=[];
	main.page_selectors = [];
	for(var i in list){
		if(current_page.indexOf(list[i][key]) > -1){
			if(!filter(list[i][key], main.filters)){
				res.push(list[i]);
				main.page_selectors.push(list[i].selector);
			}
		}
	}
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
	if(typeof callback === 'function'){
		callback({cmd:val});
	}
}
main.active = function(callback){
	try{
		main.status = 'active';
		var sheet = document.getElementById(main.uid);
		if(document.getElementsByTagName('body')[0].contains(sheet)){
			return true;
		}
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
		style.innerHTML = rules;
		document.getElementsByTagName('body')[0].appendChild(style);
		if(typeof callback === 'function'){
			var val = 'active';
			callback({cmd:val});
		}
	}catch(e){
		console.log(e);
	}
}
main.disabled = function(callback){
	try{
		main.status = 'disabled';
		var sheet = document.getElementById(main.uid);
		document.getElementsByTagName('body')[0].removeChild(sheet);
		if(typeof callback === 'function'){
			var val = 'disabled';
			callback({cmd:val});
		}
	}catch(e){
		console.log(e);
	}
}


})();

