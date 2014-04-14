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
	"initialUploadingTooltip": "Drag file here or click to upload an image",
	/**
	 * @echo_label
	 */
	"loading": "Loading"
};

media.templates.main = '<div class="{class:container}"></div>';

media.templates.attachmentsPanel = [
	'<div class="{class:drop-panel}" style="display: none;">',
		'<div class="{class:drop-panel-wrapper}">',
			'<div class="{class:drop-panel-container} {class:strippedBackground}">',
				'<div class="{class:plus-button}">',
					'{data:plus}',
				'</div>',
				'<span class="{class:uploading-tooltip}">',
					'{data:tooltip}',
				'</span>',
			'</div>',
		'</div>',
	'</div>'
].join("");

media.vars = {
	"cards": [],
	"attachmentsPanel": {
		"element": undefined,
		"config": {
			"dragAndDropPanelOptions": {
				"filepickerOptions": {},
				"onStart": function() {},
				"onSuccess": function() {},
				"onError": function() {}
			},
			"clickPanelOptions": {
				"filepickerOptions": {},
				"beforeCallback": function() {},
				"onSuccess": function() {},
				"onError": function() {}
			},
			"filepickerAPIKey": undefined,
			"allowMultiple": false,
			"extraCallback": undefined
		}
	}
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
		element.children(":not(." + this.cssPrefix + "drop-panel)").remove();

		this.cards = $.map(media, function(item) {
			return new Echo.StreamServer.Controls.NestedCard($.extend({
				"data": item
			}, config));
		});

		if (this.get("attachmentsPanel.config.allowMultiple")) {
			this._showAttachmentsPanel();
		} else {
			this._hideAttachmentsPanel();
		}
	} else {
		if (this.cards.length) {
			$.each(this.cards, function(i, card) {
				card.destroy();
			});
			element.children(":not(." + this.cssPrefix + "drop-panel)").remove();
		}
		this._showAttachmentsPanel();
	}
	this.changeContainerCapacity(media.length, this.get("attachmentsPanel.config.allowMultiple"));
	return element;
};

media.methods.changeContainerCapacity = function(mediaLength, multipleAttachmentsEnabled) {
	var self = this;
	var setContainerCapacity = function(capacity) {
		var container = self.view.get("container");
		var prefix = self.cssPrefix;
		if (capacity === "single") {
			container
				.removeClass(prefix + "multiple")
				.addClass(prefix + "single");
		} else {
			container
				.removeClass(prefix + "single")
				.addClass(prefix + "multiple");
		}
	};
	setContainerCapacity((mediaLength && multipleAttachmentsEnabled) ? "multiple" : "single");
};

media.methods.cleanUp = function() {
	this.set("attachmentsPanel.config.allowMultiple", false);
	this.config.set("data", []);
	this.refresh();
};

media.methods.updateAttachments = function(attachments) {
	this.config.set("data", attachments || []);
	this.view.render({"name": "container"});
};

media.methods.initAttachmentsPanel = function(panelConfig) {
	if (this.get("attachmentsPanel.element")) return;

	var self = this;
	this.set("attachmentsPanel.config", $.extend(this.get("attachmentsPanel.config"), panelConfig));
	var panel = $(this.substitute({
		"template": this.templates.attachmentsPanel,
		"data" : {
			"plus": this.labels.get("plus"),
			"tooltip": this.labels.get("initialUploadingTooltip")
		}
	}));
	this.set("attachmentsPanel.element", panel);
	this.view.get("container").append(panel);

	var mediaLength = this.config.get("data", []).length;
	this.changeContainerCapacity(mediaLength, this.get("attachmentsPanel.config.allowMultiple"));
	if (!mediaLength || this.get("attachmentsPanel.config.allowMultiple")) {
		panel.slideDown();
	}

	Echo.Loader.download([{
		"url": "//api.filepicker.io/v1/filepicker.js",
		"loaded": function() {
			return !!(window.filepicker && window.filepicker.pick);
		}
	}], function() {
		self._initFilePickerPanel();
	});
};

media.methods._showAttachmentsPanel = function() {
	var panel = this.get("attachmentsPanel.element");
	if (!panel) return;
	this._changePanelLayoutState("normal");
	this.view.get("container").append(panel);
	panel.slideDown();
};

media.methods._hideAttachmentsPanel = function() {
	var panel = this.get("attachmentsPanel.element");
	if (!panel) return;
	panel.slideUp();
	this._changePanelLayoutState("normal");
};

media.methods._changePanelLayoutState = function(state) {
	state = state || "normal";
	var panel = this.get("attachmentsPanel.element");
	var plusButton = panel.find("." + this.cssPrefix + "plus-button");
	var tooltip = panel.find("." + this.cssPrefix + "uploading-tooltip");

	if (state === "loading") {
		plusButton.addClass(this.cssPrefix + "loading-animation").empty();
		tooltip.text(this.labels.get("loading"));
	} else {
		// filepicker widget adds "disabled" attribute to panel DOMElement on loading start, but doesn`t remove it.
		panel.removeAttr("disabled");
		tooltip.text(this.labels.get("initialUploadingTooltip"));
		plusButton.text(this.labels.get("plus")).removeClass(this.cssPrefix + "loading-animation");
	}
};

media.methods._initFilePickerPanel = function() {
	var self = this;
	var panel = this.get("attachmentsPanel.element");
	var config = this.get("attachmentsPanel.config");

	config.extraCallback && config.extraCallback(panel);
	if (!config.filepickerAPIKey) return;

	var panelOptions = config.dragAndDropPanelOptions;
	if (!panelOptions) return;

	window.filepicker.setKey(config.filepickerAPIKey);
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

	var clickOptions = config.clickPanelOptions;
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
	'.{class:container}.{class:multiple} { padding: 8px; }' +

	// scrollbar
	'.{class:container}::-webkit-scrollbar { height: 10px; }' +
	'.{class:container}::-webkit-scrollbar-track { box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }' +
	'.{class:container}::-webkit-scrollbar-thumb { background: #D2D2D2; box-shadow: inset 0 0 6px rgba(0,0,0,0.5); }' +

	// single > attachments panel
	'.{class:single} > .{class:drop-panel} { border: 1px solid #D8D8D8; border-bottom: 0; }' +

	// multiple > attachments panel
	'.{class:container}.{class:multiple} > .{class:drop-panel} { border: 1px solid #C2C2C2; width: 100%; }' +

	// attachments panel
	'.{class:container} > div.{class:drop-panel} { height: 100%; max-height: 388px; cursor: pointer; background-color: #eee; text-align: center; font-size: 16px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #9f9f9f; font-weight: normal; padding: 1px 0 0 0; max-width: 100%; }' +
	'.{class:plus-button} { font-size: 128px; line-height: 128px; font-weight: bold; width: 128px; height: 128px; margin: 0 auto; }' +
	'.{class:strippedBackground} { ' +
		gradientStyle("left top, #e3e3e3 0%, #e3e3e3 25%, #eee 25%, #eee 50%, #e3e3e3 50%, #e3e3e3 75%, #eee 75%") + '; ' +
		'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#e3e3e3", endColorstr="#eeeeee",GradientType=0 ); ' +
		'background-size: 70px 70px;' +
	'}' +
	'.{class:container} > .{class:drop-panel} > .{class:drop-panel-wrapper} { border: 1px solid #C4C4C4; margin: 5px; border-radius: 2px; }' +
	'.{class:drop-panel-container} { padding: 10px 0 40px 0; margin: 5px; }' +
	'.{class:uploading-tooltip} { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14px;}' +
	'.{class:loading-animation} {background-image: url("{%= baseURLs.prod %}/images/loading.gif"); background-size: 80px; background-repeat: no-repeat; background-position: 24px 39px; }';


Echo.App.create(media);

})(Echo.jQuery);
