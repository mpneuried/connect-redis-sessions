module.exports = (grunt) ->

	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')
		watch:
			base:
				files: ["_src/**/*.coffee"]
				tasks: [ "coffee:base", "includereplace" ]

		coffee:
			base:
				expand: true
				cwd: '_src',
				src: ["**/*.coffee"]
				dest: ''
				ext: '.js'


		includereplace:
			pckg:
				options:
					globals:
						version: "<%= pkg.version %>"

					prefix: "@@"
					suffix: ''

				files:
					"index.js": ["index.js"]
		
		mochacli:
			options:
				require: [ "should" ]
				reporter: "spec"
				bail: ( if process.env.BAIL? then true else false )
				grep: process.env.GREP
				timeout: 3000
				slow: 3

			main:
				src: [ "test/test.js" ]
				options:
					env:
						severity_connect_redis_sessions: "debug"

	# Load npm modules
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	grunt.loadNpmTasks "grunt-mocha-cli"
	grunt.loadNpmTasks "grunt-include-replace"


	# just a hack until this issue has been fixed: https://github.com/yeoman/grunt-regarde/issues/3
	grunt.option('force', not grunt.option('force'))
	
	# ALIAS TASKS
	grunt.registerTask "default", "build"
	grunt.registerTask "test", [ "mochacli:main" ]
	
	# ALIAS SHORTS
	grunt.registerTask "b", "build"
	grunt.registerTask "t", "test"
	grunt.registerTask "w", "watch"
	
	# build the project
	grunt.registerTask "build", [ "coffee:base", "includereplace" ]
