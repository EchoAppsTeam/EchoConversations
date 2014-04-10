(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("PhotoCard", "Echo.StreamServer.Controls.Card");

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

plugin.config = {
	// we display aricle via different layouts
	// according to thumbnail image width
	"minArticleImageWidth": 320
};

plugin.labels = {
	"noMediaAvailable": "No media available",
	"clickToExpand": "Click to expand"
};

plugin.templates.main =
	'<div class="{plugin.class:item}">' +
		'<div class="{plugin.class:photo}">' +
			'<div class="{plugin.class:photoContainer}">' +
				'<img class="{plugin.class:photoThumbnail}" src="{data:oembed.url}" title="{data:oembed.title}"/>' +
			'</div>' +
			'<div class="{plugin.class:photoLabel}">' +
				'<div class="{plugin.class:photoLabelContainer}">' +
					'<div class="{plugin.class:title} {plugin.class:photoTitle}" title="{data:oembed.title}">' +
						'<a class="echo-clickable" href="{data:oembed.url}" target="_blank">{data:oembed.title}</a>' +
					'</div>' +
					'<div class="{plugin.class:description} {plugin.class:photoDescription}">{data:oembed.description}</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.events = {
	"Echo.Apps.Conversations.onAppResize": function() {
		this.view.render({"name": "photoContainer"});
	}
};

plugin.renderers.title = function(element) {
	var title = this.component.get("data.oembed.title");
	var url = this.component.get("data.oembed.url");
	if (title) {
		element.attr("title", title)
			.find("a").text(title).attr("href", url);
	} else {
		element.hide();
	}
	return element;
};

plugin.renderers.description = function(element) {
	var description = this.component.get("data.oembed.description");
	if (description) {
		element.text(Echo.Utils.stripTags(description));
	} else {
		element.hide();
	}
	return element;
};

plugin.renderers.photoThumbnail = function(element) {
	var self = this;
	var thumbnail = this.component.get("data.oembed.type") === "link"
		? this.component.get("data.oembed.thumbnail_url")
		: this.component.get("data.oembed.url");
	// we are to create empty img tag because of IE.
	// If we have an empty src attribute it triggers
	// error event all the time.
	var img = $("<img />");
	img.attr("class", element.attr("class"));
	if (this.component.config.get("limits.maxMediaWidth")) {
		img.css("max-width", this.component.config.get("limits.maxMediaWidth"));
	}
	if (element.attr("title")) {
		img.attr("title", element.attr("title"));
	}
	img.error(function(e) {
		img.replaceWith(self.substitute({
			"template": '<div class="{plugin.class:noMediaAvailable}"><span>{plugin.label:noMediaAvailable}</span></div>'
		}));
	}).attr("src", thumbnail);
	return element.replaceWith(img);
};

plugin.renderers.photoContainer = function(element) {
	this.component.view.get("content")
		.addClass(this.cssPrefix + "enabled");
	var expanded = this.cssPrefix + "expanded";
	var self = this;
	var oembed = this.component.get("data.oembed", {});
	var thumbnailWidth = this.view.get("photoThumbnail").width();
	var expandedHeight = oembed.height;
	var collapsedHeight = (thumbnailWidth || oembed.width) * 9 / 16;
	var imageWidth = oembed.width;
	var imageHeight = oembed.height;
	if (!imageWidth || !imageHeight) {
		imageWidth = oembed.thumbnail_width;
		imageHeight = oembed.thumbnail_height;
	}
	// calc height using aspect ratio 16:9 if image has ratio 1:2
	if (!element.hasClass(expanded) && oembed.height > collapsedHeight && imageHeight >= 2 * imageWidth) {
		var transitionCss = Echo.Utils.foldl({}, ["", "-o-", "-ms-", "-moz-", "-webkit-"], function(key, acc) {
			acc[key + "transition"] = "max-height ease 500ms";
		});

		element.addClass("echo-clickable")
			.attr("title", this.labels.get("clickToExpand"))
			.css("max-height", 250)
			.one("click", function() {
				self.events.publish({
					"topic": "onMediaExpand"
				});
				element.css(transitionCss)
					.css("max-height", expandedHeight)
					.removeClass("echo-clickable")
					.addClass(expanded)
					.attr("title", "");
			});
	} else {
		element.css("max-height", expandedHeight);
	}

	return element;
};

plugin.renderers.photoLabelContainer = function(element) {
	// calculate photoLabel max-height
	var photoLabelHeight = 20 // photoLabelContainer padding
		+ 2*16; // photoDescription line-height * lines count

	if (this.component.get("data.oembed.title")) {
		photoLabelHeight += 16 // photoTitle width
			+ 5; // photoTitle margin
	}
	this.view.get("photoLabel").css("max-height", photoLabelHeight);

	if (!this.component.get("data.oembed.description") && !this.component.get("data.oembed.title")) {
		element.hide();
	} else {
		this.view.get("photoContainer").css({
			"min-height": 55 + photoLabelHeight, // first number is added for default item avatar
			"min-width": 200
		});
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
	var isArticle = ~$.inArray("http://activitystrea.ms/schema/1.0/article", item.get("data.object.objectTypes"));
	var isPhoto = ~$.inArray("http://activitystrea.ms/schema/1.0/image", item.get("data.object.objectTypes"));

	if (item.isRoot() && isPhoto) {
		return true;
	} else if (item.isRoot() && isArticle) {
		this.normalizer();
		return item.get("data.oembed.thumbnail_width") >= this.config.get("minArticleImageWidth");
	} else {
		return false;
	}
};

var transition = function(value) {
	return $.map(["", "-o-", "-ms-", "-moz-", "-webkit-"], function(prefix) {
		return prefix + "transition: " + value;
	}).join(";");
};

plugin.css =
	'.{class:depth-0} .{plugin.class:item} { margin: -51px -16px 0 -16px; }' +
	'.{plugin.class:photo} .{plugin.class:noMediaAvailable} { position: relative; min-height: 145px; padding: 75px 10px 0 10px; background: #000; color: #FFF; min-width: 260px; text-align: center; }' +
	'.{plugin.class:photo} { position: relative; left: 0; top: 0; zoom: 1; }' +
	'.{plugin.class:photoLabel} { position: absolute; bottom: 0; color: #FFF; width: 100%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.5); }' +
	'.{plugin.class:photoContainer} { display: block; overflow: hidden; text-align: center; background-color: #000; }' +

	'.echo-sdk-ui .{plugin.class:photoLabel} a:link, .echo-sdk-ui .{plugin.class:photoLabel} a:visited, .echo-sdk-ui .{plugin.class:photoLabel} a:hover, .echo-sdk-ui .{plugin.class:photoLabel} a:active { color: #fff; }' +
	'.{plugin.class:photoLabelContainer} { padding: 10px; }' +
	'.{plugin.class:photoLabelContainer} > div:nth-child(2) { margin: 5px 0 0 0; }' +
	'.{plugin.class:photoTitle} { font-weight: bold; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +

	'.{plugin.class:photoLabel} { overflow: hidden; }' +
	'.{plugin.class:photo}:hover .{plugin.class:photoLabel} { max-height: 60% !important; }' +

	'.{plugin.class:enabled} .{class:avatar-wrapper} { z-index: 10; }' +
	'.{class:depth-0}.{plugin.class:enabled} .{class:header-container} { position: relative; z-index: 10; }' +
	'.{plugin.class:enabled} .{class:text} { display: none; }' +
	'.{class:depth-0}.{plugin.class:enabled} .{class:body} { margin-bottom: 0px; overflow: visible; }' +
	'.{class:depth-0}.{plugin.class:enabled} .{class:data} { padding-top: 0px; }' +
	'.{class:depth-0}.{plugin.class:enabled} .{class:authorName} { color: #FFFFFF; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7); }' +
	'.{class:depth-0}.{plugin.class:enabled} .{class:date} { line-height: 20px; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7); padding-right: 1px; }' +
	'.{plugin.class:photoLabel} { ' + transition('max-height ease 300ms') + '; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.PhotoCard
 * Adds custom composer to CardComposer control allowing to post images.
 *
 *		new Echo.StreamServer.Controls.CardComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "PhotoCard"
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
var plugin = Echo.Plugin.manifest("PhotoCard", "Echo.StreamServer.Controls.CardComposer");

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
	"URL": "URL",
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

plugin.dependencies = [{
	"url": "//api.filepicker.io/v1/filepicker.js",
	"loaded": function() {
		return !!(window.filepicker && window.filepicker.pick);
	}
}];

plugin.events = {
	"Echo.StreamServer.Controls.CardComposer.onMediaContainerReady": function() {
		if (!this.isPhotoComposerActive()) return;
		this.component.enablePostButtonBy("photo-uploading");
		this.composer.find(".echo-photo-composer-drop-panel").slideUp();
	}
};

$.map(["Echo.StreamServer.Controls.CardComposer.onMediaDetached",
	"Echo.StreamServer.Controls.CardComposer.onPostComplete"], function(eventName) {
	plugin.events[eventName] = function() {
		if (!this.isPhotoComposerActive()) return;
		this.renewMediaPanel();
		this.composer.find(".echo-photo-composer-drop-panel").slideDown();
	};
});

plugin.methods.isPhotoComposerActive = function() {
	return this.component.currentComposer.id === "photo";
};

plugin.methods.renewMediaPanel = function() {
	this.composer.find(".echo-photo-composer-drop-panel").removeAttr("disabled");
	this.composer.find(".echo-photo-composer-uploading-tooltip")
		.text(this.labels.get("initialUploadingTooltip"));

	this.composer.find(".echo-photo-composer-plus-button")
		.text(this.labels.get("plus"))
		.removeClass("echo-photo-composer-filepicker-loading");
};

plugin.methods.buildComposer = function() {
	var self = this;
	this.composer = $("<div>").append([
		'<div class="echo-cardcomposer-field-wrapper">',
			'<input type="text" class="echo-photo-composer-title" placeholder="', this.labels.get("title"), '">',
		'</div>',
		'<div class="echo-cardcomposer-delimiter"></div>',
		'<div class="echo-photo-composer-drop-panel">',
			'<div class="echo-photo-composer-drop-panel-wrapper">',
				'<div class="echo-photo-composer-drop-panel-container strippedBackground">',
					'<div class="echo-photo-composer-plus-button">',
						this.labels.get("plus"),
					'</div>',
					'<span class="echo-photo-composer-uploading-tooltip">',
						this.labels.get("initialUploadingTooltip"),
					'</span>',
				'</div>',
			'</div>',
		'</div>'
	].join(""));

	var attachMedia = function(url) {
		self.component.attachMedia({
			"urls": [url],
			"removeOld": true
		});
	};

	var plusButton = self.composer.find(".echo-photo-composer-plus-button");
	var tooltip = self.composer.find(".echo-photo-composer-uploading-tooltip");
	var dropPanel = self.composer.find(".echo-photo-composer-drop-panel");
	window.filepicker.setKey(self.component.config.get("dependencies.FilePicker.apiKey"));
	window.filepicker.makeDropPane(dropPanel[0], {
		"multiple": false,
		"mimetype": "image/*",
		"onStart": function(files) {
			plusButton.addClass("echo-photo-composer-filepicker-loading").empty();
			tooltip.text(self.labels.get("loading"));
			self.component.disablePostButtonBy("photo-uploading");
		},
		"onSuccess": function(InkBlobs) {
			attachMedia(InkBlobs[0].url);
		},
		"onError": function(type, message) {
			self.component.enablePostButtonBy("photo-uploading");
			self.log(message);
			self.renewMediaPanel();
		}
	});

	dropPanel.click(function(event) {
		self.component.disablePostButtonBy("photo-uploading");
		plusButton.addClass("echo-photo-composer-filepicker-loading").empty();
		tooltip.text(self.labels.get("loading"));
		window.filepicker.pick({
			"mimetype": "image/*",
			"container": "modal",
			"mobile": Echo.Utils.isMobileDevice()
		}, function(InkBlob) {
			attachMedia(InkBlob.url);
		}, function(FPError) {
			self.component.enablePostButtonBy("photo-uploading");
			self.renewMediaPanel();
			self.log(FPError);
		});
	});

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
	return '<div class="echo-media-item" data-oembed="{data:oembed}">' +
		'<a href="{data:original_url}" target="_blank">' +
			'<img src="{data:url}">' +
		'</a>' +
	'</div>';
};

var gradientStyle = function(value) {
	var propertyName = "background-image";
	return $.map(["linear-gradient", "-webkit-linear-gradient", "-moz-linear-gradient", "-ms-linear-gradient", "-o-linear-gradient"], function(propertySpecific) {
		return propertyName +': ' + propertySpecific + "(" + value + ")";
	}).join(";");
};

plugin.css =
	'.echo-photo-composer-drop-panel { width: 100%; height: 100%; max-height: 388px; cursor: pointer; background-color: #eee; text-align: center; font-size: 16px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #9f9f9f; font-weight: normal; padding: 1px 0 0 0; }' +
	'.echo-photo-composer-plus-button { font-size: 128px; line-height: 128px; font-weight: bold; width: 128px; height: 128px; margin: 0 auto; }' +
	'.strippedBackground { ' +
		gradientStyle("left top, #e3e3e3 0%, #e3e3e3 25%, #eee 25%, #eee 50%, #e3e3e3 50%, #e3e3e3 75%, #eee 75%") + '; ' +
		'filter: progid:DXImageTransform.Microsoft.gradient( startColorstr="#e3e3e3", endColorstr="#eeeeee",GradientType=0 ); ' +
		'background-size: 70px 70px;' +
	'}' +
	'.echo-photo-composer-drop-panel-wrapper { border: 1px solid #C4C4C4; margin: 5px; border-radius: 2px; }' +
	'.echo-photo-composer-drop-panel-container { padding: 10px 0 40px 0; margin: 5px; }' +
	'.echo-photo-composer-uploading-tooltip { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 14px; }' +
	'.echo-photo-composer-filepicker-loading { background-image: url("{%= baseURLs.prod %}/images/loading.gif"); background-size: 80px; background-repeat: no-repeat; background-position: 24px 39px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
