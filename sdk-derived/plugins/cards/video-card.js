(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("VideoCard", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this;
	this.component.registerModifier({
		"isEnabled": $.proxy(this.isEnabled, this),
		"init": function () {
			self.events.subscribe({
				"topic": "Echo.StreamServer.Controls.Card.onUpdate",
				"handler": function() {
					self.normalizer();
				}
			});
			self.normalizer();
			self.extendTemplate("replace", "data", plugin.templates.main);
		}
	});
};

plugin.templates.main =
	'<div class="{plugin.class:item}">' +
		'<div class="{plugin.class:video}">' +
			'<div class="{plugin.class:videoContainer}">' +
				'<div class="{plugin.class:videoWrapper}">' +
					'<div class="{plugin.class:videoPlaceholder}">' +
						'<div class="{plugin.class:playButton}"></div>' +
						'<img src="{data:oembed.thumbnail_url}" title="{data:oembed.title}"/>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="{plugin.class:title} {plugin.class:videoTitle}" title="{data:oembed.title}">{data:oembed.title}</div>' +
			'<div class="{plugin.class:description} {plugin.class:videoDescription}">{data:oembed.description}</div>' +
		'</div>' +
	'</div>';

plugin.renderers.title = function(element) {
	return this.component.get("data.oembed.title") ? element : element.hide();
};

plugin.renderers.description = function(element) {
	return this.component.get("data.oembed.description") ? element : element.hide();
};

plugin.renderers.playButton = function(element) {
	var self = this;
	var oembed = this.component.get("data.oembed");
	element.on("click", function() {
		self.view.get("videoPlaceholder").empty().append($(oembed.html));
	});
	return element;
};

plugin.renderers.videoPlaceholder = function(element) {
	var oembed = this.component.get("data.oembed");

	if (!oembed.thumbnail_url) {
		element.empty().append($(oembed.html));
	}

	return element.css("padding-bottom", oembed.height / oembed.width * 100 + "%");
};

plugin.renderers.videoWrapper = function(element) {
	var item = this.component;
	var width = +item.get("data.oembed.width");
	var maxWidth = +item.config.get("limits.maxMediaWidth");

	return element.css("width", maxWidth && maxWidth < width ? maxWidth : width);
};

plugin.methods.normalizer = function() {
	var content = $("<div/>")
		.append(this.component.get("data.object.content"));
	var oembed = $("div[data-oembed]", content).data("oembed") || {};
	this.component.set("data.oembed", oembed);
};

plugin.methods.isEnabled = function() {
	var item = this.component;
	return item.isRoot() && ~$.inArray("http://activitystrea.ms/schema/1.0/video", item.get("data.object.objectTypes"));
};

plugin.css =
	'.{plugin.class:title} { font-weight: bold; margin: 5px 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{plugin.class:item} { text-align: left; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; max-width: 100%; vertical-align: top; }' +
	'.{plugin.class:description} { overflow: hidden; }' +

	// play button
	'.{plugin.class:playButton} { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; z-index: 10; }' +
	'.{plugin.class:playButton}:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
	'.{plugin.class:playButton} { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; border-radius: 50%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.7); }' +
	'.{plugin.class:playButton}:hover { background-color: #3498DB; }' +

	// video
	'.{plugin.class:video} { padding: 10px 0 0 0; }' +
	'.{plugin.class:videoTitle} { margin: 10px 0 0 0; }' +
	'.{plugin.class:videoDescription} { margin: 5px 0 0 0; }' +
	'.{plugin.class:videoWrapper} { background: #000; max-width: 100%; margin: 0 auto; }' +
	'.{plugin.class:videoContainer} { background: #000; }' +
	'.{plugin.class:videoPlaceholder} img { position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }' +
	'.{plugin.class:videoPlaceholder} { max-width: 100%; position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px auto; background: #000000; overflow: hidden; }' +
	'.{plugin.class:videoPlaceholder} > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class:videoPlaceholder} > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{plugin.class:videoPlaceholder} > object { position: absolute; top: 0; left: 0; width: 100%;100 height: 100%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
