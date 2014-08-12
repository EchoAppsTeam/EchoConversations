module.exports = {
	options: {
		header: [
			'(function(jQuery) {',
			'var $ = jQuery;',
			''
		],
		footer: [
			'})(Echo.jQuery);'
		]
	},
	'third-party': {
		files: [{
			expand: true,
			cwd: '<%= dirs.build %>',
			src: ['third-party/*']
		}]
	}
};
