(function($) {
"use strict";

var media = Echo.App.manifest("Echo.StreamServer.Controls.MediaContainer");

if (Echo.App.isDefined(media)) return;

media.dependencies = [{
	"url": "{%= baseURLs.prod %}/sdk-derived/controls/nested-card.js",
	"loaded": function() { return !!Echo.StreamServer.Controls.NestedCard; }
}, { // TODO: replace it into "initAttachmentsPanel" call
	"url": "//api.filepicker.io/v1/filepicker.js",
	"loaded": function() {
		return !!(window.filepicker && window.filepicker.pick);
	}
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

media.templates.main = function() {
	return '<div class="{class:container}"></div>';
};

media.vars = {
	"cards": [],
	"attachmentsPanel": {
		"isActive": false,
		"allowMultiple": false
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

		if (media.length === 1 && !this.get("attachmentsPanel.allowMultiple")) {
			element.removeClass(this.cssPrefix + "multiple")
				.addClass(this.cssPrefix + "single");
		} else {
			element.removeClass(this.cssPrefix + "single")
				.addClass(this.cssPrefix + "multiple");
		}
		if (this.get("attachmentsPanel.allowMultiple")) {
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
		element.removeClass(this.cssPrefix + "multiple");
		element.addClass(this.cssPrefix + "single");
	}
	return element;
};

media.methods._getAttachmentsPanel = function() {
	return $(['<div class="', this.cssPrefix, 'drop-panel">',
			'<div class="', this.cssPrefix, 'drop-panel-wrapper">',
				'<div class="', this.cssPrefix, 'drop-panel-container strippedBackground">',
					'<div class="', this.cssPrefix, 'plus-button">',
						media.labels["plus"],
					'</div>',
					'<span class="', this.cssPrefix, 'uploading-tooltip">',
						media.labels["initialUploadingTooltip"],
					'</span>',
				'</div>',
			'</div>',
		'</div>'
	].join("")).hide();
};

media.methods.clearOut = function() {
	this.updateAttachments();
	this.set("attachmentsPanel.isActive", false);
	this.set("attachmentsPanel.allowMultiple", false);
	this.view.get("container").empty();
};

media.methods.updateAttachments = function(attachments) {
	attachments = attachments || [];
	// TODO: not sure that we have to do it
	this.config.set("data", attachments);
	this.view.render({"name": "container"});
};

media.methods.initAttachmentsPanel = function(panelConfig) {
	if (this.get("attachmentsPanel.isActive")) return;
	var container = this.view.get("container");
	var panel = this._getAttachmentsPanel();
	this.set("attachmentsPanel.isActive", true);
	this.set("attachmentsPanel.allowMultiple", panelConfig.allowMultiple || false);
	container.append(panel);
	if(this.config.get("data", []).length < 0 || this.get("attachmentsPanel.allowMultiple")) {
		panel.slideDown();
	}
	var target = container.find("." + this.cssPrefix + "drop-panel");
	this._initFilePickerPanel(target, panelConfig);
};

media.methods._showAttachmentsPanel = function() {
	if (!this.get("attachmentsPanel.isActive")) return;
	var container = this.view.get("container");
	if(container.is(":hidden")) {
		container.show();
	}
	var panel = container.find("." + this.cssPrefix + "drop-panel");
	this._changeAttachmentsPanelLayout("normal", panel);
	container.append(panel);
	panel.slideDown();
};

media.methods._hideAttachmentsPanel = function() {
	var panel = this.view.get("container").find("." + this.cssPrefix + "drop-panel");
	panel.slideUp();
	this._changeAttachmentsPanelLayout("normal", panel);
};

media.methods._changeAttachmentsPanelLayout = function(state, panel) {
	state = state || "normal";
	panel = panel || this.view.get("container").find("." + this.cssPrefix + "drop-panel");

	var plusButton = panel.find("." + this.cssPrefix + "plus-button");
	var tooltip = panel.find("." + this.cssPrefix + "uploading-tooltip");

	if (state === "loading") {
		plusButton.addClass(this.cssPrefix + "loading-animation").empty();
		tooltip.text(this.labels.get("loading"));
	} else {
		panel.removeAttr("disabled");
		tooltip.text(this.labels.get("initialUploadingTooltip"));
		plusButton.text(this.labels.get("plus")).removeClass(this.cssPrefix + "loading-animation");
	}
};

media.methods._initFilePickerPanel = function(target, config) {
	var self = this;
	if (!config || !config.filepickerAPIKey) {
		if (config && config.extraCallback) {
			return config.extraCallback(target);
		}
		return;
	}
	window.filepicker.setKey(config.filepickerAPIKey);

	if (!config.dragAndDropPanelOptions) return;
	window.filepicker.makeDropPane(target[0], $.extend({}, config.dragAndDropPanelOptions.filepickerOptions, {
		"onStart": function(files) {
			self._changeAttachmentsPanelLayout("loading", target);
			if (typeof config.dragAndDropPanelOptions.onStart === "function") {
				config.dragAndDropPanelOptions.onStart.apply(this, arguments);
			}
		},
		"onSuccess": function(InkBlobs) {
			if (typeof config.dragAndDropPanelOptions.onSuccess === "function") {
				config.dragAndDropPanelOptions.onSuccess.apply(this, arguments);
			}
		},
		"onError": function(type, message) {
			if (typeof config.dragAndDropPanelOptions.onError === "function") {
				config.dragAndDropPanelOptions.onError.apply(this, arguments);
			}
		}
	}));

	if (!config.clickPanelOptions) return;
	target.click(function(event) {
		self._changeAttachmentsPanelLayout("loading", target);
		if (typeof config.clickPanelOptions.beforeCallback === "function") {
			config.clickPanelOptions.beforeCallback.apply(this, arguments);
		}
		window.filepicker.pick($.extend({}, config.clickPanelOptions.filepickerOptions),
		function(InkBlob) {
			console.log("success", InkBlob);
			if (typeof config.clickPanelOptions.onSuccess === "function") {
				config.clickPanelOptions.onSuccess.apply(this, arguments);
			}
		},
		function(FPError) {
			console.log("fail", FPError);
			self._changeAttachmentsPanelLayout("normal", target);
			if (typeof config.clickPanelOptions.onError === "function") {
				config.clickPanelOptions.onError.apply(this, arguments);
			}
		});
	});
};

media.destroy = function() {
	$.each(this.cards, function(i, card) {
		card.destroy();
	});
};

var gradientStyle = function(value) {
	var propertyName = "background-image";
	return $.map(["linear-gradient", "-webkit-linear-gradient", "-moz-linear-gradient", "-ms-linear-gradient", "-o-linear-gradient"], function(propertySpecific) {
		return propertyName +': ' + propertySpecific + "(" + value + ")";
	}).join(";");
};

media.css =
	'.{class:container} { line-height: 1px; word-wrap: normal; white-space: nowrap; overflow-x: auto; overflow-y: hidden; }' + //padding: 8px 0px 8px 8px; }' +
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
	
	// attachment panel
	'.{class:container}.{class:multiple} > .{class:drop-panel} { border: 1px solid #C2C2C2; }' +
	'.{class:container} > div.{class:drop-panel} { width: 100%; height: 100%; max-height: 388px; cursor: pointer; background-color: #eee; text-align: center; font-size: 16px; font-family: "Helvetica Neue", arial, sans-serif; color: #9f9f9f; font-weight: normal; padding: 1px 0 0 0; max-width: 100%; }' +
	'.{class:plus-button} { font-size: 128px; line-height: 128px; font-weight: bold; width: 128px; height: 128px; margin: 0 auto; }' +
	'.strippedBackground { ' +
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
