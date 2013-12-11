(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("Sorter", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"parentID": "",
	"initialValue": "reverseChronological",
	"entries": [{
		"title": "Newest First",
		"value": "reverseChronological"
	}, {
		"title": "Oldest First",
		"value": "chronological"
	}, {
		"title": "Most popular",
		"value": "repliesDescending"
	}, {
		"title": "Most likes",
		"value": "likesDescending"
	}]
};

plugin.init = function() {
	this.extendTemplate("insertAsFirstChild", "header", plugin.templates.main);
};

plugin.templates.main =
	'<div class="{plugin.class:sorter}"></div>';

plugin.templates.dropdown =
	'<span class="{plugin.class:dropdown}"></span>';

plugin.renderers.sorter = function(element) {
	var self = this, stream = this.component;
	
	var assembleTitle = function(title) {
		return title + self.substitute({
			"template": plugin.templates.dropdown
		});
	};

	var dropdown = new Echo.GUI.Dropdown({
		"target": element,
		"title": assembleTitle(this._getTitle()),
		"extraClass": "nav",
		"entries": $.map(this.config.get("entries", []), function(entry) {
			return {
				"title": entry.title,
				"handler": function() {
					Echo.Cookie.set([self.config.get("parentID"), "sortOrder"].join("."), entry.value);
					dropdown.setTitle(assembleTitle(entry.title));

					var query = stream.config.get("query");
					stream.config.set("query", query.replace(/sortOrder:\S+/, "sortOrder:" + entry.value));
					stream.config.remove("data");
					stream.refresh();
				}
			};
		})
	});
	// TODO: find a better solution to right-align the menu
	//       and/or extend the Echo.GUI.Dropdown class to support this
	element.find(".dropdown-menu").addClass("pull-right");
	return element;
};

plugin.methods._getTitle = function() {
	var self = this, stream = this.component;

	var value = Echo.Cookie.get([this.config.get("parentID"), "sortOrder"].join("."))
		|| (function() {
			var sortOrder = stream.config.get("query").match(/sortOrder:(\S+)/);
			return sortOrder.length ? sortOrder.pop() : self.config.get("initialSortOrder");
		})();

	var values = $.grep(this.config.get("entries"), function(entry) {
		return entry.value === value;
	});
	return values.length ? values.pop().title : "";
};

plugin.css =
	'.{plugin.class:sorter} ul.nav { margin-bottom: 0px; font-size: 13px; }' +
	'.{plugin.class:sorter} ul.nav > li > a { text-decoration: none; color: #7f7f7f; line-height: 18px; }' +
	'.{plugin.class:sorter} ul.nav > li > a:hover,' +
	'.{plugin.class:sorter} ul.nav > li > a:focus ' +
		'{ background-color: transparent}' +
	'.{plugin.class:sorter} { float: right; }' +
	'.{plugin.class:dropdown} { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
