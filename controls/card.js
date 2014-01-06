(function($) {
"use strict";

var card = Echo.App.manifest("Echo.Conversations.Card");

if (Echo.App.isDefined(card)) return;

card.templates.photo =
			'<div class="{class:item}">' +
				'<div class="{class:photo}">' +
					'<div class="{class:avatar} {class:photoAvatar}"><img src="{config:defaultAvatar}"/>{data:author_name}</div>' +
					'<a href="{data:url}" target="_blank">' +
						'<img class="{class:photoThumbnail}" src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</a>' +
					'<div class="{class:photoLabel}">' +
						'<div class="{class:photoLabelContainer}">' +
							'<div class="{class:title} {class:photoTitle}">{data:title}</div>' +
							'<div class="{class:description} {class:photoDescription}">{data:description}</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="{class:sourceIcon}" data-url="{data:provider_url}" data-name="{data:provider_name}"></div>' +
			'</div>';

card.templates.video =
			'<div class="{class:item}">' +
				'<div class="{class:video}">' +
					'<div class="{class:avatar} {class:videoAvatar}"><img src="{config:defaultAvatar}"/>{data:author_name}</div>' +
					'<div class="{class:videoPlaceholder}">' +
						'<div class="{class:playButton}"></div>' +
						'<img src="{data:thumbnail_url}" title="{data:title}"/>' +
					'</div>' +
					'<div class="{class:title} {class:videoTitle}">{data:title}</div>' +
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
						'<div class="{class:title} {class:articleTitle}">' +
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
	return this.templates[this.get("data.type")];
};

card.init = function() {
	// TODO handle situation when thumbnail_url is not defined
	this.render();
	this.ready();
};

card.renderers.item = function(element) {
	var maxWidth = this.config.get("maxWidth");
	if (maxWidth) {
		element.css("max-width", maxWidth);
	}
	return element;
};

card.renderers.sourceIcon = function(element) {
	Echo.Utils.loadImage({
		"image": element.data("url") + "/favicon.ico",
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
	if (!oembed.thumbnail_url) {
		element.empty().append($(oembed.html));
	}
	return element;
};

/**
 *  Photo
 */
card.renderers.photoThumbnail = function(element) {
	var thumbnail = this.get("data.thumbnail_url", this.get("data.url"));
	return element.attr("src", thumbnail);
};

card.renderers.photoLabelContainer = function(element) {
	return this.get("data.description") || this.get("data.title")
		? element
		: element.hide();
};

card.css =
	'.{class:item} { background-color: #FFFFFF; border: 1px solid #D2D2D2; border-bottom-width: 2px; margin: 0 8px 0 0; font-family: "Helvetica Neue", arial, sans-serif; color: #42474A; font-size: 13px; line-height: 16px; }' +
	'.{class:title} { font-weight: bold; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:item} .{class:sourceIcon} > img { max-width: 20px; }' +
	'.{class:avatar} > img { width: 28px; height: 28px; border-radius: 50%; margin-right: 6px; }' +

	// photo
	'.{class:photoAvatar} { position: absolute; padding: 12px; color: #FFF; }' +
	'.{class:photo} { position: relative; }' +
	'.{class:photo} + .{class:sourceIcon} > img { padding: 10px; }' +
	'.{class:photoLabel} { position: absolute; bottom: 0; color: #FFF; width: 100%; background: rgba(0, 0, 0, 0.5); }' +
	'.{class:photoLabelContainer} { padding: 10px; }' +
	'.{class:photoTitle} { margin: 0 0 5px 0; }' +

	// play button
	'.{class:videoPlaceholder} { position: relative; }' +
	'.{class:playButton} { cursor: pointer; position: absolute; top: 0; left: 0; bottom: 0; right: 0; }' +
	'.{class:playButton}:after { content: ""; position: absolute; top: 10px; left: 20px; border-left: 30px solid #FFF; border-top: 20px solid transparent; border-bottom: 20px solid transparent; }' +
	'.{class:playButton} { box-shadow: 0px 0px 40px #000; margin: auto; width: 60px; height: 60px; background-color: rgba(0, 0, 0, 0.7); border-radius: 50%; }' +
	'.{class:playButton}:hover { background-color: #3498DB; }' +

	// video
	'.{class:video} { padding: 10px; }' +
	'.{class:video} .{class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{class:videoAvatar} { margin-bottom: 8px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }' +
	'.{class:videoTitle} { margin: 10px 0 0 0; }' +
	'.{class:videoDescription} { margin: 5px 0 0 0; }' +

	// TODO: fix video resizing
	//'.{class:videoPlaceholder} { position: relative; padding-bottom: 75%; height: 0; float: none; margin: 0px; }' +
	//'.{class:videoPlaceholder} > iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	//'.{class:videoPlaceholder} > video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +
	//'.{class:videoPlaceholder} > object { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }' +

	// article
	'.{class:article} { padding: 10px; min-width: 200px; }' +
	'.{class:article} .{class:sourceIcon} > img { padding: 10px 0 0 0; }' +
	'.{class:article} .{class:articleTitle} > a { color: #42474A; font-weight: bold; }' +
	'.{class:article} .{class:articleTitle} > a:hover { color: #42474A; }' +
	'.{class:articleTitle} { padding: 0 0 5px 0; margin-left: 10px; }' +
	'.{class:articleDescription} { margin-left: 10px; font-size: 13px; line-height: 16px; }' +
	'.{class:articleThumbnail} { width: 30%; float: left; max-width: 120px; max-height: 120px; text-align:center; overflow:hidden; }' +
	'.{class:articleThumbnail} img { width: auto; height: auto; max-height:120px; max-width:120px; }' +
	'.{class:articleTemplate} { width: 70%; float: left; }';

Echo.App.create(card);

})(Echo.jQuery);
