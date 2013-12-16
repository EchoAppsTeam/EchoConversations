(function($) {
"use strict";

var auth = Echo.Control.manifest("Echo.StreamServer.Controls.CardUIAuth");

if (Echo.Control.isDefined(auth)) return;

auth.config = {
	"buttons": ["login", "signup"],
	"infoMessages": {"enabled": false}
};

auth.dependencies = [{
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

auth.labels = {
	"edit": "Edit",
	"login": "Login",
	"logout": "Logout",
	"loggingOut": "Logging out...",
	"switchIdentity": "Switch Identity",
	"or": "or",
	"via": "via",
	"signup": "signup"
};

auth.templates.anonymous =
	'<div class="{class:userAnonymous}">' +
		'<span class="{class:login} echo-linkColor echo-clickable">' +
			'{label:login}' +
		'</span>' +
		'<span class="echo-primaryFont {class:or}"> {label:or} </span>' +
		'<span class="{class:signup} echo-linkColor echo-clickable">' +
			'{label:signup}' +
		'</span>' +
	'</div>';

auth.templates.logged =
	'<div class="{class:userLogged}">' +
		'<div class="{class:avatar}"></div>' +
		'<div class="{class:container}">' +
			'<div class="{class:name}"></div>' +
			'<div class="echo-primaryFont {class:via}"></div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

auth.renderers.via = function(element) {
	return element.append(this.labels.get("via") + " " + this._detectAuthProvider());
};

auth.renderers.login = function(element) {
	return this._assembleIdentityControl("login", element);
};

auth.renderers.signup = function(element) {
	return this._assembleIdentityControl("signup", element);
};

auth.renderers.or = function(element) {
	var buttons = this.config.get("buttons");
	if (!~$.inArray("login", buttons) ||
		!~$.inArray("signup", buttons) ||
		!this.user.get("sessionID")) {
			element.hide();
	}
	return element;
};

auth.renderers.avatar = function(element) {
	this.placeImage({
		"container": element,
		"image": this.user.get("avatar"),
		"defaultImage": this.config.get("defaultAvatar")
	});
	return element;
};

auth.renderers.name = function(element) {
	var auth = this, isSwitchAssembled = false;
	var template = '<span class="{class:dropdown}"></span>';
	new Echo.GUI.Dropdown({
		"target": element,
		"title": auth.user.get("name", "") + this.substitute({"template": template}),
		"extraClass": "nav",
		"entries": [{
			"title": this.labels.get("switchIdentity"),
			"handler": function() {
				if (!isSwitchAssembled) {
					var target = $(this);
					auth._assembleIdentityControl("login", target);
					isSwitchAssembled = true;
					target.click();
				}
			}
		}, {
			"title": this.labels.get("logout"),
			"handler": function() {
				auth._publishBackplaneEvent("identity/logout/request");
				auth.user.logout();
			}
		}]
	});
	return element;
};

auth.methods.template = function() {
	return this.templates[this.user.is("logged") ? "logged" : "anonymous"];
};

auth.methods._detectAuthProvider = function() {
	// TODO: provide an ability to update this list via plugin config
	var providers = {
		"twitter.com": "Twitter",
		"facebook.com": "Facebook",
		"google.com": "Google",
		"me.yahoo.com": "Yahoo"
	};
	var id = this.user.get("identityUrl", "");
	var domain = Echo.Utils.parseURL(id).domain;
	return providers[domain] || domain || id;
};

auth.methods._assembleIdentityControl = function(type, element) {
	var auth = this;
	var buttons = this.config.get("buttons");
	if (!this.user.get("sessionID") || !~$.inArray(type, buttons)) {
		return element.hide();
	}
	return element.on("click", function() {
		auth._publishBackplaneEvent("identity/login/request");
	});
};

auth.methods._publishBackplaneEvent = function(type, data) {
	Backplane.response([{
		// IMPORTANT: we use ID of the last received message
		// from the server-side to avoid same messages re-processing
		// because of the "since" parameter cleanup...
		"id": Backplane.since,
		"channel_name": Backplane.getChannelName(),
		"message": {
			"type": type,
			"payload": this.user.data || {}
		}
	}]);
};

auth.css =
	'.{class:container} { float: left; }' +
	'.{class:or} { font-size: 14px; }' +
	'.{class:via} { margin-left: 15px; color: #D3D3D3; line-height: 18px; font-size: 14px; }' +
	'.{class:name} .{class:dropdown} { background: url("{%= baseURL %}/images/marker.png") no-repeat right center; padding-right: 20px; }' +
	'.{class:name} ul.nav .dropdown .dropdown-toggle { font-size: 20px; }' +
	'.{class:name} ul.nav { margin-bottom: 3px; }' +
	'.{class:name} ul.nav .dropdown-menu li > a { font-size: 14px; }' +
	'.{class:avatar} img { border-radius: 50%; }' +
	'.{class:login}, .{plugin.class} .{class:signup} { color: #006DCC; }' +
	'.{class:userAnonymous} { margin: 0px 0px 7px 2px; text-align: left; }' +
	'.{class:userLogged} { margin: 0px 0px 5px 3px; }' +
	'.{class:name} { float: none; margin: 3px 0px 0px 15px; font-weight: normal; }' +
	'.class:container} { float: left; }' +
	'.{class:avatar} { float: left; width: 48px; height: 48px; border-radius: 50%; }' +
	'.{class:avatar} > img { width: 48px; height: 48px; }';

Echo.Control.create(auth);

})(Echo.jQuery);
