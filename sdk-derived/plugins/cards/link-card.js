(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.LinkCard
 * Adds custom composer to CardComposer control allowing to post links.
 *
 *		new Echo.StreamServer.Controls.CardComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "LinkCard"
 *			}]
 *		});
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("LinkCard", "Echo.StreamServer.Controls.CardComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.registerComposer({
		"id": "link",
		"label": this.labels.get("link"),
		"icon": "icon-globe",
		"composer": $.proxy(this.buildComposer, this),
		"getData": $.proxy(this.getData, this),
		"setData": $.proxy(this.setData, this),
		"objectType": "http://echoenabled.com/schema/1.0/link"
	});
};

plugin.vars = {
	"composer": null
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"link": "Link",
	/**
	 * @echo_label
	 */
	"title": "Title",
	/**
	 * @echo_label
	 */
	"URL": "URL"
};

plugin.methods.buildComposer = function() {
	var self = this;
	this.composer = $("<div>").append(
		'<div class="echo-cardcomposer-field-wrapper">' +
			'<input type="text" class="echo-link-composer-title" placeholder="' + this.labels.get("title") + '">' +
		'</div>' +
		'<div class="echo-cardcomposer-delimiter"></div>' +
		'<div class="echo-cardcomposer-field-wrapper">' +
			'<input type="text" class="echo-link-composer-link" placeholder="' + this.labels.get("URL") + '" required>' +
		'</div>'
	);
	this.composer.find(".echo-link-composer-link").on("keyup paste", function() {
		self.component.attachMedia({
			"fromElement": $(this),
			"removeOld": true,
			"delay": 1000
		});
	});
	return this.composer;
};

plugin.methods.getData = function() {
	return {
		"text": this.composer.find(".echo-link-composer-title").val(),
		"media": this._getMediaContent()
	};
};

plugin.methods.setData = function(data) {
	this.composer.find(".echo-link-composer-title").val(data.text);
	if (data.media.length) {
		var media = data.media[0];
		this.composer.find(".echo-link-composer-link").val(media.original_url || media.url);
	}
};

plugin.methods._getMediaContent = function() {
	var media = this.component.formData.media[0];
	if (!media) return "";
	return this.component.substitute({
		"template": this._mediaTemplate(),
		"data": $.extend(true, {}, media, {
			"oembed": this.component._htmlEncode(media)
		})
	});
};

plugin.methods._mediaTemplate = function() {
	return '<div class="echo-media-item" data-oembed="{data:oembed}">' +
		'<div class="echo-item-article">' +
			'<div class="echo-item-template-article-thumbnail" style="width: 30%; float: left; max-width: 120px; max-height: 120px; text-align: center; overflow: hidden;">' +
				'<img src="{data:thumbnail_url}" style="width: auto; height: auto; max-height: 120px; max-width: 120px;">' +
			'</div>' +
			'<div class="echo-item-template-article" style="width: 70%; float: left;">' +
				'<div class="echo-item-template-article-title" style="margin-left: 10px;">' +
					'<a href="{data:url}" target="_blank">{data:title}</a>' +
				'</div>' +
				'<div class="echo-item-template-article-descriptionContainer">' +
					'<div class="echo-item-template-article-description" style="margin-left: 10px;">{data:description}</div>' +
				'</div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
