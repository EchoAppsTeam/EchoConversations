(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.SubmitComposer.Plugins.PhotoComposer
 * Adds custom composer to SubmitComposer control allowing to post images.
 *
 *		new Echo.StreamServer.Controls.SubmitComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "PhotoComposer"
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
var plugin = Echo.Plugin.manifest("PhotoComposer", "Echo.StreamServer.Controls.SubmitComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.registerComposer({
		"id": "photo",
		"label": this.labels.get("photo"),
		"icon": "icon-picture",
		"composer": $.proxy(this.buildComposer, this),
		"getData": $.proxy(this.getData, this),
		"setData": $.proxy(this.setData, this),
		"objectType": "http://activitystrea.ms/schema/1.0/image"
	});
};

plugin.vars = {
	"composer": null
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"photo": "Photo",
	/**
	 * @echo_label
	 */
	"title": "Title",
	/**
	 * @echo_label
	 */
	"URL": "URL"
};

plugin.dependencies = [{
	"url": "//api.filepicker.io/v1/filepicker.js",
	"loaded": function() {
		return !!(window.filepicker && window.filepicker.pick);
	}
}];


plugin.methods.buildComposer = function() {
	var self = this;
	var unique = "filepicker-" + Echo.Utils.getUniqueString();
	this.composer = $("<div>").append(
		'<div class="echo-submitcomposer-field-wrapper">' +
			'<input type="text" class="echo-photo-composer-title" placeholder="' + this.labels.get("title") + '">' +
		'</div>' +
		'<div class="echo-submitcomposer-delimiter"></div>' +
		'<iframe class="echo-photo-composer-iframe" id="' + unique + '"></iframe>'
	);
	setTimeout(function() {
		var filepickerKey = window.filepicker.apikey;
		window.filepicker.setKey(self.component.config.get("dependencies.FilePicker.apiKey"));
		window.filepicker.pick({
			"mimetype": "image/*",
			"container": unique
		}, function(InkBlob) {
			window.filepicker.setKey(filepickerKey);
			self.component.attachMedia({
				"url": InkBlob.url,
				"removeOld": true
			});
			this.log(JSON.stringify(InkBlob));
		}, function(FPError) {
			this.log(FPError);
			window.filepicker.setKey(filepickerKey);
		});
	}, 0);
	return this.composer;
};

plugin.methods.getData = function() {
	return {
		"text": this.composer.find(".echo-photo-composer-title").val(),
		"media": this._getMediaContent()
	};
};

plugin.methods.setData = function(data) {
	this.composer.find(".echo-photo-composer-title").val(data.text);
	if (data.media.length) {
	}
};

plugin.methods._getMediaContent = function() {
	var media = this.component.formData.media[0];
	if (!media) return "";
	media.title = this.composer.find(".echo-photo-composer-title").val();
	return this.component.substitute({
		"template": this._mediaTemplate(),
		"data": $.extend(true, {}, media, {
			"oembed": this.component._htmlEncode(media)
		})
	});
};

plugin.methods._mediaTemplate = function() {
	this.component.formData.media[0].title = this.composer.find(".echo-photo-composer-title").val();
	return '<div class="echo-media-item" data-oembed="{data:oembed}">' +
		'<a href="{data:original_url}" target="_blank">' +
			'<img src="{data:thumbnail_url}">' +
		'</a>' +
	'</div>';
};

plugin.css =
	'.echo-photo-composer-iframe { border: 0px; width: 100%; min-height: 405px; display: block; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
