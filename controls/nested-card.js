(function($) {
"use strict";

var card = Echo.App.manifest("Echo.Conversations.NestedCard");

if (Echo.App.isDefined(card)) return;

card.templates.photo =
	'<div class="{class:item}">' +
		'<div class="{class:border}">' +
			'<div class="{class:photo}">' +
				'<div class="{class:photoAvatarWrapper}">' +
					'<div class="{class:avatar} {class:photoAvatar}" title="{data:author_name}">' +
						'<div></div>{data:author_name}' +
					'</div>' +
				'</div>' +
				'<div class="{class:photoContainer}">' +
					'<img class="{class:photoThumbnail}" src="{data:thumbnail_url}" title="{data:title}"/>' +
				'</div>' +
				'<div class="{class:photoLabel}">' +
					'<div class="{class:photoLabelContainer}">' +
						'<div class="{class:title} {class:photoTitle}" title="{data:title}">' +
							'<a class="echo-clickable" href="{data:url}" target="_blank">{data:title}</a>' +
						'</div>' +
						'<div class="{class:description} {class:photoDescription}">{data:description}</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<a class="{class:sourceIcon}" target="_blank"></a>' +
		'</div>' +
	'</div>';

card.templates.video =
	'<div class="{class:item}">' +
		'<div class="{class:border}">' +
			'<div class="{class:video}">' +
				'<div class="{class:avatar} {class:videoAvatar}" title="{data:author_name}">' +
					'<div></div>{data:author_name}' +
				'</div>' +
				'<div class="{class:videoWrapper}">' +
					'<div class="{class:videoPlaceholder}">' +
						'<div class="{class:playButton}"></div>' +
						'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</div>' +
				'</div>' +
				'<div class="{class:title} {class:videoTitle}" title="{data:title}">{data:title}</div>' +
				'<div class="{class:description} {class:videoDescription}">{data:description}</div>' +
				'<a class="{class:sourceIcon}" target="_blank"></a>' +
			'</div>' +
		'</div>' +
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
					'<div class="{class:articleDescriptionContainer}">' +
						'<div class="{class:articleDescription}">{data:description}</div>' +
					'</div>' +
				'</div>' +
				'<div class="echo-clear"></div>' +
				'<a class="{class:sourceIcon}" target="_blank"></a>' +
			'</div>' +
		'</div>' +
	'</div>';

card.templates.main = function() {
	return this.templates[this.getRenderType()];
};

card.labels = {
	"noMediaAvailable": "No media available"
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
	this.render();
	this.ready();
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
	"displayAuthor": true
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
	// we have to do it because filter must work in IE8 only
	// in other cases we will have square avatar in IE 9
	var isIE8 = document.all && document.querySelector && !document.addEventListener;
	if (isIE8) {
		element.children()[0].style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + this.config.get("defaultAvatar") + "', sizingMethod='scale')";
	}
	return this.get("data.author_name") && this.config.get("displayAuthor")
		? element
		: element.hide();
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
		self.view.get("videoPlaceholder").empty().append($(oembed.html));
	});
	return element;
};

card.renderers.videoPlaceholder = function(element) {
	var oembed = this.get("data");

	if (!oembed.thumbnail_url) {
		element.empty().append($(oembed.html));
	}

	return element.css({
		"width": oembed.width,
		"padding-bottom": oembed.height / oembed.width * 100 + "%"
	});
};

/**
 *  Photo
 */
card.renderers.photoThumbnail = function(element) {
	var self = this;
	var thumbnail = this.get("data.type") === "link"
		? this.get("data.thumbnail_url")
		: this.get("data.url");

	return element.on("error", function() {
		element.replaceWith(self.substitute({
			"template": '<div class="{class:noMediaAvailable}"><span>{label:noMediaAvailable}</span></div>'
		}));
	}).attr("src", thumbnail);
};

card.renderers.photoContainer = function(element) {
	var expanded = this.cssPrefix + "expanded";

	var oembed = this.get("data", {});
	var thumbnailWidth = this.view.get("photoThumbnail").width();
	var expandedHeight = oembed.height;
	var collapsedHeight = (thumbnailWidth || oembed.width) * 9 / 16;

	//calc height using aspect ratio 16:9
	if (!element.hasClass(expanded) && oembed.height > collapsedHeight) {
		var transitionCss = Echo.Utils.foldl({}, ["transition", "-o-transition", "-ms-transition", "-moz-transition", "-webkit-transition"], function(key, acc) {
			acc[key] = 'max-height ease 500ms';
		});

		element.addClass("echo-clickable");
		element
			.css("max-height", 250)
			.one("click", function() {
				element.css(transitionCss);
				element.css("max-height", expandedHeight);
				element.removeClass("echo-clickable");
				element.addClass(expanded);
			});
	} else {
		element.css("max-height", expandedHeight);
	}

	return element;
};

card.renderers.photoLabelContainer = function(element) {
	// calculate photoLabel max-height
	var photoLabelHeight = 20 // photoLabelContainer padding
		+ 2*16; // photoDescription line-height * lines count

	if (this.get("data.title")) {
		photoLabelHeight += 16 // photoTitle width
			+ 5; // photoTitle margin
	}
	this.view.get("photoLabel").css("max-height", photoLabelHeight);

	return this.get("data.description") || this.get("data.title")
		? element
		: element.hide();
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

var transition = function(value) {
	return $.map(["transition", "-o-transition", "-ms-transition", "-moz-transition", "-webkit-transition"], function(propertyName) {
		return propertyName +': ' + value;
	}).join(";");
};

card.css =
	'.{class:title} { font-weight: bold; margin: 5px 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:item} { text-align: left; font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; display: inline-block; max-width: 100%; vertical-align: top; }' +
	'.{class:border} { white-space: normal; word-break: break-word; background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; }' +
	'.{class:item} .{class:sourceIcon} > img { width: 18px; height: 18px; }' +
	'.echo-sdk-ui .{class:avatar} > div { width: 28px; height: 28px; background-size:cover; display:inline-block; background-position:center; border-radius: 50%; margin-right: 6px; }' +
	'.{class:description} { overflow: hidden; }' +

	// photo
	'.{class:photo} .{class:noMediaAvailable} { position: relative; min-height: 145px; padding: 75px 10px 0 10px; background: #000; color: #FFF; min-width: 260px; text-align: center; }' +
	'.{class:photoAvatarWrapper} { position: absolute; width: 100%; }' +
	'.{class:photoAvatar} { color: #FFF; white-space: nowrap; padding: 12px; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:photoAvatar} > div { background-image: url("{config:defaultAvatar}"); vertical-align: middle; }' +
	'.{class:photo} { position: relative; left: 0; top: 0; zoom: 1; }' +
	'.{class:photo} + .{class:sourceIcon} > img { padding: 10px; }' +
	'.{class:photoLabel} { position: absolute; bottom: 0; color: #FFF; width: 100%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.5); }' +
	'.{class:photoContainer} { display: block; overflow: hidden; text-align: center; background-color: #000; }' +

	'.echo-sdk-ui .{class:photoLabel} a:link, .echo-sdk-ui .{class:photoLabel} a:visited, .echo-sdk-ui .{class:photoLabel} a:hover, .echo-sdk-ui .{class:photoLabel} a:active { color: #fff; }' +
	'.{class:photoLabelContainer} { padding: 10px; }' +
	'.{class:photoTitle} { margin: 0 0 5px 0; }' +

	'.{class:photoLabel} { overflow: hidden; }' +
	'.{class:photo}:hover .{class:photoLabel} { max-height: 100% !important; }' +
	'.{class:photoLabel} { ' + transition('max-height ease 300ms') + '; }' +

	// play button
	'.{class:playButton} { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; z-index: 10; }' +
	'.{class:playButton}:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
	'.{class:playButton} { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; border-radius: 50%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.7); }' +
	'.{class:playButton}:hover { background-color: #3498DB; }' +

	// video
	'.{class:video} { padding: 10px; }' +
	'.{class:video} .{class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{class:videoAvatar} { margin-bottom: 8px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:videoTitle} { margin: 10px 0 0 0; }' +
	'.{class:videoAvatar} > div { background-image: url("{config:defaultAvatar}"); vertical-align: middle; }' +
	'.{class:videoDescription} { margin: 5px 0 0 0; }' +
	'.{class:videoWrapper} { background: #000; }' +
	'.{class:videoPlaceholder} img { position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }' +
	'.{class:videoPlaceholder} { max-width: 100%; position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px auto; background: #000000; overflow: hidden; }' +
	'.{class:videoPlaceholder} > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > object { position: absolute; top: 0; left: 0; width: 100%;100 height: 100%; }' +

	// article
	'.{class:article} { padding: 10px; min-width: 200px; }' +
	'.{class:article} .{class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{class:article} .{class:articleTitle} > a { color: #42474A; font-weight: bold; }' +
	'.{class:article} .{class:articleTitle} > a:hover { color: #42474A; }' +
	'.{class:articleTitle} { margin-left: 10px; margin-top: 0px; line-height: 16px; }' +
	'.{class:articleDescription} { margin-left: 10px; font-size: 13px; line-height: 16px; }' +
	'.{class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{class:articleTemplate} { width: 70%; float: left; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleTitle} { margin-left: 0px; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleDescription} { margin-left: 0px; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleThumbnail} { display: none; }' +
	'.{class:article}.{class:withoutPhoto} .{class:articleTemplate} { width: 100%; }';

Echo.App.create(card);

})(Echo.jQuery);
