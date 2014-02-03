(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.Card.Plugins.Moderation
 */
var plugin = Echo.Plugin.manifest("Moderation", "Echo.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	var item = this.component;
	this.set("itemStatus", item.get("data.object.status"));
	item.addButtonSpec("Moderation", this._assembleModerateButton());
};

plugin.config = {
	"removePersonalItemsAllowed": false,
	"statusAnimationTimeout": 1000, // milliseconds
	"itemActions": ["approve", "untouch", "spam", "delete"],
	"extraActions": ["topPost", "topContributor"],
	"userActions": ["approveUser", "ban", "permissions"],
	"topMarkers": {
		"item": "Conversations.TopPost",
		"user": "Conversations.TopContributor"
	}
};

plugin.labels = {
	"addTopPostButton": "Add to Top Posts",
	"removeTopPostButton": "Remove from Top Posts",
	"addingTopPost": "Adding to Top Posts",
	"removingTopPost": "Removing from Top Posts",
	"addTopContributorButton": "Add to Top Contributors",
	"removeTopContributorButton": "Remove from Top Contributors",
	"addingTopContributor": "Add to Top Contributors",
	"removingTopContributor": "Removing from Top Contributors",
	"moderateButton": "Moderate",
	"approveButton": "Approve",
	"deleteButton": "Delete",
	"spamButton": "Spam",
	"untouchButton": "Untouch",
	"approveUser": "Approve User",
	"untouchUser": "Return User to Untouched",
	"approvingUser": "Approving User...",
	"untouchingUser": "Returning User to Untouched",
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
	"unbanUser": "Unban User",
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
	"Echo.Card.onRerender": function() {
		var item = this.component;
		if (item.user.is("admin")) {
			var element = item.view.get("container");
			var indicator = item.view.get("indicator");
			var itemStatus = this.get("itemStatus") || "Untouched";
			var newStatus = item.get("data.object.status") || "Untouched";

			if (itemStatus !== newStatus) {
				var transition = "background-color " + this.config.get("statusAnimationTimeout") + "ms linear";
				indicator.css({
					"transition": transition,
					"-o-transition": transition,
					"-ms-transition": transition,
					"-moz-transition": transition,
					"-webkit-transition": transition
				});

				// we should trigger some dom event in order to make transition work:
				// http://stackoverflow.com/questions/12814612/css3-transition-to-highlight-new-elements-created-in-jquery
				element.focus();

				element.addClass(this.cssPrefix + "status-" + newStatus);
				element.removeClass(this.cssPrefix + "status-" + itemStatus);
				this.set("itemStatus", newStatus);
			}
		}
	},
	"Echo.CardCollection.Plugins.Moderation.onUserUpdate": function(topic, args) {
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
		'(<span>{plugin.label:unbanUser}</span>)',
	"unbanned": '<span>{plugin.label:banUser}</span>'
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
		var status = this.get("itemStatus") || "Untouched";
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
	var item = this.component;

	if (
		!item.user.is("admin")
		&& (
			name !== "Delete"
			|| !item.user.has("identity", item.data.actor.id)
			|| !this.config.get("removePersonalItemsAllowed")
		)
	) {
		return false;
	}

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
	// do not display button if item already has new status
	if (item.get("data.object.status") === getStatus(item)) {
		return false;
	}
	return {
		"label": this.labels.get(name.toLowerCase() + "Button"),
		"visible": true,
		"callback": function() {
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
				item.unblock();
				self.requestDataRefresh();
			}, function(response) {
				self._publishCompleteActionEvent({
					"name": name,
					"state": "Error",
					"response": response
				});
				item.unblock();
			});
		}
	};
};

plugin.methods._assembleTopContributorButton = function(name) {
	var self = this, item = this.component;

	var disabled = item.get("depth") ||
		item.get("data.actor.id") === item.user.config.get("fakeIdentityURL");

	if (disabled) {
		return false;
	}

	var marker = this.config.get("topMarkers.user");
	var userMarkers = item.get("data.actor.markers", []);
	var action = ~$.inArray(marker, userMarkers) ? "remove" : "add";

	return {
		"label": this.labels.get(action + name + "Button"),
		"visible": true,
		"callback": function() {
			item.block(self.labels.get(
				(action === "add" ? "adding" : "removing") + name
			));
			var markers = (function() {
				if (action === "add") {
					userMarkers.push(marker);
				} else {
					userMarkers = $.grep(userMarkers, function(_) {
						return _ !== marker;
					});
				}
				return userMarkers.length
					? userMarkers.join(",") : "-";
			})();
			self._sendUserUpdate({
				"field": "markers",
				"value": markers,
				"onData": function(response) {
					self._publishCompleteActionEvent({
						"name": action,
						"state": "Complete",
						"response": response
					});
					self._publishUserUpdateEvent({
						"item": item,
						"field": "markers",
						"value": markers
					});
					item.unblock();
				},
				"onError": function(response) {
					self._publishCompleteActionEvent({
						"name": action,
						"state": "Error",
						"response": response
					});
					item.unblock();
				}
			});
		}
	};
};

plugin.methods._assembleTopPostButton = function(name) {
	var self = this;
	var item = this.component;

	// moderators can add/remove markers for root items only
	if (item.get("depth")) {
		return false;
	}

	var marker = this.config.get("topMarkers.item");
	var itemMarkers = item.get("data.object.markers", []);
	var action = ~$.inArray(marker, itemMarkers) ? "remove" : "add";

	return {
		"label": this.labels.get(action + name + "Button"),
		"visible": true,
		"callback": function() {
			item.block(self.labels.get(
				(action === "add" ? "adding" : "removing") + name
			));
			var activity = {
				"verbs": ["http://activitystrea.ms/schema/1.0/" + (action === "add" ? "mark" : "unmark")],
				"targets": [{"id": item.get("data.object.id")}],
				"object": {
					"content": marker
				}
			};
			self._sendRequest({
				"content": activity,
				"appkey": item.config.get("appkey"),
				"sessionID": item.user.get("sessionID"),
				"target-query": item.config.get("parent.query")
			}, function() {
				// TODO publish some event
				item.unblock();
				self.requestDataRefresh();
			}, function() {
				// TODO publish some event
				item.unblock();
			});
		}
	};
};

plugin.methods._assembleModerateButton = function() {
	var self = this;

	var actions = Echo.Utils.foldl([], ["item", "extra", "user"], function(v, acc) {
		acc = [].concat(acc, self.config.get(v + "Actions"));
		return acc;
	});

	return function() {
		return {
			"name": "Moderate",
			"icon": "icon-ok",
			"visible": this.user.is("admin"),
			"entries": $.map(actions, function(action) {
				var _action = Echo.Utils.capitalize(action);
				var handler = ~$.inArray(action, self.config.get("itemActions"))
					? "_assembleButton"
					: "_assemble" + _action + "Button";
				var button = self[handler](_action);
				return button || undefined;
			})
		};
	};
};

plugin.methods._assembleBanButton = function() {
	var self = this;
	var isBanned = this._isUserBanned();
	var item = this.component;

	if (item.get("data.actor.id") === item.user.config.get("fakeIdentityURL")) {
		return false;
	}

	return {
		"label": this.labels.get(isBanned ? "unbanUser" : "banUser"),
		"visible": true,
		"callback": function() {
			var newState = isBanned ? "Untouched" : "ModeratorBanned";
			var action = isBanned ? "UnBan" : "Ban";
			item.block(self.labels.get("processingAction", {"state": newState}));
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
					item.unblock();
				},
				"onError": function(response) {
					self._publishCompleteActionEvent({
						"name": action,
						"state": "Error",
						"response": response
					});
					item.unblock();
				}
			});
		}
	};
};

// TODO merge this method with '_assembleBanButton'
plugin.methods._assembleApproveUserButton = function() {
	var self = this;
	var item = this.component;

	if (item.get("data.actor.id") === item.user.config.get("fakeIdentityURL")) {
		return false;
	}
	var action = item.get("data.actor.status") === "ModeratorApproved"
		? "untouch"
		: "approve";

	return {
		"label": this.labels.get(action === "approve" ? "approveUser" : "untouchUser" ),
		"visible": true,
		"callback": function() {
				item.block(self.labels.get(action === "approve" ? "approvingUser" : "untouchingUser"));
				var newStatus = action === "approve" ? "ModeratorApproved" : "Untouched";
				self._sendUserUpdate({
					"field": "state",
					"value": newStatus,
					"onData": function(response) {
						self._publishCompleteActionEvent({
							"name": action,
							"state": "Complete",
							"response": response
						});
						self._publishUserUpdateEvent({
							"item": item,
							"field": "state",
							"value": newStatus
						});
						item.unblock();
					},
					"onError": function(response) {
						self._publishCompleteActionEvent({
							"name": action,
							"state": "Error",
							"response": response
						});
						item.unblock();
					}
				});
		}
	};
};

plugin.methods._assemblePermissionsButton = function() {
	var self = this;
	var item = this.component;
	var role = this._getRole();
	var next = this._getNextRole(role);

	if (item.get("data.actor.id") === item.user.config.get("fakeIdentityURL")) {
		return false;
	}

	return {
		"label": this.labels.get((next || "user") + "Button"),
		"visible": true,
		"callback": function() {
			var action = "UserPermissions";
			var roles = next !== ""
				? (item.get("data.actor.roles") || []).concat(next)
				: Echo.Utils.foldl([], item.get("data.actor.roles") || [], function(_role, acc) {
					if ($.inArray(_role, plugin.roles) < 0) acc.push(_role);
				});
				var label = next === "" ? "unset" : "set";
				item.block(self.labels.get(label + "RoleAction", {"role": next || role}));
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
						item.unblock();
					},
					"onError": function(response) {
						self._publishCompleteActionEvent({
							"name": action,
							"state": "Error",
							"response": response
						});
						item.unblock();
					}
				});
		}
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
	// hide switch for now
	'.{plugin.class} .{class:modeSwitch} { width: 0px; height: 0px; }' +

	// Moderate button
	'.echo-sdk-ui ul.{plugin.class:moderateButton} { display: inline-block; margin-bottom: 0px; }' +
	'.echo-sdk-ui .{plugin.class:moderateButton} .dropdown-toggle { color: inherit; }' +

	'.echo-sdk-ui .{plugin.class:moderateButton}.nav > li > a,' +
	'.echo-sdk-ui .{plugin.class:moderateButton}.nav > li > a:hover,' +
	'.echo-sdk-ui .{plugin.class:moderateButton}.nav > li > a:focus' +
	'  { background-color: transparent; }' +

	// item statuses
	'.{plugin.class} .{plugin.class:status-Untouched} .{class:indicator} { background-color: #3498db; }' +
	'.{plugin.class} .{plugin.class:status-ModeratorApproved} .{class:indicator} { background-color: #15c177; }' +
	'.{plugin.class} .{plugin.class:status-ModeratorDeleted} .{class:indicator} { background-color: #bf383a; }' +
	'.{plugin.class} .{plugin.class:status-SystemFlagged} .{class:indicator}, .{plugin.class:status-CommunityFlagged} .{class:indicator}, .{plugin.class:status-ModeratorFlagged} .{class:indicator} { background-color: #ff9e00; }' +

	// actor statuses
	($.map({
		"Untouched": "#3498db",
		"ModeratorApproved": "#15c177",
		"ModeratorBanned": "#bf383a",
		"ModeratorDeleted": "#bf383a"
	}, function(color, status) {
		return [
			'.{plugin.class} .{class:avatar}.{plugin.class:actorStatus-' + status + '} > div { border: 2px solid ' + color + '; width: 20px; height: 20px; }',
			'.{plugin.class} .{class:depth-0} .{class:avatar}.{plugin.class:actorStatus-' + status + '} div { height: 32px; width: 32px; border-radius: 50%;}'
		].join("");
	})).join("");

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function() {
"use strict";

var plugin = Echo.Plugin.manifest("Moderation", "Echo.CardCollection");

plugin.events = {
	"Echo.Card.Plugins.Moderation.onUserUpdate": function(topic, args) {
		this.events.publish({
			"topic": "onUserUpdate",
			"data": args,
			"global": false
		});
	}
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);
