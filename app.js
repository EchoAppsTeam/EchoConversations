(function($) {
"use strict";

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversations = Echo.App.manifest("Echo.Apps.Conversations");

conversations.config = {
	"auth":{
		"allowAnonymousSubmission": false
	},
	"dependencies": {
		"Janrain": {"appId": undefined},
		"StreamServer": {"appkey": undefined}
	},
	"conversationID": "",
	"generalCollectionQuery": "",
	"itemStates": "Untouched,ModeratorApproved",
	"liveUpdates": {
		"transport": "websockets"
	}
};

conversations.config.normalizer = {
	"conversationID": function(value) {
		return value
			|| $("link[rel='canonical']").attr('href')
			|| document.location.href.split("#")[0];
	}
};

conversations.dependencies = [{
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js",
	"control": "Echo.StreamServer.Controls.Stream"
}];

conversations.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:submit}"></div>' +
		'<div class="{class:stream}"></div>' +
	'</div>';

conversations.renderers.submit = function(element) {
	var targetURL = this.config.get("conversationID");
	var submitPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "stream",
		"component": "Echo.StreamServer.Controls.Submit",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"targetURL": targetURL,
			"infoMessages": {"enabled": false},
			"liveUpdates": this.config.get("liveUpdates"),
			"plugins": [{
				"name": "JanrainAuth",
				"appId": this.config.get("dependencies.Janrain.appId"),
				"submitPermissions": submitPermissions,
				"buttons": ["login", "signup"],
				"nestedPlugins": [{
					"name": "CardUIShim",
					"submitPermissions": submitPermissions
				}]
			}, {
				"name": "CardUIShim",
				"submitPermissions": submitPermissions
			}],
			"data": {
				"object": {
					"content": Echo.Utils.get(Echo.Variables, targetURL, "")
				}
			},
			"ready": function() {
				this.view.get("text").on("change", function() {
					Echo.Utils.set(Echo.Variables, targetURL, $(this).val());
				});
			}
		}
	});
};

conversations.renderers.stream = function(element) {
	var replyPermissions = this._getSubmitPermissions();
	this.initComponent({
		"id": "Stream",
		"component": "Echo.StreamServer.Controls.Stream",
		"config": {
			"appkey": this.config.get("dependencies.StreamServer.appkey"),
			"target": element,
			"query": this._buildSearchQuery(),
			"item": {
				"reTag": false
			},
			"plugins": [{
				"name": "CardUIShim"
			}, {
				"name": "LikeCardUI"
			}, {
				"name": "ReplyCardUI",
				"nestedPlugins": [{
					"name": "JanrainAuth",
					"appId": this.config.get("dependencies.Janrain.appId"),
					"submitPermissions": replyPermissions,
					"buttons": ["login", "signup"],
					"nestedPlugins": [{
						"name": "CardUIShim",
						"submitPermissions": replyPermissions
					}]
				}, {
					"name": "CardUIShim",
					"submitPermissions": replyPermissions
				}]
			}, {
				"name": "ModerationCardUI"
			}]
		}
	});
};

conversations.methods._getSubmitPermissions = function() {
	return this.config.get("auth.allowAnonymousSubmission") ? "allowGuest" : "forceLogin";
};

conversations.methods._buildSearchQuery = function() {
	var states = "state:" + this.config.get("itemStates");
	var generalCollectionQuery = this.config.get("generalCollectionQuery")
		|| "childrenof:{data:conversationID}" +
			" type:comment " + states +
			" children:2 " + states;

	return this.substitute({
		"template": generalCollectionQuery,
		"data": {
			"conversationID": this.config.get("conversationID")
		}
	});
};

conversations.css =
	// set box-sizing property for all nested elements to default (content-box) as its can be overwritten on the page.
	'.{class:container} * { box-sizing: content-box; -moz-box-sizing: content-box; }';

Echo.App.create(conversations);

})(Echo.jQuery);
