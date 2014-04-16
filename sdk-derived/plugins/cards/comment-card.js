(function($) {
"use strict";

var plugin = Echo.Plugin.manifest("CommentCard", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.dependencies = [{
	"loaded": function() { return !!Echo.StreamServer.Controls.MediaContainer; },
	"url": "{%= baseURLs.prod %}/sdk-derived/controls/media-container.js"
}];

plugin.init = function() {
	var self = this;
	var hasAttachments = function() {
		return !!self.component.get("data.object.parsedContent.oembed", []).length;
	};
	this.component.registerVisualizer({
		"id": "comment",
		"objectTypes": {
			"http://activitystrea.ms/schema/1.0/note": ["allItems", hasAttachments],
			"http://activitystrea.ms/schema/1.0/comment": ["allItems", hasAttachments],
			"http://echoenabled.com/schema/1.0/link": ["allItems", hasAttachments],
			"http://activitystrea.ms/schema/1.0/article": ["childItems", hasAttachments],
			"http://activitystrea.ms/schema/1.0/image": ["childItems", hasAttachments],
			"http://activitystrea.ms/schema/1.0/video": ["childItems", hasAttachments]
		},
		"parseContent": $.proxy(this.parseContent, this),
		"init": function() {
			self.extendTemplate("insertAsLastChild", "data", plugin.templates.media);
		}
	});
};

plugin.templates.media = '<div class="{plugin.class:mediaContent}"></div>';

plugin.renderers.mediaContent = function(element) {
	var attachments = this.component.get("data.object.parsedContent.oembed");
	new Echo.StreamServer.Controls.MediaContainer(this.config.assemble({
		"target": element.empty(),
		"data": attachments,
		"card": {
			"maxMediaWidth": this.component.config.get("limits.maxMediaWidth")
		}
	}));

	return element.addClass(this.cssPrefix + (attachments.length > 1 ? "multiple" : "single"));
};

plugin.methods.parseContent = function() {
	var content = $("<div>").append(this.component.get("data.object.content"));
	var attachments = content.find("div[data-oembed]");
	var oembed = attachments.map(function() {
		var oembed = $(this).data("oembed");
		return Echo.Utils.oEmbedValidate(oembed) ? oembed : null;
	}).get();
	attachments.remove();
	this.component.set("data.object.parsedContent", {
		"text": content.html(),
		"oembed": oembed
	});
};

plugin.css =
	'.{class:depth-0} .{plugin.class:mediaContent}.{plugin.class:multiple} { margin-left: -16px; margin-right: -16px; }' +
	'.{class:depth-0} .{plugin.class:mediaContent} { margin-bottom: 0px; }' +
	'.{plugin.class:mediaContent}.{plugin.class:multiple} > div { border-top: 1px solid #D2D2D2; border-bottom: 1px solid #D2D2D2; background-color: #F1F1F1; }' +
	'.{plugin.class:mediaContent} { margin-bottom: 8px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.CommentCard
 * Adds custom composer to CardComposer control allowing to post comments.
 *
 *		new Echo.StreamServer.Controls.CardComposer({
 *			"target": document.getElementById("composer"),
 *			"appkey": "echo.jssdk.demo.aboutecho.com",
 *			"plugins": [{
 *				"name": "CommentCard"
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
var plugin = Echo.Plugin.manifest("CommentCard", "Echo.StreamServer.Controls.CardComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.registerComposer({
		"id": "comment",
		"label": this.labels.get("comment"),
		"icon": "icon-comment",
		"composer": $.proxy(this.buildComposer, this),
		"getData": $.proxy(this.getData, this),
		"setData": $.proxy(this.setData, this),
		"requiresMedia": false,
		"objectType": "http://activitystrea.ms/schema/1.0/comment",
		"showClipButton": true,
		"getMediaConfig": $.proxy(this.getMediaConfig, this)
	});
};

plugin.vars = {
	"composer": null
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"comment": "Comment",
	/**
	 * @echo_label
	 */
	"prompt": "What's on your mind?"
};

plugin.methods.buildComposer = function() {
	var self = this;
	this.composer = $("<div>").append(
		'<div class="echo-cardcomposer-field-wrapper">' +
			'<textarea class="echo-comment-composer-text" placeholder="' + this.labels.get("prompt") + '"></textarea>' +
		'</div>'
	);
	this.composer.find(".echo-comment-composer-text").on("keyup paste", function() {
		self.component.attachMedia({
			"fromElement": $(this),
			"delay": 1000
		});
	});
	return this.composer;
};

plugin.methods.getMediaConfig = function() {
	var self = this;
	var successCallback = function(InkBlobs) {
		InkBlobs = InkBlobs.length ? InkBlobs : [InkBlobs];
		self.component.attachMedia({
			"urls": $.map(InkBlobs, function(picture) {
				return picture.url;
			})
		});
		self.component.enablePostButtonBy("photo-uploading");
	};
	return {
		"dragAndDropOptions": {
			"filepickerOptions": {
				"multiple": false,
				"mimetype": "image/*"
			},
			"onStart": function(files) {
				self.component.disablePostButtonBy("photo-uploading");
			},
			"onSuccess": successCallback,
			"onError": function(type, message) {
				self.component.enablePostButtonBy("photo-uploading");
				self.log(message);
			}
		},
		"clickOptions": {
			"filepickerOptions": {
				"mimetype": "image/*",
				"container": "modal",
				"mobile": Echo.Utils.isMobileDevice()
			},
			"beforeCallback": function(event) {
				self.component.disablePostButtonBy("photo-uploading");
			},
			"onSuccess": successCallback,
			"onError": function(err) {
				self.component.enablePostButtonBy("photo-uploading");
				self.log(err);
			}
		},
		"filepickerAPIKey": self.component.config.get("dependencies.FilePicker.apiKey"),
		"allowMultiple": true
	};
};

plugin.methods.getData = function() {
	return {
		"text": this.composer.find(".echo-comment-composer-text").val(),
		"media": this._getMediaContent()
	};
};

plugin.methods.setData = function(data) {
	this.composer.find(".echo-comment-composer-text").val(data.text);
};

plugin.methods._getMediaContent = function() {
	var self = this;
	var media = this.component.formData.media;
	if (!media.length) return "";
	return $.map(media, function(item) {
		return self.component.substitute({
			"template": self._mediaTemplate(),
			"data": $.extend(true, {}, item, {
				"oembed": self.component._htmlEncode(item)
			})
		});
	}).join("");
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

plugin.css =
	'.echo-sdk-ui textarea.echo-comment-composer-text { height: 75px; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
