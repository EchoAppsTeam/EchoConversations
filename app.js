(function(jQuery) {
"use strict";

var $ = jQuery;

if (Echo.App.isDefined("Echo.Apps.Conversations")) return;

var conversation = Echo.App.manifest("Echo.Apps.Conversations");

Echo.App.create(conversation);

})(Echo.jQuery);
