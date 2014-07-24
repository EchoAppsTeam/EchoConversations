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
	// We intentionally break HTML attributes starting with "on".
	// These attributes are only event handlers anyway and we don't want them.
	// This action doesn't allow for "<img src=# onerror=alert(1)>" HTML string
	// to execute JavaScript
	html = html.replace(/(<[^>]+?\bon)([^>]+>)/ig, "$1_$2");
	html = $.parseHTML(html);
	// extract only iframes, all other elements are possible hacks
	return $(html).filter("iframe");
};

Echo.Utils.sanitizeOEmbed = function(oembed) {
	// Note that "html" field is not sanitized here as it's a heavy operation.
	// Call Echo.Utils.sanitizeOEmbedHTML when html is going to be displayed.
	var fields = {
		"photo": ["url", "width", "height"],
		"link": ["url", "title"],
		"video": ["html", "width", "height"],
		"rich": ["html", "width", "height"]
	};

	if (!$.isPlainObject(oembed) ||
		!oembed.type ||
		!oembed.version ||
		!fields[oembed.type]
	) {
		return null;
	}

	// sanitize URL fields
	$.each(["url", "original_url", "provider_url", "author_url", "thumbnail_url"], function(i, field) {
		if (!oembed[field]) return;
		if (/javascript:/i.test(oembed[field])) {
			delete oembed[field];
		}
	});

	// sanitize numeric fields
	$.each(["height", "width", "thumbnail_width", "thumbnail_height"], function(i, field) {
		if (!oembed[field]) return;
		oembed[field] = +oembed[field];
		if (isNaN(oembed[field])) {
			delete oembed[field];
		}
	});

	// sanitize text-only fields
	$.each(["title", "description", "author_name", "provider_name"], function(i, field) {
		if (!oembed[field]) return;
		oembed[field] = Echo.Utils.stripTags(oembed[field]);
	});

	// check if some necessary fields are missing
	var missing = $.grep(fields[oembed.type], function(field) {
		return !oembed[field];
	});
	return missing.length ? null : oembed;
};

})(Echo.jQuery);
