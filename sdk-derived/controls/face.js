(function(jQuery) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Face
 * Echo Face control displays single user (actor). 
 *
 * @extends Echo.Control
 *
 * @package streamserver/controls.pack.js
 * @package streamserver.pack.js
 *
 * @constructor
 * Face constructor initializing Echo.StreamServer.Controls.Face class
 *
 * @param {Object} config
 * Configuration options
 */
var face = Echo.Control.manifest("Echo.StreamServer.Controls.Face");

if (Echo.Control.isDefined(face)) return;

/** @hide @cfg appkey */
/** @hide @cfg plugins */
/** @hide @cfg submissionProxyURL */
/** @hide @method checkAppKey */
/** @hide @method placeImage */
/** @hide @method dependent */
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
 * @echo_event Echo.StreamServer.Controls.Face.onReady
 * Triggered when the app initialization is finished completely.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Face.onRefresh
 * Triggered when the app is refreshed. For example after the user
 * login/logout action or as a result of the "refresh" function call.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Face.onRender
 * Triggered when the app is rendered.
 */
/**
 * @echo_event Echo.StreamServer.Controls.Face.onRerender
 * Triggered when the app is rerendered.
 */
face.events = {
	"Echo.UserSession.onInvalidate": {
		"context": "global",
		"handler": function() {
			this.view.render({"name": "title"});
		}
	}
};

face.config = {
	/**
	 * @cfg {String} infoMessages
	 * Customizes the look and feel of info messages, for example "loading" and "error".
	 */
	"infoMessages": {
		"enabled": false
	}
};

face.labels = {
	/**
	 * @echo_label
	 */
	"you": "You"
};

/**
 * @echo_template
 */
face.templates.main =
	'<span class="{class:container}">' +
		'<span class="{class:avatar}"></span>' +
		'<span class="{class:title}">{data:title}</span>' +
	'</span>';

/**
 * @echo_renderer
 */
face.renderers.avatar = function(element) {
	if (this.config.get("avatar")) {
		this.placeImage({
			"container": element,
			"image": this.get("data.avatar"),
			"defaultImage": this.config.get("defaultAvatar")
		});
		if (!this.config.get("text")) {
			element.attr("title", this.get("data.title"));
		}
	} else {
		element.hide();
	}
	return element;
};

/**
 * @echo_renderer
 */
face.renderers.title = function(element) {
	if (this.config.get("text")) {
		element.empty().append(this.isYou() ? this.labels.get("you") : this.get("data.title"));
	} else {
		element.hide();
	}
	return element;
};

/**
 * Function to check if the item was posted by the current user.
 *
 * @return {Boolean}
 */
face.methods.isYou = function() {
	var id = this.get("data.id");
	return id && id === this.user.get("identityUrl");
};

face.css =
	'.{class:container} .{class:avatar} { display: inline-block; border-radius: 50%; width: 22px; height: 22px; margin: 0px 3px 0px 0px; vertical-align: text-top; }' +
	'.{class:container} .{class:avatar} img { border-radius: 50%; width: 22px; height: 22px; }' +
	'.{class:only-avatars} .{class:avatar} { margin: 0px 2px; }' +
	'.{class:container}, .{class:container} span { white-space: nowrap; display: inline-block; }' +
	'.{class:only-avatars} .{class:container} { white-space: normal; }';

Echo.Control.create(face);

})(Echo.jQuery);
