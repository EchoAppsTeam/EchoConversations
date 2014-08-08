module.exports = {
	dashboard: {
		src: [
			'<%= dirs.build %>/dashboard.js',
			'<%= dirs.build %>/dashboard/*.js'
		]
	},
	'streamserver.pack': {
		src: [
			'<%= dirs.build %>/sdk-derived/url-resolver.js',
			'<%= dirs.build %>/sdk-derived/utils.js',
			'<%= dirs.build %>/sdk-derived/controls/*.js',
			'<%= dirs.build %>/sdk-derived/plugins/**/*.js'
		],
		dest: '<%= dirs.build %>/streamserver.pack.js'
	},
	app: {
		src: [
			'<%= dirs.build %>/app.js',
			'<%= dirs.build %>/plugins/*.js'
		]
	}
};
