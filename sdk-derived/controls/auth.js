(function($) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Auth
 * Echo Auth control displays the user login status and allows them to sign in using different social identities.
 *
 * 	var identityManager = {
 * 		"title": "Title of the auth area"
 * 		"width": 400,
 * 		"height": 240,
 * 		"url": "http://example.com/auth"
 * 	};
 *
 * 	new Echo.StreamServer.Controls.Auth({
 * 		"target": document.getElementById("echo-auth"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"identityManager": {
 * 			"login": identityManager,
 * 			"signup": identityManager
 * 		}
 * 	});
 *
 * More information regarding the possible ways of the Control initialization
 * can be found in the ["How to initialize Echo components"](#!/guide/how_to_initialize_components-section-initializing-an-app) guide.
 *
 * @extends Echo.Control
 *
 * @package identityserver/controls.pack.js
 * @package identityserver.pack.js
 *
 * @constructor
 * Auth constructor initializing Echo.StreamServer.Controls.Auth class.
 *
 * @param {Object} config
 * Configuration options.
 */
var auth = Echo.Control.manifest("Echo.StreamServer.Controls.Auth");

if (Echo.Control.isDefined(auth)) return;

/** @hide @cfg submissionProxyURL */
/** @hide @method placeImage */
/** @hide @method getRelativeTime */
/** @hide @echo_label justNow */
/** @hide @echo_label today */
/** @hide @echo_label yesterday */
/** @hide @echo_label lastWeek */
/** @hide @echo_label lastMonth */
/** @hide @echo_label secondAgo */
/** @hide @echo_label secondsAgo */
/** @hide @echo_label minuteAgo */
/** @hide @echo_label minutesAgo */
/** @hide @echo_label hourAgo */
/** @hide @echo_label hoursAgo */
/** @hide @echo_label dayAgo */
/** @hide @echo_label daysAgo */
/** @hide @echo_label weekAgo */
/** @hide @echo_label weeksAgo */
/** @hide @echo_label monthAgo */
/** @hide @echo_label monthsAgo */
/** @hide @echo_label loading */
/** @hide @echo_label retrying */
/** @hide @echo_label error_busy */
/** @hide @echo_label error_timeout */
/** @hide @echo_label error_waiting */
/** @hide @echo_label error_view_limit */
/** @hide @echo_label error_view_update_capacity_exceeded */
/** @hide @echo_label error_result_too_large */
/** @hide @echo_label error_wrong_query */
/** @hide @echo_label error_incorrect_appkey */
/** @hide @echo_label error_internal_error */
/** @hide @echo_label error_quota_exceeded */
/** @hide @echo_label error_incorrect_user_id */
/** @hide @echo_label error_unknown */

/**
 * @echo_event Echo.StreamServer.Controls.Auth.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Auth.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Auth.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Auth.onRerender
 * Triggered when the app is rerendered.
 */

auth.config = {
	"buttons": ["login", "signup"],
	/**
	 * @cfg {String} infoMessages
	 * Customizes the look and feel of info messages, for example "loading" and "error".
	 */
	"infoMessages": {"enabled": false},
	"providers": {
		"twitter.com": "Twitter",
		"facebook.com": "Facebook",
		"google.com": "Google",
		"me.yahoo.com": "Yahoo"
	}
};

auth.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() { this.refresh(); }
	}
};

auth.dependencies = [{
	"loaded": function() { return !!Echo.GUI; },
	"url": "{config:cdnBaseURL.sdk}/gui.pack.js"
}, {
	"url": "{config:cdnBaseURL.sdk}/gui.pack.css"
}];

auth.labels = {
	/**
	 * @echo_label
	 */
	"edit": "Edit",
	/**
	 * @echo_label
	 */
	"login": "Login",
	/**
	 * @echo_label
	 */
	"logout": "Logout",
	/**
	 * @echo_label
	 */
	"loggingOut": "Logging out...",
	/**
	 * @echo_label
	 */
	"or": "or",
	/**
	 * @echo_label
	 */
	"signup": "signup",
	/**
	 * @echo_label
	 */
	"switchIdentity": "Switch Identity",
	/**
	 * @echo_label
	 */
	"via": "via"
};

/**
 * @echo_template
 */
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

/**
 * @echo_template
 */
auth.templates.logged =
	'<div class="{class:userLogged}">' +
		'<div class="{class:avatarContainer}">' +
			'<div class="{class:avatar}"></div>' +
		'</div>' +
		'<div class="{class:container}">' +
			'<div class="{class:name}"></div>' +
			'<div class="echo-primaryFont {class:via}"></div>' +
		'</div>' +
		'<div class="echo-clear"></div>' +
	'</div>';

/**
 * @echo_renderer
 */
auth.renderers.via = function(element) {
	return element.append(this.labels.get("via") + " " + this._detectAuthProvider());
};

/**
 * @echo_renderer
 */
auth.renderers.login = function(element) {
	return this._assembleIdentityControl("login", element);
};

/**
 * @echo_renderer
 */
auth.renderers.signup = function(element) {
	return this._assembleIdentityControl("signup", element);
};

/**
 * @echo_renderer
 */
auth.renderers.or = function(element) {
	var buttons = this.config.get("buttons");
	if (!~$.inArray("login", buttons) ||
		!~$.inArray("signup", buttons) ||
		!this.user.get("sessionID")) {
			element.hide();
	}
	return element;
};

/**
 * @echo_renderer
 */
auth.renderers.avatar = function(element) {
	return Echo.Utils.placeAvatar({
		"target": element,
		"avatar": this.user.get("avatar"),
		"defaultAvatar": this.config.get("defaultAvatar")
	});
};

/**
 * @echo_renderer
 */
auth.renderers.name = function(element) {
	var auth = this, isSwitchAssembled = false;

	var template = '<span class="{class:dropdown}"></span>';
	var entries = [{
		"visible": ~$.inArray("login", this.config.get("buttons")),
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
		"visible": true,
		"title": this.labels.get("logout"),
		"handler": function() {
			auth._publishBackplaneEvent("identity/logout/request");
			auth.user.logout();
		}
	}];

	new Echo.GUI.Dropdown({
		"target": element,
		"title": auth.user.get("name", "") + this.substitute({"template": template}),
		"extraClass": "nav",
		"entries": $.grep(entries, function(entry) {
			return !!entry.visible;
		})
	});
	return element;
};

/**
 * Method to define which template should be used for general rendering procedure.
 *
 * @return {String}
 * Control template.
 */
auth.methods.template = function() {
	return this.templates[this.user.is("logged") ? "logged" : "anonymous"];
};

auth.methods._detectAuthProvider = function() {
	var id = this.user.get("identityUrl", "");
	var domain = Echo.Utils.parseURL(id).domain;
	return this.config.get("providers")[domain] || domain || id;
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
	'.{class:name} .{class:dropdown} { background: url("{%= baseURLs.prod %}/sdk-derived/images/marker.png") no-repeat right center; padding-right: 20px; }' +
	'.{class:name} ul.nav .dropdown .dropdown-toggle { font-size: 20px; }' +
	'.{class:name} ul.nav { margin-bottom: 3px; }' +
	'.{class:name} ul.nav .dropdown-menu li > a { font-size: 14px; }' +
	'.{class:login}, .{plugin.class} .{class:signup} { color: #006DCC; }' +
	'.{class:userAnonymous} { text-align: left; }' +
	'.{class:name} { float: none; margin: 3px 0px 0px 15px; font-weight: normal; }' +
	'.{class:avatarContainer} { float: left; width: 48px; height: 48px; border-radius: 50%; }' +
	'.{class:avatar} { width: 48px; height: 48px; display: inline-block; }';

Echo.Control.create(auth);

})(Echo.jQuery);
