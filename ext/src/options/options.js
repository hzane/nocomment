(function(){


var sites = ["youtube.com",
			"huffingtonpost.com",
			"usuncut.com",
			"facebook.com",
			"theblaze.com",
			"thehill.com",
			"chicagotribune.com",
			"instagram.com",
			"salon.com",
			"vice.com",
			"breitbart.com",
			"slate.com",
			"countercurrentnews.com",
			"npr.org",
			"washingtonpost.com",
			"buzzfeed.com",
			"imgur.com",
			"mashable.com",
			"gawker.com",
			"theguardian.com",
			"gothamist.com"];

var filter_name = 'filter_list';


function ready(){
	//localStorage.removeItem('filter_list');
	var filter_list = localStorage.getItem(filter_name) || '';
	var list = document.createElement('ul');
	var main = document.getElementById('main')
	main.appendChild(list);
	for(var i=0;i<sites.length;i++){
		var site = sites[i];
		addItem(list, site, filter_list);
	}

}

function addItem(list, siteName, filter_list){
	var item = document.createElement('li');
	var div = document.createElement('div');
	var input = document.createElement('input');
	var label = document.createElement('label');
	input.type = "checkbox";
	input.name = "sites";
	input.value = siteName;
	input.id = siteName;
	input.checked = true;
	if(filter_list.length){
		var items = filter_list.split(',');
		for(var i in items){
			if(items[i] === siteName){
				input.checked = false;
				break;
			}
		}
	}
	input.addEventListener('change', changeHandler);
	label.htmlFor = siteName;
	label.appendChild(document.createTextNode(siteName))
	div.appendChild(input);
	div.appendChild(label);
	item.appendChild(div);
	list.appendChild(item);
}

function changeHandler(e){
	var filter_list = localStorage.getItem(filter_name) || '';
	var checked = e.target.checked;
	var items = filter_list.length ? filter_list.split(',') : [];
	if(checked){
		var val = e.target.value;
		items.splice(items.indexOf(val), 1);
	}else{
		var val = e.target.value;
		items.push(val);
	}
	localStorage.setItem(filter_name, items);

}

document.addEventListener('DOMContentLoaded', ready);

})();