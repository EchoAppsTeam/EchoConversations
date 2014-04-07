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
			"background-image": "url('" + args.avatar + "'), url('" + args.defaultAvatar + "')"
		});
	if (isIE8) {
		element.css({
			"filter": "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + args.defaultAvatar + "', sizingMethod='scale'), " +
				"progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + args.avatar + "', sizingMethod='scale')"
		});
	}
};

Echo.Utils.addCSS(
	'.echo-avatar { background-size: cover; background-position: center; border-radius: 50%; }',
	'echo-utils'
);

})(Echo.jQuery);
