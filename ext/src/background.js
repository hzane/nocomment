(function(){

/*******************************/

var watch_list = [], filter_name = 'filter_list';
var next = function(){
	chrome.browserAction.onClicked.addListener(handleButtonPress);
	chrome.tabs.onUpdated.addListener(handleTabsUpdate);
	chrome.tabs.onActivated.addListener(handleNewTabs);
	chrome.tabs.onRemoved.addListener(handleClosedTab);
	chrome.runtime.onMessage.addListener(messageHandler);
};

loadWatchList(next);

/*******************************/
function messageHandler(request, sender, sendResponse) {
		if(typeof request === 'object'){
			if(request.cmd === 'getfilters'){
				sendResponse(localStorage.getItem(filter_name));
				return true;
			}else{
				chrome.browserAction.setIcon({path:"icons/"+request.cmd+".png"});	
			}
			
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
	console.log('closing!!!  !!!!  !!!!');
	console.log(tabId.toString());
	chrome.storage.local.remove(tabId.toString());
}
/******************************/
function handleNewTabs(tabId, changeInfo, tab){
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
	var tabs_list = {};
		if(check(tabs)){
			console.log("1");
			tabs_list[tabId.tabId] = 'active';
			chrome.browserAction.setIcon({path:"icons/active.png"});
			chrome.storage.local.set(tabs_list);
		}else{
			console.log("1.2");
			chrome.browserAction.setIcon({path:"icons/icon19.png"});
			chrome.storage.local.remove(tabId.tabId.toString());
		}
	});
}
/******************************/
function handleTabsUpdate(tabId, changeInfo, tab){
	chrome.tabs.query({'active':true,'lastFocusedWindow':true,'currentWindow':true}, function(tabs){
		if(check(tabs)){
			console.log("2");
			chrome.storage.local.get(tabId.toString(), function(res){
				if(typeof res[tabId.toString()] === 'undefined'){
					var tabs_list = {};
					tabs_list[tabId.tabId] = 'active';
					chrome.browserAction.setIcon({path:"icons/active.png"});
					chrome.storage.local.set(tabs_list);
				}else{
					chrome.browserAction.setIcon({path:"icons/"+res[tabId.toString()]+".png"});
				}
			});
		}else{
			console.log("2.2");
			chrome.browserAction.setIcon({path:"icons/icon19.png"});
			console.log(tabId);
			chrome.storage.local.remove(tabId.toString());
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

