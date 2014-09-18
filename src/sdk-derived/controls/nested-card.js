(function($) {
"use strict";

var card = Echo.App.manifest("Echo.StreamServer.Controls.NestedCard");

if (Echo.App.isDefined(card)) return;

card.templates.photo =
	'<div class="{class:item}">' +
		'<div class="{class:border}">' +
			'<div class="{class:photo}">' +
				'<div class="{class:photoContainer}">' +
					'<img class="{class:photoThumbnail}" title="{data:title}"/>' +
				'</div>' +
			'</div>' +

			'<div class={class:content}>' +
				'<div class="{class:avatar}" title="{data:author_name}">' +
					'<div></div>{data:author_name}' +
				'</div>' +
				'<div class="{class:label}">' +
					'<div class="{class:title}" title="{data:title}">' +
						'<a class="echo-clickable" href="{data:url}" target="_blank">{data:title}</a>' +
					'</div>' +
					'<div class="{class:description}">{data:description}</div>' +
				'</div>' +
				'<a class="{class:sourceIcon}" target="_blank"></a>' +
			'</div>' +

		'</div>' +
		'<div class="echo-primaryFont {class:closeButton}">&times;</div>' +
	'</div>';

card.templates.video =
	'<div class="{class:item}">' +
		'<div class="{class:border}">' +
			'<div class="{class:video}">' +
				'<div class="{class:videoContainer}">' +
					'<div class="{class:videoWrapper}">' +
						'<div class="{class:videoPlaceholder}">' +
							'<div class="{class:playButton}"></div>' +
							'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
						'</div>' +
					'</div>' +
				'</div>' +

				'<div class="{class:content}">' +
					'<div class="{class:avatar}" title="{data:author_name}">' +
						'<div></div>{data:author_name}' +
					'</div>' +
					'<div class="{class:label}">' +
						'<div class="{class:title}" title="{data:title}">{data:title}</div>' +
						'<div class="{class:description}">{data:description}</div>' +
					'</div>' +
					'<a class="{class:sourceIcon}" target="_blank"></a>' +
				'</div>' +

			'</div>' +
		'</div>' +
		'<div class="echo-primaryFont {class:closeButton}">&times;</div>' +
	'</div>';

card.templates.link =
	'<div class="{class:item}">' +
		'<div class="{class:border}">' +
			'<div class="{class:article}">' +
				'<div class="{class:articleThumbnail}">' +
					'<img src="{data:thumbnail_url}"/>' +
				'</div>' +
				'<div class="{class:articleTemplate}">' +
					'<div class="{class:title} {class:articleTitle}" title="{data:title}">' +
						'<a href="{data:url}" target="_blank">{data:title}</a>' +
					'</div>' +
					'<div class="{class:articleDescription}">{data:description}</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
				'<a class="{class:sourceIcon}" target="_blank"></a>' +
			'</div>' +
		'</div>' +
		'<div class="echo-primaryFont {class:closeButton}">&times;</div>' +
	'</div>';

card.templates.main = function() {
	return this.templates[this.getRenderType()];
};

card.labels = {
	"noMediaAvailable": "No media available",
	"clickToExpand": "Click to expand"
};


card.events = {
	"Echo.Apps.Conversations.onAppResize": function() {
		if (this.getRenderType() === "photo") {
			this.view.render({"name": "photoContainer"});
		}
	}
};

card.sourceIcons = {};

card.init = function() {
	if (this.typeSupported()) {
		this.render();
		this.ready();
	} else {
		this.destroy();
	}
};

card.config = {
	// we display aricle via different layouts
	// according to thumbnail image width
	"minArticleImageWidth": 320,
	"sourceIcons": {
		"predefined": [{
			"pattern": /http:\/\/instagram\.com/i,
			"url": "http://cdn.echoenabled.com/images/favicons/instagram.png"
		}],
		"forbidden": [{
			"pattern": /\/\/www\.filepicker\.io/i
		}]
	},
	"displaySourceIcon": true,
	"displayAuthor": true,
	"maxMediaWidth": undefined
};

card.renderers.closeButton = function(element) {
	var self = this;
	if (!$.isFunction(this.config.get("onRemove"))) {
		return element.hide();
	}
	return element.show().one("click", function() {
		self.config.get("onRemove")(self.get("data"));
	});
};

card.renderers.sourceIcon = function(element) {
	var oembed = this.get("data");

	if (!oembed.provider_url || !this.config.get("displaySourceIcon")) return;

	var icon;

	$.map(this.config.get("sourceIcons.predefined"), function(item) {
		if (item.pattern.test(oembed.provider_url)) {
			icon = item.url;
			return false;
		}
	});

	icon = icon || oembed.provider_url +
		(oembed.provider_url.substr(-1) === "/" ? "" : "/") + "favicon.ico";

	$.map(this.config.get("sourceIcons.forbidden"), function(item) {
		if (item.pattern.test(icon)) {
			card.sourceIcons[icon] = false;
		}
	});

	if (typeof card.sourceIcons[icon] === "undefined") {
		Echo.Utils.loadImage({
			"image": icon,
			"onerror": function() {
				card.sourceIcons[icon] = false;
			},
			"onload": function() {
				$(this).attr("title", oembed.provider_name).appendTo(element);
				card.sourceIcons[icon] = true;
			}
		});
	} else if (card.sourceIcons[icon]) {
		$("<img/>").attr({
			"src": icon,
			"title": oembed.provider_name
		}).appendTo(element);
	}
	if (oembed.original_url) {
		element.attr("href", oembed.original_url);
	}
	return element;
};

card.renderers.avatar = function(element) {
	if (this.displayAuthor()) {
		Echo.Utils.placeAvatar({
			"target": element.children()[0],
			"avatar": this.config.get("defaultAvatar")
		});
		return element;
	} else {
		return element.hide();
	}
};

card.renderers.label = function(element) {
	return !this.get("data.title") && !this.get("data.description")
		? element.hide()
		: element;
};

card.renderers.title = function(element) {
	return this.get("data.title") ? element : element.hide();
};

card.renderers.description = function(element) {
	return this.get("data.description") ? element : element.hide();
};

/**
 * Video
 */
card.renderers.playButton = function(element) {
	var self = this;
	var oembed = this.get("data");
	element.on("click", function() {
		self.view.get("videoPlaceholder").empty().append(
			Echo.Utils.sanitizeOEmbedHTML(oembed.html)
		);
	});
	return element;
};

card.renderers.videoPlaceholder = function(element) {
	var oembed = this.get("data");

	if (!oembed.thumbnail_url) {
		element.empty().append(
			Echo.Utils.sanitizeOEmbedHTML(oembed.html)
		);
	}
	return element.css("padding-bottom", oembed.height / oembed.width * 100 + "%");
};

card.renderers.videoWrapper = function(element) {
	var width = this.get("data.width");
	if (typeof this.config.get("maxMediaWidth") === "number" && this.config.get("maxMediaWidth") < width) {
		width = this.config.get("maxMediaWidth");
	}
	return element.css("width", width);
};

/**
 *  Photo
 */
card.renderers.photoThumbnail = function(element) {
	var self = this;
	var isArticle = this.get("data.type") === "link";
	var thumbnail = isArticle
		? this.get("data.thumbnail_url")
		: this.get("data.url");

	if (this.config.get("maxMediaWidth")) {
		element.css("max-width", this.config.get("maxMediaWidth"));
	}

	return element.one("load", function(e) {
		self.events.publish({
			"topic": "onMediaLoad"
		});
	}).one("error", function(e) {
		if (isArticle) {
			self.view.get("photo").hide();
		} else {
			element.hide().after(self.substitute({
				"template": '<div class="{class:noMediaAvailable}"><span>{label:noMediaAvailable}</span></div>'
			}));
		}
	}).attr("src", thumbnail);
};

card.renderers.photoContainer = function(element) {
	var expanded = this.cssPrefix + "expanded";
	var self = this;
	var oembed = this.get("data", {});
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
		var transitionCss = Echo.Utils.foldl({}, ["transition", "-o-transition", "-ms-transition", "-moz-transition", "-webkit-transition"], function(key, acc) {
			acc[key] = 'max-height ease 500ms';
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

card.renderers.photoLabelContainer = function(element) {
	if (!this.get("data.description") && !this.get("data.title")) {
		element.hide();
	} else {
		this.view.get("photoContainer").css({
			"min-height": 55, // first number is added for default item avatar
			"min-width": 200
		});
	}
	return element;
};

/**
 *  Link
 */
card.renderers.article = function(element) {
	if (!this.get("data.thumbnail_url")) {
		element.addClass(this.cssPrefix + "withoutPhoto");
	}
	return element;
};

card.methods.displayAuthor = function() {
	return this.get("data.author_name") && this.config.get("displayAuthor");
};

card.methods.getRenderType = function() {
	var defaultType = this.get("data.type");
	var handlers = {
		"link": function(data) {
			return this.config.get("data.thumbnail_width") >= this.config.get("minArticleImageWidth")
				? "photo"
				: "link";
		}
	};
	return handlers[defaultType]
		? handlers[defaultType].call(this)
		: defaultType;
};

card.methods.typeSupported = function() {
	return !!this.templates[this.getRenderType()];
};

card.css =
	'.{class:item} { text-align: left; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; display: inline-block; max-width: 100%; vertical-align: top; position: relative; }' +
	'.{class:border} { white-space: normal; word-break: break-word; background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; }' +
	'.{class:item} .{class:sourceIcon} > img { width: 18px; height: 18px; margin: 10px 0 10px 16px; }' +
	'.{class:avatar} > div { background-image: url("{config:defaultAvatar}"); vertical-align: middle; width: 36px; height: 36px; display:inline-block; margin-right: 6px; }' +
	'.{class:avatar} { margin: 15px 16px 0 16px; font-size: 17px; line-height: 18px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:description} { overflow: hidden; }' +

	'.echo-sdk-ui .{class:label} a:link, ' +
		'.echo-sdk-ui .{class:label} a:visited, ' +
		'.echo-sdk-ui .{class:label} a:hover, ' +
		'.echo-sdk-ui .{class:label} a:active { color: #42474A; }' +

	'.{class:label} { padding: 15px 0 10px 0; }' +
	'.{class:title} { font-weight: bold; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; font-size: 16px; line-height: 22px; margin: 0 16px; }' +
	'.{class:description} { line-height: 21px; font-size: 15px; margin: 5px 16px 0 16px; }' +

	// close button
	'.{class:closeButton} { line-height: 1; opacity: 0.8; filter: alpha(opacity=80); font-size: 30px; font-weight: bold; position: absolute; top: 4px; right: 8px; cursor: pointer; color: #000; text-shadow: 0 0 1px #FFF; }' +
	'.{class:closeButton}:hover { opacity: 1; filter: alpha(opacity=100); }' +

	// photo
	'.{class:photo} .{class:noMediaAvailable} { position: relative; min-height: 145px; padding: 75px 10px 0 10px; background: #000; color: #FFF; min-width: 260px; text-align: center; }' +
	'.{class:photo} { position: relative; left: 0; top: 0; zoom: 1; }' +
	'.{class:photoContainer} { display: block; overflow: hidden; text-align: center; background-color: #000; }' +

	// play button
	'.{class:playButton} { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; z-index: 10; }' +
	'.{class:playButton}:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
	'.{class:playButton} { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; border-radius: 50%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.7); }' +
	'.{class:playButton}:hover { background-color: #3498DB; }' +

	// video
	'.{class:videoWrapper} { background: #000; max-width: 100%; margin: 0 auto; }' +
	'.{class:videoContainer} { background: #000; }' +
	'.{class:videoPlaceholder} img { position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }' +
	'.{class:videoPlaceholder} { max-width: 100%; position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px auto; background: #000000; overflow: hidden; }' +
	'.{class:videoPlaceholder} > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > object { position: absolute; top: 0; left: 0; width: 100%;100 height: 100%; }' +

	// article
	'.{class:article} { padding: 10px 16px; min-width: 200px; }' +
	'.{class:article} .{class:sourceIcon} > img { margin: 10px 0 0 0; }' +
	'.{class:article} .{class:articleTitle} > a { color: #42474A; font-weight: bold; }' +
	'.{class:article} .{class:articleTitle} > a:hover { color: #42474A; }' +
	'.{class:articleTitle} { margin: 0 0 0 10px; font-size: 16px; line-height: 22px; }' +
	'.{class:articleDescription} { overflow: hidden; margin: 5px 0 0 10px; line-height: 21px; font-size: 15px; }' +
	'.{class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{class:articleTemplate} { width: 70%; float: left; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleTitle} { margin-left: 0px; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleDescription} { margin-left: 0px; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleThumbnail} { display: none; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleTemplate} { width: 100%; }';

Echo.App.create(card);

})(Echo.jQuery);
