'use strict';

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    
    grunt.initConfig({
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '.tmp',
                            'build/*',
                            '!build/.git*',
                            '!build/README.md'
                        ]
                    }
                ]
            },
            server: '.tmp'
        },
        concat: {
            options: {
                separator: '\r\n',
            },
            dist: {
                src: [
                    'bower_components/jquery/dist/jquery.js',
                    'bower_components/json3/lib/json3.js',
					'src/dataStore.js'
				],
                dest: 'build/h.dataStore.js',
            },
            distRealtime: {
                src: [
                    'bower_components/signalr/jquery.signalR.js',
					'src/realtime.js'
                ],
                dest: 'build/h.dataStore.realtime.js',
            }
        },
        uglify:{
            dist: {
                files: {
                    'build/h.dataStore.min.js': ['build/h.dataStore.js']
                }
            },
            distRealtime: {
                files: {
                    'build/h.dataStore.realtime.min.js': ['build/h.dataStore.realtime.js']
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'src/{,*/}*.js'
            ]
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'concat:dist',
        'concat:distRealtime',
        'uglify:dist',
        'uglify:distRealtime'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'build',
    ]);
};

