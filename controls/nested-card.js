(function($) {
"use strict";

var card = Echo.App.manifest("Echo.Conversations.NestedCard");

if (Echo.App.isDefined(card)) return;

card.templates.photo =
			'<div class="{class:item}">' +
				'<div class="{class:photo}">' +
					'<div class="{class:photoAvatarWrapper}">' +
						'<div class="{class:avatar} {class:photoAvatar}" title="{data:author_name}">' +
							'<div></div>{data:author_name}' +
						'</div>' +
					'</div>' +
					'<a href="{data:url}" target="_blank">' +
						'<img class="{class:photoThumbnail}" src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</a>' +
					'<div class="{class:photoLabel}">' +
						'<div class="{class:photoLabelContainer}">' +
							'<div class="{class:title} {class:photoTitle}" title="{data:title}">' +
								'<a class="echo-clickable" href="{data:url}" target="_blank">{data:title}</a>' +
							'</div>' +
							'<div class="{class:description} {class:photoDescription}">{data:description}</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="{class:sourceIcon}" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
			'</div>';

card.templates.video =
			'<div class="{class:item}">' +
				'<div class="{class:video}">' +
					'<div class="{class:avatar} {class:videoAvatar}" title="{data:author_name}">' +
						'<div></div>{data:author_name}' +
					'</div>' +
					'<div class="{class:videoPlaceholder}">' +
						'<div class="{class:playButton}"></div>' +
						'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</div>' +
					'<div class="{class:title} {class:videoTitle}" title="{data:title}">{data:title}</div>' +
					'<div class="{class:description} {class:videoDescription}">{data:description}</div>' +
					'<div class="{class:sourceIcon}" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
				'</div>' +
			'</div>';

card.templates.link =
			'<div class="{class:item}">' +
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
					'<div class="{class:sourceIcon}" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
				'</div>' +
			'</div>';

card.templates.main = function() {
	var data = this.get("data");
	var handlers = {
		"link": function(data) {
			var width = this.config.get("width");
			return (width && data.thumbnail_width >= width)
				? this.templates["photo"]
				: this.templates["link"];
		}
	};
	return handlers[data.type]
		? handlers[data.type].call(this, data)
		: this.templates[data.type];
};

card.config = {
	"width": 340
};

card.init = function() {
	// TODO handle situation when thumbnail_url is not defined
	this.render();
	this.ready();
};

card.renderers.item = function(element) {
	return element.css("max-width", this._getMaxWidth());
};

card.renderers.sourceIcon = function(element) {
	var proviredURL = element.data("url");
	var icon;
	var sourceIcons = [{
		"pattern": /http:\/\/instagram\.com/i,
		"url": "http://cdn.echoenabled.com/images/favicons/instagram.png"
	}];

	$.map(sourceIcons, function(item) {
		if (item.pattern.test(proviredURL)) {
			icon = item.url;
			return false;
		}
	});

	icon = icon || proviredURL +
		(proviredURL.substr(-1) === "/" ? "" : "/") + "favicon.ico";

	Echo.Utils.loadImage({
		"image": icon,
		"onerror": $.noop,
		"onload": function() {
			$(this).attr("title", element.data("name")).appendTo(element);
		}
	});
};

card.renderers.avatar = function(element) {
	return this.get("data.author_name") ? element : element.hide();
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
	var maxWidth = this.config.get("width") - 20; // consider margins (margin: 10px)

	if (!oembed.thumbnail_url) {
		element.empty().append($(oembed.html));
	}
	//TODO: calc height/width
	var ratio, dimensions;
	if (oembed.thumbnail_width) {
		ratio = maxWidth / oembed.thumbnail_width;
		dimensions = {
			"width": maxWidth,
			"height": oembed.thumbnail_height * ratio
		};
	} else if (maxWidth < oembed.width) {
		ratio = maxWidth / oembed.width;
		dimensions = {
			"width": maxWidth,
			"height": oembed.height * ratio
		};
	} else {
		dimensions = {
			"width": oembed.width,
			"height": oembed.height
		};
	}
	// IE11 layout fix
	element.parent().css("width", dimensions.width - 2);

	return element.css(dimensions);
};

/**
 *  Photo
 */
card.renderers.photoThumbnail = function(element) {
	var width = this.config.get("width");
	var oembed = this.get("data");
	var thumbnail = oembed.thumbnail_url && oembed.thumbnail_width >= width
		? oembed.thumbnail_url
		: oembed.url;

	return element.attr("src", thumbnail);
};

card.renderers.photoLabelContainer = function(element) {
	return this.get("data.description") || this.get("data.title")
		? element
		: element.hide();
};

card.methods._getMaxWidth = function() {
	var maxWidth = this.config.get("width");
	var oembed = this.get("data");
	if (oembed.type === "photo") {
		maxWidth = Math.min(
			maxWidth,
			(oembed.thumbnail_url && oembed.thumbnail_width >= maxWidth) ? oembed.thumbnail_width : oembed.width
		);
	}
	return maxWidth;
};

// calculate photoLabel max-height
var photoLabelHeight = 20 // photoLabelContainer padding
	+ 16 // photoTitle width
	+ 5 // photoTitle margin
	+ 3*16; // photoDescription line-height * lines count

card.css =
	'.{class:title} { font-weight: bold; margin: 5px 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:item} { background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; margin: 0px; font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; }' +
	'.{class:item} .{class:sourceIcon} > img { max-width: 20px; }' +
	'.echo-sdk-ui .{class:avatar} > div { width: 28px; height: 28px; background-size:cover; display:inline-block; background-position:center; border-radius: 50%; margin-right: 6px; }' +

	// photo
	'.{class:photoAvatarWrapper} { position: absolute; width: 100%; }' +
	'.{class:photoAvatar} { color: #FFF; white-space: nowrap; padding: 12px; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:photoAvatar} > div {background-image: url("{config:defaultAvatar}")}' +
	'.{class:photo} { position: relative; }' +
	'.{class:photo} + .{class:sourceIcon} > img { padding: 10px; }' +
	'.{class:photoLabel} { position: absolute; bottom: 0; color: #FFF; width: 100%; background-color: rgb(0, 0, 0); background-color: rgba(0, 0, 0, 0.5); }' +

	'.echo-sdk-ui .{class:photoLabel} a:link, .echo-sdk-ui .{class:photoLabel} a:visited, .echo-sdk-ui .{class:photoLabel} a:hover, .echo-sdk-ui .{class:photoLabel} a:active { color: #fff; }' +
	'.{class:photoLabelContainer} { padding: 10px; }' +
	'.{class:photoTitle} { margin: 0 0 5px 0; }' +

	'.{class:photoLabel} { overflow: hidden; max-height: ' + photoLabelHeight + 'px; }' +
	'.{class:photo}:hover .{class:photoLabel} { max-height: 100%; }' +
	$.map(["transition", "-o-transition", "-ms-transition", "-moz-transition", "-webkit-transition"], function(propertyName) {
		return '.{class:photoLabel} { ' + propertyName +': max-height ease 300ms}';
	}).join("") +

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
	'.{class:videoAvatar} > div {background-image: url("{config:defaultAvatar}")}' +
	'.{class:videoDescription} { margin: 5px 0 0 0; }' +
	'.{class:videoPlaceholder} { position: relative; background: #000000; }' +
	'.{class:videoPlaceholder} img { position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; }' +
	// TODO: fix video resizing
	//'.{class:videoPlaceholder} { position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px; }' +
	'.{class:videoPlaceholder} > iframe { width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > video { width: 100%; height: 100%; }' +
	'.{class:videoPlaceholder} > object { width: 100%; height: 100%; }' +

	// article
	'.{class:article} { padding: 10px; min-width: 200px; }' +
	'.{class:article} .{class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{class:article} .{class:articleTitle} > a { color: #42474A; font-weight: bold; }' +
	'.{class:article} .{class:articleTitle} > a:hover { color: #42474A; }' +
	'.{class:articleTitle} { padding: 0 0 5px 0; margin-left: 10px; margin-right: 15px; }' +
	'.{class:articleDescription} { margin-left: 10px; font-size: 13px; line-height: 16px; }' +
	'.{class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{class:articleTemplate} { width: 70%; float: left; }';

Echo.App.create(card);

})(Echo.jQuery);
