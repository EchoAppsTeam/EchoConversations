(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("VideoCard", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this;
	this.component.registerVisualizer({
		"id": "video",
		"objectTypes": {
			"http://activitystrea.ms/schema/1.0/video": ["rootItems", function() {
				// TODO: Add same validation for other plugins
				var oembed = self.component.get("data.object.parsedContent.oembed");
				return Echo.Utils.sanitizeOEmbed(oembed);
			}]
		},
		"init": function() {
			self.extendTemplate("replace", "data", plugin.templates.label);
			self.extendTemplate("insertAsFirstChild", "subwrapper", plugin.templates.video);
		}
	});
};

plugin.templates.video =
	'<div class="{plugin.class:item}">' +
		'<div class="{plugin.class:video}">' +
			'<div class="{plugin.class:videoContainer}">' +
				'<div class="{plugin.class:videoWrapper}">' +
					'<div class="{plugin.class:videoPlaceholder}">' +
						'<div class="{plugin.class:playButton}"></div>' +
						'<img src="{data:object.parsedContent.oembed.thumbnail_url}" title="{data:object.parsedContent.oembed.title}">' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.templates.label =
	'<div class="{plugin.class:label}">' +
		'<div class="{plugin.class:title}" title="{data:object.parsedContent.oembed.title}">{data:object.parsedContent.oembed.title}</div>' +
		'<div class="{plugin.class:description}">{data:object.parsedContent.oembed.description}</div>' +
	'</div>';

plugin.renderers.title = function(element) {
	return this.component.get("data.object.parsedContent.oembed.title") ? element : element.hide();
};

plugin.renderers.description = function(element) {
	return this.component.get("data.object.parsedContent.oembed.description") ? element : element.hide();
};

plugin.renderers.playButton = function(element) {
	var self = this;
	var oembed = this.component.get("data.object.parsedContent.oembed");
	element.on("click", function() {
		self.view.get("videoPlaceholder").empty().append(
			Echo.Utils.sanitizeOEmbedHTML(oembed.html)
		);
	});
	return element;
};

plugin.renderers.videoPlaceholder = function(element) {
	var oembed = this.component.get("data.object.parsedContent.oembed");

	if (!oembed.thumbnail_url) {
		element.empty().append(
			Echo.Utils.sanitizeOEmbedHTML(oembed.html)
		);
	}

	return element.css("padding-bottom", oembed.height / oembed.width * 100 + "%");
};

plugin.renderers.videoWrapper = function(element) {
	var item = this.component;
	var width = +item.get("data.object.parsedContent.oembed.width");
	var maxWidth = +item.config.get("limits.maxMediaWidth");

	return element.css("width", maxWidth && maxWidth < width ? maxWidth : width);
};

plugin.css =
	'.{class:depth-0} .{plugin.class:item} { margin: -15px -16px 15px -16px; }' +
	'.{plugin.class:label} { text-align: left; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; max-width: 100%; vertical-align: top; padding: 15px 0 10px 0; }' +
	'.{plugin.class:title} { font-weight: bold; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; font-size: 18px; line-height: 22px; }' +
	'.{plugin.class:description} { line-height: 21px; font-size: 15px; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }' +
	'.{plugin.class:label} > div:nth-child(2) { margin: 5px 0 0 0; }' +

	// play button
	'.{plugin.class:playButton} { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; z-index: 10; }' +
	'.{plugin.class:playButton}:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
	'.{plugin.class:playButton} { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; border-radius: 50%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.7); }' +
	'.{plugin.class:playButton}:hover { background-color: #3498DB; }' +

	// video
	'.{plugin.class:videoWrapper} { background: #000; max-width: 100%; margin: 0 auto; }' +
	'.{plugin.class:videoContainer} { background: #000; }' +
	'.{plugin.class:videoPlaceholder} img { position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }' +
	'.{plugin.class:videoPlaceholder} { max-width: 100%; position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px auto; background: #000000; overflow: hidden; }' +
	'.{plugin.class:videoPlaceholder} > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class:videoPlaceholder} > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class:videoPlaceholder} > object { position: absolute; top: 0; left: 0; width: 100%;100 height: 100%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
