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

var watch_list = [], filter_name = 'filter_list';
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
		if(check(tabs)){
			toggle(tabs);
		}
	});
}
/*******************************/
function handleClosedTab(tabId, changeInfo, tab){
	chrome.storage.local.remove(tabId.toString());
}
/******************************/
function handleTabs(tabId, changeInfo, tab){
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
	var tabKey = isNaN(tabId) ? tabId.tabId.toString() : tabId.toString();
		if(check(tabs)){
		chrome.storage.local.get(tabKey, function(res){
			if(typeof res[tabKey] === 'undefined'){
				var tabs_list = {};
				tabs_list[tabKey] = 'active';
				chrome.browserAction.setIcon({path:"icons/active.png"});
				chrome.storage.local.set(tabs_list);
				chrome.tabs.executeScript(tabId.tabId, {file: "/src/inject/page.js"});
			}else{
				chrome.browserAction.setIcon({path:"icons/"+res[tabKey]+".png"});
			}
		});
		}else{
			chrome.browserAction.setIcon({path:"icons/icon19.png"});
			chrome.storage.local.remove(tabKey.toString());
		}
	});
}
/*******************************/
function toggle(tabs){
	chrome.tabs.sendMessage(tabs[0].id, {cmd:'toggle'}, function(res){
		if(typeof res === 'object'){
			var tabs_list = {};
			tabs_list[tabs[0].id] = res.cmd;
			chrome.storage.local.set(tabs_list);
			chrome.browserAction.setIcon({path:"icons/"+res.cmd+".png"});
		}
	});
		
}
/*******************************/
function check(obj){
	try{
		var filter_list = localStorage.getItem(filter_name) || '';
		var filters = filter_list.split(',');
		var url = obj[0].url;
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
})();

