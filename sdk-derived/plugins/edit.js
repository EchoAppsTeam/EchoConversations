(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.Card.Plugins.Edit
 * Adds extra “Edit” button to each item in the Echo Stream control
 * which allows to edit the content and some metadata of the item.
 * This button will appear either for the users with
 * administrative privileges or for editing of personal comments.
 *
 * 	new Echo.StreamServer.Controls.CardCollection({
 * 		"target": document.getElementById("echo-stream"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Edit"
 * 		}]
 * 	});
 *
 * More information regarding the plugins installation can be found
 * in the [“How to initialize Echo components”](#!/guide/how_to_initialize_components-section-initializing-plugins) guide.
 *
 * @extends Echo.Plugin
 *
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Edit", "Echo.StreamServer.Controls.Card");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.component.addButtonSpec("Edit", this._assembleButton());
};

$.map(["Complete", "Error"], function(action) {
	plugin.events["Echo.StreamServer.Controls.CardComposer.Plugins.Edit.onEdit" + action] =
		function(topic, args) {
			this.component.render();
		};
});

plugin.labels = {
	/**
	 * @echo_label
	 * Label for the button in the item
	 */
	"editButton": "Edit"
};

plugin.dependencies = [{
	"control": "Echo.StreamServer.Controls.Submit",
	"url": "{config:cdnBaseURL.sdk}/streamserver.pack.js"
}];

plugin.methods._composerConfig = function(item, target) {
	return this.config.assemble({
		"target": target,
		"data": item.get("data"),
		"targetURL": item.get("data.object.id"),
		"displaySharingOnPost": false
	});
};

plugin.methods._assembleButton = function() {
	var plugin = this;
	return function() {
		var item = this;
		return {
			"name": "Edit",
			"icon": "icon-pencil",
			"label": plugin.labels.get("editButton"),
			"visible": item.user.is("admin") || item.user.has("identity", item.get("data.actor.id")),
			"callback": function() {
				var config = plugin._composerConfig(item, item.view.get("content"));
				config["parent"] = plugin.component.config.getAsHash();
				config["targetQuery"] = plugin.config.get("query", "");
				config.plugins.push({
					"name": "Edit"
				});
				new Echo.StreamServer.Controls.CardComposer(config);
				item.config.get("target").get(0).scrollIntoView(true);
			}
		};
	};
};

Echo.Plugin.create(plugin);

})(Echo.jQuery);

(function(jQuery) {
"use strict";

var $ = jQuery;

/**
 * @class Echo.StreamServer.Controls.CardComposer.Plugins.Edit
 * Adds new mode to the Echo Submit control which allows
 * to edit the content and some metadata of the item.
 *
 * 	new Echo.StreamServer.Controls.CardComposer({
 * 		"target": document.getElementById("echo-composer"),
 * 		"appkey": "echo.jssdk.demo.aboutecho.com",
 * 		"plugins": [{
 * 			"name": "Edit"
 * 		}]
 * 	});
 *
 * @extends Echo.Plugin
 *
 * @private
 * @package streamserver/plugins.pack.js
 * @package streamserver.pack.js
 */
var plugin = Echo.Plugin.manifest("Edit", "Echo.StreamServer.Controls.CardComposer");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("insertAfter", "postButtonWrapper", plugin.templates.cancel);
	this.extendTemplate("insertBefore", "formWrapper", plugin.templates.noneditable);
	this.extendTemplate("replace", "header", plugin.templates.header);
	this.component.labels.set({
		"post": this.labels.get("post"),
		"posting": this.labels.get("posting")
	});
};

plugin.labels = {
	/**
	 * @echo_label
	 */
	"createdBy": "Created by",
	/**
	 * @echo_label
	 */
	"edit": "Edit",
	/**
	 * @echo_label
	 */
	"on": "on",
	/**
	 * @echo_label
	 */
	"post": "Update",
	/**
	 * @echo_label
	 */
	"posting": "Updating...",
	/**
	 * @echo_label
	 */
	"cancel": "cancel",
	/**
	 * @echo_label
	 */
	"cantEditUnknownType": "Unfortunately this item cannot be edited due to its unknown type"
};

/**
 * @echo_event Echo.StreamServer.Controls.CardComposer.Plugins.Edit.onEditInit
 * Triggered when edit operation was started
 */
/**
 * @echo_event Echo.StreamServer.Controls.CardComposer.Plugins.Edit.onEditComplete
 * Triggered when edit operation is finished
 */
/**
 * @echo_event Echo.StreamServer.Controls.CardComposer.Plugins.Edit.onEditError
 * Triggered if edit operation failed
 */
$.map(["Init", "Complete", "Error"], function(action) {
	plugin.events["Echo.StreamServer.Controls.CardComposer.onPost" + action] = function(topic, args) {
		if (action === "Init") {
			$.each(args.postData.content, function(i, data) {
				data.verbs = $.map(data.verbs, function(verb) {
					if (!/\/post$/.test(verb)) return verb;
					// replace "post" activity with "update" one
					return "http://activitystrea.ms/schema/1.0/update";
				});
				// TODO: post tag/marker updates as well
			});
		}
		this.events.publish({
			"data": args,
			"topic": "onEdit" + action
		});
	};
});

/**
 * @echo_template
 */
plugin.templates.header =
	'<div class="echo-primaryFont echo-primaryFont echo-primaryColor {plugin.class:header}">' +
		'<div class="{plugin.class:avatar-wrapper}">' +
			'<div class="{plugin.class:avatar}"></div>' +
		'</div>' +
		'{plugin.label:createdBy} <span class="{plugin.class:author}"></span> ' +
		'{plugin.label:on} <span class="{plugin.class:editedDate}"></span>' +
		'<div class="echo-clear"></div>' +
	'</div>';

/**
 * @echo_template
 */
plugin.templates.cancel =
	'<div class="{plugin.class:cancelButtonContainer}">' +
		'<a href="javascript:void(0);" class="echo-primaryFont echo-clickable echo-linkColor {plugin.class:cancelButton}">' +
			'{plugin.label:cancel}' +
		'</a>' +
	'</div>';

/**
 * @echo_template
 */
plugin.templates.noneditable = '<div class="{class:border} {plugin.class:warning}">{plugin.label:cantEditUnknownType}</div>';


/**
 * @echo_renderer
 */
plugin.component.renderers.container = function(element) {
	this.parentRenderer("container", arguments);
	var _class = this.cssPrefix + "noneditable";
	if (this.component.currentComposer) {
		element.removeClass(_class);
	} else {
		element.addClass(_class);
	}
	return element;
};

/**
 * @echo_renderer
 */
plugin.renderers.avatar = function(element) {
	var component = this.component;
	return Echo.Utils.placeAvatar({
		"target": element,
		"avatar": component.get("data.actor.avatar"),
		"defaultAvatar": component.config.get("defaultAvatar")
	});
};

/**
 * @echo_renderer
 */
plugin.renderers.author = function(element) {
	var component = this.component;
	return element.text(component.get("data.actor.title") || component.labels.get("guest"));
};

/**
 * @echo_renderer
 */
plugin.renderers.editedDate = function(element) {
	var published = this.component.get("data.object.published");
	if (!published) return element.empty();

	var date = new Date(Echo.Utils.timestampFromW3CDTF(published) * 1000);
	return element.text(date.toLocaleDateString() + ', ' + date.toLocaleTimeString());
};

/**
 * @echo_renderer
 */
plugin.renderers.cancelButton = function(element) {
	var plugin = this;
	if (plugin.component.view.get("container").hasClass(this.cssPrefix + "noneditable")) {
		element.addClass("btn");
	} else {
		element.removeClass("btn");
	}
	return element.click(function() {
		plugin.events.publish({"topic": "onEditError"});
	});
};

plugin.methods._prepareContent = function() {
	var composer = this.component;
	var get = function(name){
		return composer.view.get(name).val();
	};
	return [].concat(this._getMetaDataUpdates("tag", "tag", get("tags")),
			 this._getMetaDataUpdates("mark", "marker", get("markers")),
			 this._prepareActivity("update", "comment", get("text")));
};

plugin.methods._prepareActivity = function(verb, type, data) {
	return (!data) ? [] : {
		"object": {
			"objectTypes": ["http://activitystrea.ms/schema/1.0/" + type],
			"content": data
		},
		"source": this.component.config.get("source"),
		"verbs": ["http://activitystrea.ms/schema/1.0/" + verb],
		"targets": [{
			"id": this.component.get("data.object.id")
		}]
	};
};

plugin.methods._getMetaDataUpdates = function(verb, type, data) {
	var plugin = this, component = this.component;
	var extract = function(value) {
		return $.map(value || [], function(item) { return $.trim(item); });
	};
	var items = {
		"modified": extract(data.split(",")),
		"current": extract(component.get("data.object." + type + "s"))
	};
	var updates = [];
	var diff = function(a, b, verb) {
		$.map(a, function(item) {
			if (item && !~$.inArray(item, b)) {
				updates.push(plugin._prepareActivity(verb, type, item));
			}
		});
	};
	diff(items.current, items.modified, "un" + verb);
	diff(items.modified, items.current, verb);
	return updates;
};

plugin.css =
	'.{plugin.class:cancelButtonContainer} { float: right; margin: 6px 15px 0px 0px; }' +
	'.{plugin.class:warning} { display: none; padding: 7px 11px; border-bottom-width: 0px; }' +
	'.{plugin.class:noneditable} .{class:tabs},' +
		'.{plugin.class:noneditable} .{class:formWrapper} > *,' +
		'.{plugin.class:noneditable} .{class:controls} > * { display: none; }' +
	'.{plugin.class:noneditable} .{plugin.class:warning},' +
		'.{plugin.class:noneditable} .{class:controls},' +
		'.{plugin.class:noneditable} .{plugin.class:cancelButtonContainer} { display: block; }' +
	'.{plugin.class:noneditable} .{plugin.class:cancelButtonContainer} { margin: 0px; }' +
	'.{plugin.class:noneditable} .echo-clear { display: inherit; }' +
	'.{plugin.class} .{class:container} { border: none; padding: 0px; }' +
	'.{plugin.class} .{class:nameContainer}, .{plugin.class} .{class:controls}, .{plugin.class} .{class:composers} { background-color: #fff; }' +
	'.{plugin.class:avatar-wrapper} { float: left; margin-right: 5px; }' +
	'.{plugin.class:avatar} { width: 48px; height: 48px; display: inline-block; }' +
	'.{plugin.class:header} { line-height: 48px; margin-bottom: 3px; }' +
	'.echo-streamserver-controls-card-children .{plugin.class:header}, .echo-streamserver-controls-card-childrenByCurrentActorLive .{plugin.class:header} { line-height: 24px; }' +
	'.echo-streamserver-controls-card-children .{plugin.class:avatar}, .echo-streamserver-controls-card-childrenByCurrentActorLive .{plugin.class:avatar} { width: 24px; height: 24px; }' +
	'';

Echo.Plugin.create(plugin);

})(Echo.jQuery);
