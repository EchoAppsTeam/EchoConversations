module.exports = {
	options: {
		tasks: {
			dev: [
				'copy:third-party',
				'wrap',
				'copy:js',
				'concat',
				'clean:plugins'
			],
			min: [
				'copy:third-party',
				'wrap',
				'copy:js',
				'uglify',
				'concat',
				'clean:plugins'
			],
			'final': [
				'copy:demo',
				'copy:images',
				'copy:manifest'
			]
		}
	}
};
