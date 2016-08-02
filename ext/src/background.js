"use strict";
(function(){
/*************************************
## no comment background script
* retrieves watch list
* get filters from localstorage
* add listeners:
	button click
	tabs event
		update, activate, removed
	page request
* on button press toggle icon send page request
* tab updates apply local var if possible
* toggles png's: active, disabled, icon19
*************************************/

var watch_list = [], filter_name = 'filter_list', known_tabs=[], buffer=false;
var next = function(){
	chrome.browserAction.onClicked.addListener(handleButtonPress);
	chrome.tabs.onUpdated.addListener(handleTabs);
	chrome.tabs.onActivated.addListener(handleTabs);
	chrome.tabs.onRemoved.addListener(handleClosedTab);
	chrome.runtime.onMessage.addListener(messageHandler);
};

loadWatchList(next);

/*******************************/
function messageHandler(request, sender, sendResponse) {
		if(typeof request === 'object'){
			chrome.browserAction.setIcon({path:"icons/"+request.cmd+".png"});
		}
}
function loadWatchList(callback){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = handleStateChange;
	xhr.open("GET", chrome.extension.getURL('/src/watch_list.json'), true);
	xhr.send();
	function handleStateChange(res){
		if (xhr.readyState === 4) {
			watch_list = JSON.parse(xhr.responseText);
			callback();
		}
	}
}
/*******************************/
function handleButtonPress(){
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
		if(isWatched(tabs[0])){
			toggle(tabs[0]);
		}
	});
}
/*******************************/
function handleClosedTab(tabId, changeInfo, tab){
	delete known_tabs[tabId.toString()];
}
/******************************/
function handleTabs(tabId, changeInfo, tab){
	var tabKey = isNaN(tabId) ? tabId.tabId.toString() : tabId.toString();
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
		if(isWatched(tabs[0])){
			if(typeof changeInfo==='object' && changeInfo.status==='complete'){
				if(!buffer){
					buffer = true;
					//todo - more efficient way to only execute once
					chrome.tabs.sendMessage(tab.id, {cmd:'ping'}, function(res){
						buffer = false;
						if(res !== 'ping'){
							console.log("injecting script");
							chrome.tabs.executeScript(tabId.tabId, {file: "/src/inject/page.js"}, tabCheck);
						}else{
							tabCheck();
						}
					});
				}
			}
		/********************************/
		function tabCheck(){
			if(typeof known_tabs[tabKey] === 'string'){
				var tabStatus = known_tabs[tabKey];
				chrome.browserAction.setIcon({path:"icons/"+tabStatus+".png"});
			}else{
				chrome.browserAction.setIcon({path:"icons/active.png"});
				var tabStatus = 'active';
				known_tabs[tabKey] =  'active';
			}
			//chrome.tabs.sendMessage(tab.id, {cmd:tabStatus});
		}

			/********************************/

		}else{
			delete known_tabs[tabId.toString()];
			chrome.browserAction.setIcon({path:"icons/icon19.png"});
		}

	});
}
/*******************************/
function toggle(tab){
	var tabKey = tab.id.toString();
	var status = known_tabs[tabKey];
	var cmd = status === 'active' ? 'disabled' : 'active';
	known_tabs[tabKey] = cmd;
	chrome.browserAction.setIcon({path:"icons/"+cmd+".png"});
	chrome.tabs.sendMessage(tab.id, {cmd:cmd}, function(res){
		if(typeof res !== 'undefined'){
			console.log(res);
		}
	});
}
/*******************************/
function isWatched(obj){
	try{
		var filter_list = localStorage.getItem(filter_name) || '';
		var filters = filter_list.split(',');
		var url = obj.url;
		for(var i in watch_list){
			if(url.indexOf(watch_list[i].site) > -1){
				if(!filter(watch_list[i].site, filters)){
					return true;
				}
			}
		}
		return false;
		function filter(url,filters){
			for(var i=0;i<filters.length;i++){
				if(filters[i].indexOf(url) > -1){
					return true;
				}
			}
			return false;
		}
	}catch(e){
		return false;
	}

}
/*******************************/


})();

