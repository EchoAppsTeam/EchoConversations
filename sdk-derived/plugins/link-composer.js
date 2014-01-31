(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.SubmitComposer.Plugins.LinkComposer
 * Adds custom composer to SubmitComposer control allowing to post links.
 *
 *		new Echo.StreamServer.Controls.SubmitComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "LinkComposer"
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
var plugin = Echo.Plugin.manifest("LinkComposer", "Echo.StreamServer.Controls.SubmitComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.registerComposer({
		"id": "link",
		"label": this.labels.get("link"),
		"icon": "icon-globe",
		"isValid": $.proxy(this.isValid, this),
		"composer": $.proxy(this.buildComposer, this),
		"mediaTemplate": $.proxy(this.mediaTemplate, this),
		"text": $.proxy(this.getText, this),
		"fill": $.proxy(this.fill, this),
		// TODO: select proper type (comment? note?)
		"postType": "http://activitystrea.ms/schema/1.0/article"
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
	"URL": "URL",
	/**
	 * @echo_label
	 */
	"invalidURL": "Should be an URL"
};

plugin.methods.buildComposer = function() {
	var self = this, timer;
	this.composer = $("<div>").append(
		'<div class="echo-submitcomposer-field-wrapper">' +
			'<input type="text" class="echo-link-composer-title" placeholder="' + this.labels.get("title") + '">' +
		'</div>' +
		'<div class="echo-submitcomposer-delimiter"></div>' +
		'<div class="echo-submitcomposer-field-wrapper">' +
			'<input type="text" class="echo-link-composer-link" placeholder="' + this.labels.get("URL") + '" required>' +
		'</div>'
	);
	this.composer.find(".echo-link-composer-link").on("keyup paste", function() {
		clearTimeout(timer);
		var el = $(this);
		timer = setTimeout(function() {
			self.component.attachMedia({
				"url": el.val(),
				"removeOld": true
			});
		}, 1000);
	});
	return this.composer;
};

plugin.methods.mediaTemplate = function() {
	return '<div class="echo-media-item" data-oembed="{data:oembed}">' +
		// XXX: replace {plugin.config}
		'<div class="echo-item-article" style="width: {plugin.config:linkWidth}">' +
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

plugin.methods.getText = function() {
	return this.composer.find(".echo-link-composer-title").val();
};

plugin.methods.fill = function(data) {
	this.composer.find(".echo-link-composer-title").val(data.text);
	if (data.media.length === 1) {
		var media = data.media[0].oembed;
		this.composer.find(".echo-link-composer-link").val(media.original_url || media.url);
	}
};

plugin.methods.isValid = function() {
	if (!this.composer) return true;
	var link = this.composer.find(".echo-link-composer-link");
	// TODO: better interface for URL checking
	if (!this.component.resolver.normalizeURL($.trim(link.val()))) {
		this.component.highlightField(link, this.labels.get("invalidURL"));
		return false;
	}
	return true;
};

plugin.css =
	'';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
