(function($) {
"use strict";

var cache = {};

Echo.URLResolver = function(config) {
	this.config = new Echo.Configuration(config);
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
var reURL = /^(https?:\/\/)\S+\.\S{2,}$|^(https?:\/\/)?\S+\.\w{2,}\/\S*$/;

Echo.URLResolver.prototype.normalizeURL = function(url) {
	var matches = url.match(reURL);
	if (!matches) return "";
	if (!matches[1] && !matches[2]) {
		url = "http://" + url;
	}
	return url;
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
		// ... and restore key that was before after request is done
		$.embedly.defaults.key = embedlyKey;
		respond();
	});
};

})(Echo.jQuery);
