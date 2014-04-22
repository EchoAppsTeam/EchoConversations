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

Echo.Utils.oEmbedValidate = function(oembed) {
	var fields = {
		"photo": ["url", "width", "height"],
		"link": ["url", "title"],
		"video": ["html", "width", "height"],
		"rich": ["html", "width", "height"]
	};

	if ($.isPlainObject(oembed) &&
			oembed.type &&
			oembed.version &&
			fields[oembed.type]
	) {
		return !$.grep(fields[oembed.type], function(field) {
			return !oembed[field];
		}).length;
	} else {
		return false;
	}
};

})(Echo.jQuery);
