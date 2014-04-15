(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("ArticleCard", "Echo.StreamServer.Controls.Card");

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
		'<div class="{plugin.class:article}">' +
			'<div class="{plugin.class:articleThumbnail}">' +
				'<img src="{data:oembed.thumbnail_url}"/>' +
			'</div>' +
			'<div class="{plugin.class:articleTemplate}">' +
				'<div class="{plugin.class:title}" title="{data:oembed.title}">' +
					'<a href="{data:oembed.url}" target="_blank">{data:oembed.title}</a>' +
				'</div>' +
				'<div class="{plugin.class:description}">{data:oembed.description}</div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
	'</div>';

plugin.renderers.article = function(element) {
	if (!this.component.get("data.oembed.thumbnail_url")) {
		element.addClass(this.cssPrefix + "withoutPhoto");
	}
	return element;
};

plugin.methods.normalizer = function() {
	var content = $("<div/>")
		.append(this.component.get("data.object.content"));
	var oembed = $("div[data-oembed]", content).data("oembed") || {};
	this.component.set("data.oembed", oembed);
};

plugin.methods.isEnabled = function() {
	var item = this.component;
	return item.isRoot() && ~$.inArray("http://activitystrea.ms/schema/1.0/article", item.get("data.object.objectTypes"));
};

plugin.css =
	'.{plugin.class:title} { font-weight: bold; margin: 0 0 0 10px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; font-size: 18px; line-height: 22px; }' +
	'.{plugin.class:item} { text-align: left; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; max-width: 100%; vertical-align: top; padding: 15px 0 10px 0; }' +
	'.{plugin.class:description} { overflow: hidden; margin-left: 10px; line-height: 21px; font-size: 15px; margin-top: 5px; }' +

	// article
	'.{plugin.class:article} { min-width: 200px; }' +
	'.{plugin.class:article} .{plugin.class:title} > a { color: #42474A; font-weight: bold; }' +
	'.{plugin.class:article} .{plugin.class:title} > a:hover { color: #42474A; }' +
	'.{plugin.class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{plugin.class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{plugin.class:articleTemplate} { width: 70%; float: left; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:title} { margin-left: 0px; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:description} { margin-left: 0px; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleThumbnail} { display: none; }' +
	'.{plugin.class:article}.{plugin.class:withoutPhoto} .{plugin.class:articleTemplate} { width: 100%; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);