
(function(){
/*************************************/

	chrome.runtime.onMessage.addListener(function(request, sender, callback){
		main[request.cmd](callback);
	    return true;
	});

/*************************************/

	var readyStateCheckInterval = setInterval(function() {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			main.load(main.page_start);
		}
	}, 100);

/*************************************/

var main = {
	watch_list:{},
	page_selectors:[],
	current_page:'',
	uid:'',
	status:'',
	filter_name:'filter_list',
	filters:[]
};
main.load = function(callback){
		main.current_page = window.location.hostname;
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

}
main.page_start = function(){
	/* status == default hide || show ***********/
	main.status = 'hide';
	main.uid = Math.random().toString(36).slice(2);
	chrome.runtime.sendMessage({cmd:'getfilters'}, function(res){
		main.filters = res.split(',');
		var matches = main.sync_site();
		if(matches){
			main[main.status]();
		}
	});
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
	if(main.status !== 'hide'){
		main.hide();
		var val = 'active';
	}else{
		main.show();
		var val = 'disabled';
	}

	if(typeof callback === 'function'){
		callback({cmd:val});
	}
}
main.hide = function(callback){
	main.status = 'hide';
	var style = document.createElement('style');
	style.type = 'text/css';
	var rules = '';
	for(var i=0;i<main.page_selectors.length;i++){
		var selector = main.page_selectors[i];
		var rule = selector + '{display:none;opacity:0;}';
		rules += rule;
	}
	style.id='nocomment-'+main.uid;
	style.setAttribute('id', style.id);
	style.innerHTML = rules;
	document.getElementsByTagName('head')[0].appendChild(style);

	if(typeof callback === 'function'){
		var val = 'active';
		callback({cmd:val});
	}
}
main.show = function(callback){
	main.status = 'show';
	var sheet = document.getElementById('nocomment-'+main.uid);
	document.getElementsByTagName('head')[0].removeChild(sheet);

	if(typeof callback === 'function'){
		var val = 'disabled';
		callback({cmd:val});
	}
}
main.page_update = function(){}
main.extension_listener = function(command){}
main.extension_broadcast = function(status){}

/*
extension_listener(string command)
	executes main with command

extension_broadcast(string status)
	sends message to background

page_start()
	load remote map
	check local for page status
	generate spreadsheet save
	execute main with status or hide

page_update()
	execute main with status

sync_site(string current site)
	returns obj of rules where site match

hide(string class name)
	sets local.status

show(string class name)
	sets status
	select elms
	loop elms 
*/




})()

