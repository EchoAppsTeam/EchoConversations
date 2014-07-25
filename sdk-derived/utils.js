(function($) {
"use strict";

var isIE8 = document.all && document.querySelector && !document.addEventListener;

Echo.Utils.placeAvatar = function(args) {
	args = args || {};
	var element = $(args.target);
	if (!element.length) return;
	element
		.addClass("echo-avatar")
		.css({
			"background-image": $.map(["avatar", "defaultAvatar"], function(key) {
				return args[key]
					? "url('" + args[key] + "')"
					: null;
			}).join(", ")
		});
	if (isIE8) {
		element.css({
			"filter": $.map(["defaultAvatar", "avatar"], function(key) {
				return args[key]
					? "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + args[key] + "', sizingMethod='scale')"
					: null;
			}).join(", ")
		});
	}
	return element;
};

Echo.Utils.addCSS(
	'.echo-avatar { background-size: cover; background-position: center; border-radius: 50%; }',
	'echo-utils'
);

Echo.Utils.sanitizeOEmbedHTML = function(html) {
	html = Echo.Utils.sanitize(html, "html");
	html = $.parseHTML(html);
	// extract only iframes, all other elements are possible hacks
	return $(html).filter("iframe");
};

Echo.Utils.sanitizeOEmbed = function(oembed) {
	// Note that "html" field is not sanitized here as it's a heavy operation.
	// Call Echo.Utils.sanitizeOEmbedHTML when html is going to be displayed.
	var mandatoryFields = {
		"photo": ["url", "width", "height"],
		"link": ["url", "title"],
		"video": ["html", "width", "height"],
		"rich": ["html", "width", "height"]
	};

	if (!$.isPlainObject(oembed) ||
		!oembed.type ||
		!oembed.version ||
		!mandatoryFields[oembed.type]
	) {
		return null;
	}

	var fieldSanitizers = {
		"url": "url",
		"original_url": "url",
		"provider_url": "url",
		"author_url": "url",
		"thumbnail_url": "url",
		"height": "number",
		"width": "number",
		"thumbnail_width": "number",
		"thumbnail_height": "number",
		"title": "plainText",
		"description": "plainText",
		"author_name": "plainText",
		"provider_name": "plainText"
	};
	$.each(fieldSanitizers, function(field, sanitizer) {
		if (!oembed[field]) return;
		oembed[field] = Echo.Utils.sanitize(oembed[field], sanitizer);
	});

	var missing = $.grep(mandatoryFields[oembed.type], function(field) {
		return !oembed[field];
	});
	return missing.length ? null : oembed;
};

})(Echo.jQuery);
