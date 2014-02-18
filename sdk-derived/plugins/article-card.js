(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("Article", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this;
	this.media = [];
	Echo.Utils.safelyExecute(function() {
		var content = $("<div/>").append(self.component.get("data.object.content"));
		self.media = $("div[data-oembed]", content).map(function() {
			//TODO: validate parsed data, ex.: type, url, etc.
			return $.parseJSON($(this).attr("data-oembed"));
		}).get();
	});
	// now, we can handle only one photo per streamserver item
	this.set("data", this.media[0]);
	this.extendTemplate("replace", "data", plugin.templates.main);
};

plugin.templates.main =
	'<div class="{plugin.class:item}">' +
		'<div class="{plugin.class:border}">' +
			'<div class="{plugin.class:article}">' +
				'<div class="{plugin.class:articleThumbnail}">' +
					'<img src="{plugin.data:thumbnail_url}"/>' +
				'</div>' +
				'<div class="{plugin.class:articleTemplate}">' +
					'<div class="{plugin.class:title} {plugin.class:articleTitle}" title="{plugin.data:title}">' +
						'<a href="{plugin.data:url}" target="_blank">{plugin.data:title}</a>' +
					'</div>' +
					'<div class="{plugin.class:articleDescriptionContainer}">' +
						'<div class="{plugin.class:articleDescription}">{plugin.data:description}</div>' +
					'</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
				'<a class="{plugin.class:sourceIcon}" target="_blank"></a>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.renderers.article = function(element) {
	if (!this.get("data.thumbnail_url")) {
		element.addClass(this.cssPrefix + "withoutPhoto");
	}
	return element;
};

plugin.enabled = function() {
	var result = false;
	$.each(this.component.get("data.object.objectTypes", []), function(i, objectType) {
		if (objectType === "http://activitystrea.ms/schema/1.0/article" ||
			objectType === "http://echoenabled.com/schema/1.0/link"
		) {
			result = true;
			return false;
		}
	});
	return result;
};

plugin.css =
	'.{plugin.class:title} { font-weight: bold; margin: 5px 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{plugin.class:item} { text-align: left; font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; max-width: 100%; vertical-align: top; margin-bottom: 8px; }' +
	'.{plugin.class:description} { overflow: hidden; }' +

	// close button
	'.{plugin.class:closeButton} { line-height: 1; opacity: 0.7; filter: alpha(opacity=70); font-size: 30px; font-weight: bold; position: absolute; top: 4px; right: 8px; cursor: pointer; color: #FFF; text-shadow: 0 0 1px #000; }' +
	'.{plugin.class:closeButton}:hover { opacity: 1; filter: alpha(opacity=100); }' +
	// article
	'.{plugin.class:article} { padding: 10px 0 0 0; min-width: 200px; }' +
	'.{plugin.class:article} .{plugin.class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{plugin.class:article} .{plugin.class:articleTitle} > a { color: #42474A; font-weight: bold; }' +
	'.{plugin.class:article} .{plugin.class:articleTitle} > a:hover { color: #42474A; }' +
	'.{plugin.class:articleTitle} { margin-left: 10px; margin-top: 0px; line-height: 16px; }' +
	'.{plugin.class:articleDescription} { margin-left: 10px; font-size: 13px; line-height: 16px; }' +
	'.{plugin.class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{plugin.class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{plugin.class:articleTemplate} { width: 70%; float: left; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleTitle} { margin-left: 0px; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleDescription} { margin-left: 0px; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleThumbnail} { display: none; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleTemplate} { width: 100%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
