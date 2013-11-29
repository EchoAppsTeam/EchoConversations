(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Stream.Item.Plugins.ModerationCardUI
 */
var plugin = Echo.Plugin.manifest("ModerationCardUI", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var self = this;
	var item = this.component;
	var actions = this.config.get("itemActions").concat(this.config.get("userActions"));
	this.extendTemplate("insertAfter", "avatar", plugin.templates.status);
	$.each(actions, function(i, action) {
		var buttons = plugin.actionButtons[action];
		if (buttons && $.isArray(buttons)) {
			$.each(buttons, function(j, button) {
				item.addButtonSpec("Moderation", self["_assemble" + Echo.Utils.capitalize(action) + "Button"](button));
			});
		} else {
			item.addButtonSpec("Moderation", self._assembleButton(Echo.Utils.capitalize(action)));
		}
	});

};

plugin.config = {
	"removePersonalItemsAllowed": false,
	"userActions": ["ban", "permissions"],
	"itemActions": ["approve", "spam", "delete"]
};

plugin.labels = {
	"approveButton": "Approve",
	"deleteButton": "Delete",
	"spamButton": "Spam",
	"untouchButton": "Untouch",
	"changingStatusToCommunityFlagged": "Flagging...",
	"changingStatusToModeratorApproved": "Approving...",
	"changingStatusToModeratorDeleted": "Deleting...",
	"changingStatusToUserDeleted": "Deleting...",
	"changingStatusToUntouched": "Untouching...",
	"changingStatusToModeratorFlagged": "Marking as spam...",
	"statusCommunityFlagged": "Flagged by Community",
	"statusModeratorApproved": "Approved by Moderator",
	"statusModeratorDeleted": "Deleted by Moderator",
	"statusUserDeleted": "Deleted by User",
	"statusModeratorFlagged": "Flagged by Moderator",
	"statusSystemFlagged": "Flagged by System",
	"banUser": "Ban User",
	"unbanUser": "Unban",
	"userBanned": "Banned User",
	"processingAction": "Setting up '{state}' user state...",
	"moderatorRole": "Moderator",
	"administratorRole": "Administrator",
	"userButton": "Demote to User",
	"moderatorButton": "Promote to Moderator",
	"administratorButton": "Promote to Admin",
	"setRoleAction": "Setting up '{role}' role...",
	"unsetRoleAction": "Removing '{role}' role...",
	"statusUntouched": "New"
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

plugin.templates.buttonLabels = {
	"banned": '<span class="{plugin.class:button-state} {plugin.class:button-state-banned}">{plugin.label:userBanned}</span>' +
		'(<span class="echo-clickable">{plugin.label:unbanUser}</span>)',
	"unbanned": '<span class="echo-clickable">{plugin.label:banUser}</span>'
};

/**
 * @echo_template
 */
plugin.templates.status =
	'<div class="{plugin.class:status}">' +
		'<div class="{plugin.class:statusIcon}"></div>' +
		'<div class="echo-clear"></div>' +
	'</div>';



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

plugin.statuses = [
	"Untouched",
	"ModeratorApproved",
	"ModeratorDeleted",
	"UserDeleted",
	"CommunityFlagged",
	"ModeratorFlagged",
	"SystemFlagged"
];

plugin.button2status = {
	"Spam": "ModeratorFlagged",
	"Delete": "ModeratorDeleted",
	"Approve": "ModeratorApproved",
	"Untouch": "Untouched"
};

plugin.actionButtons = {
	"ban": ["Ban", "UnBan"],
	"permissions": ["UserPermissions"]
};

plugin.roles = ["", "moderator", "administrator"];


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

plugin.methods._assembleButton = function(name) {
	var self = this;
	var getStatus = function(item) {
		var status = plugin.button2status[name];
		if (!item.user.is("admin") &&
			name === "Delete" &&
			self.config.get("removePersonalItemsAllowed") &&
			item.user.has("identity", item.data.actor.id)
		) {
			status = "UserDeleted";
		}
		return status;
	};
	var callback = function() {
		var item = this;
		var status = getStatus(item);
		item.block(self.labels.get("changingStatusTo" + status));
		var activity = {
			"verbs": ["http://activitystrea.ms/schema/1.0/update"],
			"targets": [{"id": item.get("data.object.id")}],
			"actor": {"title": item.get("data.actor.id")},
			"object": {
				"state": status
			}
		};
		self._sendRequest({
			"content": activity,
			"appkey": item.config.get("appkey"),
			"sessionID": item.user.get("sessionID"),
			"target-query": item.config.get("parent.query")
		}, function(response) {
			self._publishCompleteActionEvent({
				"name": name,
				"state": "Complete",
				"response": response
			});
			self._changeItemStatus(status);
			self.requestDataRefresh();
		}, function(response) {
			self._publishCompleteActionEvent({
				"name": name,
				"state": "Error",
				"response": response
			});
			item.unblock();
		});
	};
	return function() {
		var item = this;
		var status = getStatus(item);
console.log( self.labels.get(name.toLowerCase() + "Button") );
		return {
			"name": name,
			"label": self.labels.get(name.toLowerCase() + "Button"),
			"visible": item.get("data.object.status") !== status &&
					(item.user.is("admin") || status === "UserDeleted"),
			"callback": callback
		};
	};
};

plugin.methods._assembleBanButton = function(action) {
	var self = this;
	var callback = function() {
		var item = this;
		var newState = action === "Ban" ? "ModeratorBanned" : "Untouched";
		item.get("buttons." + plugin.name + "." + action + ".element")
			.empty()
			.append(self.labels.get("processingAction", {"state": newState}));
		self._sendUserUpdate({
			"field": "state",
			"value": newState,
			"onData": function(response) {
				self._publishCompleteActionEvent({
					"name": action,
					"state": "Complete",
					"response": response
				});
				self._publishUserUpdateEvent({
					"item": item,
					"field": "state",
					"value": newState
				});
			},
			"onError": function(response) {
				self._publishCompleteActionEvent({
					"name": action,
					"state": "Error",
					"response": response
				});
			}
		});
	};
	return function() {
		var item = this;
		var isBanned = self._isUserBanned();
		var visible = item.get("data.actor.id") !== item.user.config.get("fakeIdentityURL") &&
			isBanned ^ (action === "Ban");
		return {
			"name": action,
			"label": self.substitute({"template": plugin.templates.buttonLabels[isBanned ? "banned" : "unbanned"]}),
			"visible": visible && item.user.is("admin"),
			"callback": callback,
			"once": true
		};
	};
};

plugin.methods._assemblePermissionsButton = function(action) {
	var self = this;
	var callback = function() {
		var item = this;
		var role = self._getRole();
		var next = self._getNextRole(role);
		var roles = next !== ""
			? (item.get("data.actor.roles") || []).concat(next)
			: Echo.Utils.foldl([], item.get("data.actor.roles") || [], function(_role, acc) {
				if ($.inArray(_role, plugin.roles) < 0) acc.push(_role);
			});
		var label = next === "" ? "unset" : "set";
		item.get("buttons." + plugin.name + "." + action + ".element")
			.empty()
			.append(self.labels.get(label + "RoleAction", {"role": next || role}));
		self._sendUserUpdate({
			"field": "roles",
			"value": roles.length ? roles.join(",") : "-",
			"onData": function(response) {
				self._publishCompleteActionEvent({
					"name": action,
					"state": "Complete",
					"response": response
				});
				self._publishUserUpdateEvent({
					"item": item,
					"field": "roles",
					"value": roles
				});
			},
			"onError": function(response) {
				self._publishCompleteActionEvent({
					"name": action,
					"state": "Error",
					"response": response
				});
			}
		});
	};
	return function() {
		var item = this;
		var role = self._getRole();
		var template = role
			? '<span class="{plugin.class:button-role} {plugin.class:button-role}-{data:role}">{data:label}</span>' +
				'(<span class="echo-clickable">{data:button}</span>)'
			: '<span class="echo-clickable">{data:button}</span>';

		var label = self.substitute({
			"template": template,
			"data": {
				"role": role,
				"label": role ? self.labels.get(role + "Role") : "",
				"button": self.labels.get((self._getNextRole(role) || "user") + "Button")
			}
		});
		return {
			"name": action,
			"label": label,
			"visible": item.get("data.actor.id") !== item.user.config.get("fakeIdentityURL") &&
				item.user.any("roles", ["administrator"]),
			"callback": callback,
			"once": true
		};
	};
};

plugin.methods._publishUserUpdateEvent = function(data) {
	this.events.publish({
		"topic": "onUserUpdate",
		"data": {
			"item": data.item,
			"field": data.field,
			"value": data.value
		},
		"global": false,
		"propagation": false
	});
	this.requestDataRefresh();
};

plugin.methods._isUserBanned = function() {
	return this.component.get("data.actor.status") === "ModeratorBanned";
};

plugin.methods._getRole = function() {
	var result = "";
	$.each(this.component.get("data.actor.roles") || [], function(id, role) {
		if ($.inArray(role, plugin.roles) > 0) {
			result = role;
			if (role === "administrator") {
				return false; // break;
			}
		}
	});
	return result;
};

plugin.methods._getNextRole = function(role) {
	return plugin.roles[($.inArray(role, plugin.roles) + 1) % plugin.roles.length];
};


plugin.css =
		// item statuses
		'.{plugin.class:status-Untouched} { border-left: 7px solid #3498db; }' +
		'.{plugin.class:status-ModeratorApproved} { border-left: 7px solid #15c177; }' +
		'.{plugin.class:status-ModeratorDeleted} { border-left: 7px solid #bf383a; }' +
		'.{plugin.class:status-SystemFlagged}, .{plugin.class:status-CommunityFlagged}, .{plugin.class:status-ModeratorFlagged} { border-left: 7px solid #ff9e00; }' +

		// actor statuses
		($.map({
			"Untouched": "#3498db",
			"ModeratorApproved": "#15c177",
			"ModeratorBanned": "#bf383a",
			"ModeratorDeleted": "#bf383a"
		}, function(color, status) {
			return [
				'.{plugin.class} .{class:avatar}.{plugin.class:actorStatus-' + status + '} > img { border: 2px solid ' + color + '; width: 20px; height: 20px; }',
				'.{plugin.class} .{class:depth-0} .{class:avatar}.{plugin.class:actorStatus-' + status + '} img { height: 32px; width: 32px; border-radius: 50%;}'
			].join("");
		})).join("");

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
