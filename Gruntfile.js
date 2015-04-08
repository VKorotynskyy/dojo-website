/* jshint node: true */
var path = require('path');
var marked = require('marked');

module.exports = function (grunt) {

	// Build config variables
	var config = require('./config.js')(grunt);

	//src folder
	var src = config.src;

	//build destination folder
	var dest = config.dest;

	var guideVer = config.guide.ver;

	// Reads and parses the roadmap json
	var roadmap = require('./tasks/roadmap.js')(grunt);

	// Helper to make it possible to use variables for task 'files' that expect object literals
	var toObj = require('./tasks/helpers.js')(grunt);


	var ejsOptions = {
		dojo: config.dojo,
		url: config.urls,
		rev: Date.now(),
		roadmap: roadmap
	};


	grunt.initConfig({
		// This is a custom task that compiles markdown tutorials
		// in `src` and moves them to `dest`, running each through the
		// specified ejs `template`. Within the template, two variables
		// are made available: `content`, which is the resulting tutorial
		// HTML, and `tutorials`, which is an array all tutorials represented
		// as objects, each with a `filename` and `title` property.
		config: config,

		tutorials: {
			all: {
				options: ejsOptions,
				src: '<%= config.src %>/documentation/tutorials/',
				dest: '<%= config.dest %>/documentation/tutorials/',
				template: '<%= config.src %>/_templates/tutorial.ejs',
				indexTemplate: '<%= config.src %>/documentation/index.ejs',
				indexDest: '<%= config.dest %>/documentation/'
			}
		},

		// Compile the Reference Guide and API docs
		exec: {
			guide: {
				cwd: src +'/documentation/reference-guide',
				cmd: 'sphinx-build -b html -a -c ./ -d '+guideVer+' '+guideVer+' ../../../'+config.dest+'/reference-guide/'+guideVer
			},
			api: {
				cwd: 'tasks/api',
				cmd: 'node build'
			}
		},

		ejs: {
			all: {
				options: ejsOptions,
				cwd: config.src,
				src: ['**/*.ejs', '!_templates/**/*', '!_partials/**/*', '!documentation/**/*.ejs'],
				dest: config.dest,
				expand: true,
				ext: '.html'
			},

			//Docs need to have partials compiled to HTML first
			docs: {
				options: ejsOptions,
				cwd: config.src +'/_partials',
				src: ['header.ejs', 'footer.ejs'],
				dest: config.src +'/_partials/tmp',
				expand: true,
				ext: '.html'
			}
		},

		highlight: {
		    task: {
		      options: {},
		      files: { '<%= config.dest %>/download/index.html':['<%= config.dest %>/download/index.html']}
			}
		},

		stylus: {
			options: {'include css': true, 'compress':true},
			index: {
				files: {
					'<%= config.dest %>/css/index.css': '<%= config.src %>/css/index.styl',
					'<%= config.dest %>/css/api.css': '<%= config.src %>/css/views/api.styl',
					'<%= config.dest %>/css/guide.css': '<%= config.src %>/css/views/guide.styl',
					'<%= config.dest %>/blog/wp-content/themes/dtk/style.css' : '<%= config.src %>/css/views/blog.styl'
				}
			}
		},

		connect: {
			server: {
				options: {
					port: 1337,
					base: dest
				}
			}
		},

		sync: {
			images: {
				files: [{
					cwd: src,
					src: ['images/**', 'css/images/**', 'css/fonts/**'],
					dest: dest,
					expand: true,
				}],
				verbose: true
			},
			scripts: {
				files: [{
					cwd: src,
					src: ['scripts/**', '!scripts/dojo/**/*'],
					dest: dest,
					expand: true,
				}],
				verbose: true
			},
			dojo: {
				files: [{
					cwd: src,
					src: ['scripts/dojo'],
					dest: dest,
					expand: true,
				}],
				verbose: true
			},
			blog: {
				files: [
					{
						cwd: src +'/blog',
						src: ['dtk/**/*'],
						dest: dest + '/blog/wp-content/themes/',
						expand: true,
					},
					{
						cwd: src +'/_partials/tmp',
						src: ['header.html', 'footer.html'],
						dest: '<%= config.dest %>/blog/wp-content/themes/dtk/inc'

					}
				],
				verbose: true
			}
		},

		watch: {
			ejs: {
				files: [src +'/**/*.ejs', '!'+src+'/documentation/**/*'],
				tasks: ['ejs', 'highlight']
			},

			tutorials: {
				files: [src +'/documentation/tutorials/**/*.md', src +'/documentation/index.ejs', '!'+src+'/**/README.md'],
				tasks: ['tutorials']
			},
			blog: {
				files: [src +'/blog/dtk/**/*', src + '/_partials/**/*.ejs'],
				tasks: ['sync:blog']
			},
			stylus: {
				files: [src +'/**/*.styl', '!'+src+'/vendor/**'],
				tasks: ['stylus', 'sync:images']
			},
			js: {
				files: [src +'/scripts/**/*.js', src +'/scripts/*.js', '!'+src+'/scripts/dojo/**', '!'+src+'/scripts/syntaxhighlighter/**'],
				tasks: ['sync:scripts']
			}
		},

		clean: [dest]
	});

	grunt.loadNpmTasks('grunt-ejs');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-sync');
	grunt.loadNpmTasks('grunt-highlight');
	grunt.loadTasks('tasks');

	grunt.registerTask('deploy', ['clean', 'ejs', 'highlight', 'stylus', 'sync', 'tutorials', 'exec']);
	grunt.registerTask('default', ['clean', 'ejs', 'highlight', 'stylus', 'sync', 'tutorials']);
	grunt.registerTask('docs',['ejs:docs', 'exec']);
	grunt.registerTask('develop', ['ejs', 'highlight', 'stylus', 'sync', 'tutorials', 'connect', 'watch']);
};
