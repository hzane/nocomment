"use strict";
(function(){
/*************************************
## no comment background script
* retrieves watch list then
* get user filters from localstorage
* add listeners:
	button click
	tabs events: update, activate, removed
* if site watched test known tabs 
* ping test for content script inject if null
* on button press toggle icon send content toggle
* toggle thumbs: active.png, disabled.png, icon19.png

*************************************/

var watch_list = [], filter_name = 'filter_list', known_tabs={};
var next = function(){
	chrome.browserAction.onClicked.addListener(handleButtonPress);
	chrome.tabs.onUpdated.addListener(handleTabs);
	chrome.tabs.onActivated.addListener(handleTabs);
	chrome.tabs.onRemoved.addListener(handleClosedTab);
	chrome.runtime.onMessage.addListener(messageHandler);
};

init(next);

/*******************************/
function messageHandler(request, sender, sendResponse) {
		if(typeof request === 'object'){
			chrome.browserAction.setIcon({path:"icons/"+request.cmd+".png"});
		}
}
function init(callback){
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
	//chrome.storage.onChanged.addListener(function(changes, namespace) {});
}
/*******************************/
function handleButtonPress(){
	console.log("1");
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
		console.log("2");
		if(isWatched(tabs[0])){
			console.log("3");
			toggle(tabs[0]);
		}
	});
}
/******************************/
function handleTabs(tabId, changeInfo, tab){
	try{
		var tabKey = isNaN(tabId) ? tabId.tabId.toString() : tabId.toString();
		chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
			if(isWatched(tabs[0])){
				iconCheck(tabKey);
				//todo - more efficient way to only execute once
				tab = tabs[0];
				chrome.tabs.sendMessage(tab.id, {cmd:'ping'}, function(res){
					if(res !== 'ping'){
						chrome.tabs.executeScript(tabId.tabId, {file: "/src/inject/page.js"});
					}
				});
			}else{
				delete known_tabs[tabId.toString()];
				chrome.browserAction.setIcon({path:"icons/icon19.png"});
			}
		});
	}catch(e){
		return false;
	}
}
/*******************************/
function handleClosedTab(tabId, changeInfo, tab){
	delete known_tabs[tabId.toString()];
}		
/********************************/
function iconCheck(tabKey){
	if(typeof known_tabs[tabKey] === 'string'){
		var tabStatus = known_tabs[tabKey];
		chrome.browserAction.setIcon({path:"icons/"+tabStatus+".png"});
		return true;
	}else{
		chrome.browserAction.setIcon({path:"icons/active.png"});
		var tabStatus = 'active';
		return false;
	}
}
/*******************************/
function toggle(tab){
	console.log("4");
	var tabKey = tab.id.toString();
	var status = known_tabs[tabKey];
	var cmd = status === 'disabled' ? 'active' : 'disabled';
	known_tabs[tabKey] = cmd;
	chrome.browserAction.setIcon({path:"icons/"+cmd+".png"});
	chrome.tabs.sendMessage(tab.id, {cmd:cmd});
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
			/*todo: make this more robust  */
			var end = url.indexOf("/") > -1 ? url.indexOf("/") : url.length;
			url = url.substring(0,end);
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

