(function($) {
"use strict";

var media = Echo.App.manifest("Echo.StreamServer.Controls.MediaContainer");

if (Echo.App.isDefined(media)) return;

media.dependencies = [{
	"url": "{%= baseURLs.prod %}/sdk-derived/controls/nested-card.js",
	"loaded": function() { return !!Echo.StreamServer.Controls.NestedCard; }
}];

media.labels = {
	/**
	 * @echo_label
	 */
	"plus": "+",
	/**
	 * @echo_label
	 */
	"initialTooltip": "Drag file here or click to upload an image",
	/**
	 * @echo_label
	 */
	"loading": "Loading"
};

media.templates.attachmentsPanel =
	'<div class="{class:attachmentsPanel}">' +
		'<div class="{class:attachmentsPanel-wrapper}">' +
			'<div class="{class:attachmentsPanel-container} {class:strippedBackground}">' +
				'<div class="{class:attachmentsPanel-plus}">{label:plus}</div>' +
				'<span class="{class:attachmentsPanel-tooltip}">{label:initialTooltip}</span>' +
			'</div>' +
		'</div>' +
	'</div>';

media.templates.main = function() {
	return this.config.get("attachmentsPanelRequired")
		? '<div class="{class:container}">' + this.templates.attachmentsPanel + '</div>'
		: '<div class="{class:container}"></div>';
};

media.config = {
	"dragAndDropOptions": {
		"filepickerOptions": {},
		"onStart": function() {},
		"onSuccess": function() {},
		"onError": function() {}
	},
	"clickOptions": {
		"filepickerOptions": {},
		"beforeCallback": function() {},
		"onSuccess": function() {},
		"onError": function() {}
	},
	"filepickerAPIKey": undefined,
	"allowMultiple": false
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
			return new Echo.StreamServer.Controls.NestedCard($.extend({
				"data": item
			}, config));
		});
	}
	this.changeContainerCapacity(media.length);
	return element;
};

media.renderers.attachmentsPanel = function(element) {
	var self = this;
	var mediaLength = this.config.get("data", []).length;

	Echo.Loader.download([{
		"url": "//api.filepicker.io/v1/filepicker.js",
		"loaded": function() {
			return !!(window.filepicker && window.filepicker.pick);
		}
	}], function() {
		self._initFilePickerPanel();
	});

	if (mediaLength > 0 && !this.config.get("allowMultiple")) {
		this._hideAttachmentsPanel();
	} else {
		this._showAttachmentsPanel();
	}
	return element;
};

media.methods.changeContainerCapacity = function(mediaLength) {
	var capacity = (mediaLength > 1 || (mediaLength === 1 && this.config.get("allowMultiple"))) ? "multiple" : "single";
	var prefix = this.cssPrefix;
	if (capacity === "single") {
		this.view.get("container")
			.removeClass(prefix + "multiple")
			.addClass(prefix + "single");
	} else {
		this.view.get("container")
			.removeClass(prefix + "single")
			.addClass(prefix + "multiple");
	}
};

media.methods._showAttachmentsPanel = function() {
	var panel = this.view.get("attachmentsPanel");
	if (!panel) return;
	this._changePanelLayoutState("normal");
	// this append call also helps to keep attachmentsPanel
	// as the last of mediaContainer DOM element childrens
	this.view.get("container").append(panel);
	// we use css() instead of show to avoid adding of "display: block"
	// which we don`t need here.
	// TODO: it should be replaced by animation or proper show function.
	panel.css("display", "");
};

media.methods._hideAttachmentsPanel = function() {
	var panel = this.view.get("attachmentsPanel");
	panel && panel.hide();
};

media.methods._changePanelLayoutState = function(state) {
	state = state || "normal";
	if (state === "loading") {
		this.view.get("attachmentsPanel-plus").addClass(this.cssPrefix + "loading-animation").empty();
		this.view.get("attachmentsPanel-tooltip").text(this.labels.get("loading"));
	} else {
		// filepicker widget adds "disabled" attribute to panel DOMElement on loading start, but doesn`t remove it.
		this.view.get("attachmentsPanel").removeAttr("disabled");
		this.view.get("attachmentsPanel-tooltip").text(this.labels.get("initialTooltip"));
		this.view.get("attachmentsPanel-plus").text(this.labels.get("plus")).removeClass(this.cssPrefix + "loading-animation");
	}
};

media.methods._initFilePickerPanel = function() {
	var self = this;
	var panel = this.view.get("attachmentsPanel");

	var filepickerAPIKey = this.config.get("filepickerAPIKey");
	if (!filepickerAPIKey) return;

	var panelOptions = this.config.get("dragAndDropOptions");
	if (!panelOptions) return;

	window.filepicker.setKey(filepickerAPIKey);
	window.filepicker.makeDropPane(panel[0], $.extend({}, panelOptions.filepickerOptions, {
		"onStart": function(files) {
			self._changePanelLayoutState("loading");
			panelOptions.onStart.apply(this, arguments);
		},
		"onSuccess": function(InkBlobs) {
			panelOptions.onSuccess.apply(this, arguments);
		},
		"onError": function(type, message) {
			panelOptions.onError.apply(this, arguments);
		}
	}));

	var clickOptions = this.config.get("clickOptions");
	if (!clickOptions) return;

	panel.click(function(event) {
		self._changePanelLayoutState("loading");
		clickOptions.beforeCallback.apply(this, arguments);
		window.filepicker.pick(clickOptions.filepickerOptions,
			function(InkBlob) {
				clickOptions.onSuccess.apply(this, arguments);
			},
			function(FPError) {
				self._changePanelLayoutState("normal");
				clickOptions.onError.apply(this, arguments);
			}
		);
	});
};

media.destroy = function() {
	$.each(this.cards, function(i, card) {
		card.destroy();
	});
};

var gradientStyle = function(value) {
	return $.map(["", "-webkit-", "-moz-", "-ms-", "-o-"], function(prefix) {
		return "background-image: " + prefix + "linear-gradient(" + value + ");";
	}).join("");
};

media.css =
	'.{class:container} { line-height: 1px; word-wrap: normal; white-space: nowrap; overflow-x: auto; overflow-y: hidden; }' +
	'.{class:container} > div { display: inline-block; max-width: 90%; vertical-align: top; }' +
	'.{class:container} > div > div { margin-right: 8px; }' +

	// single cards
	'.{class:container}.{class:single} { padding: 0px; border: 0px; }' +
	'.{class:container}.{class:single} > div { max-width: 100%; display: block; }' +
	'.{class:container}.{class:single} > div > div { margin-right: 0; }' +

	// multiple cards
	'.{class:container}.{class:multiple} { padding: 8px 0px 8px 8px; }' +

	// scrollbar
	'.{class:container}::-webkit-scrollbar { height: 10px; }' +
	'.{class:container}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{class:container}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }' +

	// single > attachments panel
	'.{class:single} > .{class:attachmentsPanel} { border: 1px solid #D8D8D8; border-bottom: 0; }' +

	// multiple > attachments panel
	'.{class:container}.{class:multiple} > .{class:attachmentsPanel} { width: 90%; }' +
	'.{class:container}.{class:multiple} > .{class:attachmentsPanel} > .{class:attachmentsPanel-wrapper} { margin: 0px 8px 0px 0px; }' +

	// attachments panel
	'.{class:container} > div.{class:attachmentsPanel} { height: 100%; max-height: 388px; cursor: pointer; background-color: #f1f1f1; text-align: center; font-size: 16px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #9f9f9f; font-weight: normal; padding: 1px 0 0 0; max-width: 100%; }' +
	'.{class:attachmentsPanel-plus} { font-size: 128px; line-height: 128px; font-weight: bold; width: 128px; height: 128px; margin: 0 auto; }' +
	'.{class:strippedBackground} { ' +
		gradientStyle("left top, #e3e3e3 0%, #e3e3e3 25%, #eee 25%, #eee 50%, #e3e3e3 50%, #e3e3e3 75%, #eee 75%") + '; ' +
		'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#e3e3e3", endColorstr="#eeeeee",GradientType=0 ); ' +
		'background-size: 70px 70px;' +
	'}' +
	'.{class:container} > .{class:attachmentsPanel} > .{class:attachmentsPanel-wrapper} { border: 1px solid #C4C4C4; margin: 5px; border-radius: 2px; }' +
	'.{class:attachmentsPanel-container} { padding: 10px 0 40px 0; margin: 5px; }' +
	'.{class:attachmentsPanel-tooltip} { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14px;}' +
	'.{class:loading-animation} {background-image: url("{%= baseURLs.prod %}/images/loading.gif"); background-size: 80px; background-repeat: no-repeat; background-position: 24px 39px; }';


Echo.App.create(media);

})(Echo.jQuery);
