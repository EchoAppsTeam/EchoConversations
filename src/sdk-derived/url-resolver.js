(function($) {
"use strict";

var cache = {};

Echo.URLResolver = function(config) {
	this.config = new Echo.Configuration(config || {});
};

Echo.URLResolver.prototype.resolve = function(urls, callback) {
	var self = this;
	if ($.fn.embedly) {
		this._resolve(urls, callback);
		return;
	}
	Echo.Loader.download([{
		"url": "{%= baseURLs.prod %}/third-party/jquery.embedly.js"
	}], function() {
		self._resolve(urls, callback);
	});
};

// at least "http://a.bc" or "a.bc/" but more likely "http://domain.com/some/path"
var mask1 = "(https?://)\\S+\\.\\S{2,}";
var mask2 = "(https?://)?\\S+\\.\\w{2,}/\\S*";
var reValidURL = new RegExp("^" + mask1 + "$|^" + mask2 + "$");
var reURLSearch = new RegExp(mask1 + "(?=\\s|$)|(?:^|\\s)" + mask2, "g");

Echo.URLResolver.prototype.normalizeURL = function(url) {
	var matches = url.match(reValidURL);
	if (!matches) return "";
	if (!matches[1] && !matches[2]) {
		url = "http://" + url;
	}
	return url;
};

Echo.URLResolver.prototype.extractURLs = function(text) {
	var self = this;
	return $.map(text.match(reURLSearch) || [], function(url) {
		return self.normalizeURL($.trim(url));
	});
};

Echo.URLResolver.prototype._resolve = function(urls, callback) {
	var self = this, unresolvedURLs = [];
	var respond = function() {
		callback($.map(urls, function(url) {
			return $.extend(true, {}, cache[url]);
		}));
	};
	// normalize urls and collect unresolved ones
	urls = $.map(urls, function(url) {
		url = self.normalizeURL(url);
		if (url && !cache[url]) {
			unresolvedURLs.push(url);
		}
		return url;
	});

	if (!unresolvedURLs.length) {
		respond();
		return;
	}

	var embedlyKey = $.embedly.defaults.key;
	// use our own API key for this request ...
	$.embedly.defaults.key = this.config.get("embedly.apiKey");
	$.embedly.oembed(unresolvedURLs, {
		"query": {
			"chars": this.config.get("embedly.maxDescriptionCharacters")
		}
	}).progress(function(data) {
		if (data.type === "error") return;
		cache[data.original_url] = data;
	}).done(function() {
		// ... and restore key that was before when request is finished
		$.embedly.defaults.key = embedlyKey;
		respond();
	});
};

})(Echo.jQuery);
