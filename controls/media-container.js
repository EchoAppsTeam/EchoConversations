(function($) {
"use strict";

var media = Echo.App.manifest("Echo.Conversations.MediaContainer");

if (Echo.App.isDefined(media)) return;

media.templates.main = function() {
	return '<div class="{class:container}"></div>';
};

media.vars = {
	"cards": []
};

media.init = function() {
	this.render();
	this.ready();
};

media.renderers.container = function(element) {
	var media = this.config.get("data", []);
	if (media.length) {
		if (!this.cardParentConfig) {
			this.cardParentConfig = this.config.getAsHash();
		}

		var config = $.extend({
			"target": document.createDocumentFragment(),
			"context": this.config.get("context"),
			"ready": function() {
				element.append(this.config.get("target"));
			}
		}, this.cardParentConfig.card);

		config.parent = this.itemParentConfig;

		this.cards = $.map(media, function(item) {
			return new Echo.Conversations.NestedCard($.extend({
				"data": item
			}, config));
		});

		if (media.length === 1) {
			element.addClass(this.cssPrefix + "single-card");
		}
	} else {
		element.hide();
	}
	return element;
};


media.css =
	'.{class:container} { line-height: 1px; word-wrap: normal; white-space: nowrap; overflow-x: auto; overflow-y: hidden; padding: 8px 0px 8px 8px; }' +
	'.{class:container} > div { display: inline-block; max-width: 90%; vertical-align: top; }' +
	'.{class:container} > div > div { margin-right: 8px; }' +

	// single cards
	'.{class:container}.{class:single-card} { padding: 0px; border: 0px; }' +
	'.{class:container}.{class:single-card} > div { max-width: 100%; }' +
	'.{class:container}.{class:single-card} > div > div { margin-right: 0; }' +

	// scrollbar
	'.{class:container}::-webkit-scrollbar { height: 10px; }' +
	'.{class:container}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{class:container}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }';

Echo.App.create(media);

})(Echo.jQuery);
