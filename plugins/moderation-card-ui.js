(function(jQuery) {
"use strict";

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.ModerationCardUI
 */
var plugin = Echo.Plugin.manifest("ModerationCardUI", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.addButtonSpec("ModerationCardUI", this._assembleModerationButton());
};

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Plugins.ModerationCardUI.onUserUpdate": function(topic, args) {
		var target = this.component;
		var source = args.item;
		if (target.get("data.actor.id") !== source.data.actor.id) return;
		target.set("data.actor." + (args.field === "state" ? "status" : args.field), args.value);
		target.render();
		return {"stop": ["bubble"]};
	}
};

plugin.labels = {
	"moderateButton": "Moderate",
	"changingStatusToModeratorApproved": "Approving..."
};

plugin.component.renderers.avatar = function(element) {
	var item = this.component;

	if (item.user.is("admin")) {
		var status = item.get("data.actor.status") || "Untouched";
		element.addClass(this.cssPrefix + "actorStatus-" + status);
	}
	return this.parentRenderer("avatar", arguments);
};

plugin.component.renderers.container = function(element) {
	var item = this.component;

	if (item.user.is("admin")) {
		var status = item.get("data.object.status") || "Untouched";
		element.addClass(this.cssPrefix + "status-" + status);
	}
	return this.parentRenderer("container", arguments);
};

plugin.methods._changeItemStatus = function(status) {
	var item = this.component;
	this.set("selected", false);
	item.set("data.object.status", status);
	item.view.render({"name": "buttons"});
	// rerender status recursive
	// since it contains other renderers
	this.view.render({
		"name": "status",
		"recursive": true
	});
};

plugin.methods._sendRequest = function(data, callback, errorCallback) {
	Echo.StreamServer.API.request({
		"endpoint": "submit",
		"secure": this.config.get("useSecureAPI", false, true),
		"submissionProxyURL": this.component.config.get("submissionProxyURL"),
		"onData": callback,
		"onError": errorCallback,
		"data": data
	}).send();
};

plugin.methods._publishCompleteActionEvent = function(args) {
	this.events.publish({
		"topic": "on" + args.name + args.state,
		"data": {
			"item": {
				"data": this.component.get("data"),
				"target": this.component.get("view.content")
			},
			"response": args.response
		}
	});
};

plugin.methods._sendUserUpdate = function(config) {
	var item = this.component;
	Echo.IdentityServer.API.request({
		"endpoint": "update",
		"submissionProxyURL": this.component.config.get("submissionProxyURL"),
		"secure": this.config.get("useSecureAPI", false, true),
		"data": {
			"content": {
				"field": config.field,
				"value": config.value,
				"identityURL": item.get("data.actor.id"),
				"username": item.get("data.actor.title")
			},
			"appkey": item.config.get("appkey"),
			"sessionID": item.user.get("sessionID", ""),
			"target-query": item.config.get("parent.query", "")
		},
		"onData": config.onData,
		"onError": function() {
			item.render();
		}
	}).send();
};

plugin.methods._assembleModerationButton = function() {
	var self = this;

	var callback = function() {
		var item = this;
		item.get("buttons." + plugin.name + ".moderation.element")
			.empty()
			.append(self.labels.get("changingStatusToModeratorApproved"));

		item.block(self.labels.get("changingStatusToModeratorApproved"));
		var activity = {
			"verbs": ["http://activitystrea.ms/schema/1.0/update"],
			"targets": [{"id": item.get("data.object.id")}],
			"actor": {"title": item.get("data.actor.id")},
			"object": {
				"state": "ModeratorApproved"
			}
		};
		self._sendRequest({
			"content": activity,
			"appkey": item.config.get("appkey"),
			"sessionID": item.user.get("sessionID"),
			"target-query": item.config.get("parent.query")
		}, function(response) {
			self._publishCompleteActionEvent({
				"name": "Approve",
				"state": "Complete",
				"response": response
			});
			self._changeItemStatus(status);
			self.requestDataRefresh();
		}, function(response) {
			self._publishCompleteActionEvent({
				"name": "Approve",
				"state": "Error",
				"response": response
			});
			item.unblock();
		});

	};
	return function() {
		var item = this;
		return {
			"name": "moderation",
			"label": self.labels.get("moderateButton"),
			"icon": "{%= baseURL %}/images/moderate.png",
			"visible": item.get("data.object.status") !== "ModeratorApproved" && item.user.is("admin"),
			"callback": callback
		};

	};

};

plugin.css =
		// item statuses
		'.{plugin.class:status-Untouched} { border-left: 10px solid #3498db; }' +
		'.{plugin.class:status-ModeratorApproved} { border-left: 10px solid #15c177; }' +
		'.{plugin.class:status-ModeratorDeleted} { border-left: 10px solid #bf383a; }' +
		'.{plugin.class:status-SystemFlagged}, .{plugin.class:status-CommunityFlagged}, .{plugin.class:status-ModeratorFlagged} { border-left: 10px solid #ff9e00; }' +

		// actor statuses
		'.{plugin.class:actorStatus-Untouched} { border: 2px solid #3498db; }' +
		'.{plugin.class:actorStatus-ModeratorApproved} { border: 2px solid #15c177; }' +
		'.{plugin.class:actorStatus-ModeratorBanned} { border: 2px solid #bf383a; }' +
		'.{plugin.class:actorStatus-ModeratorDeleted} { border: 2px solid #bf383a; }';

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var plugin = Echo.Plugin.manifest("ModerationCardUI", "Echo.StreamServer.Controls.Stream");

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Item.Plugins.ModerationCardUI.onUserUpdate": function(topic, args) {
		this.events.publish({
			"topic": "onUserUpdate",
			"data": args,
			"global": false
		});
		return {"stop": ["bubble"]};
	}
};

Echo.Plugin.create(plugin);
})(Echo.jQuery);
