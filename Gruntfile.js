'use strict';

module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt, {
        pattern: 'grunt-*',
        config: 'package.json',
        scope: 'devDependencies'
    });

    var versionNumber = grunt.file.readJSON('package.json').version;

    var banner = '\'use strict\';\n\n';

    banner += '// Last time updated: <%= grunt.template.today("UTC:yyyy-mm-dd h:MM:ss TT Z") %>\n\n';

    banner += '// _________________________\n';
    banner += '// RTCMultiConnection v' + versionNumber + '\n\n';

    banner += '// Open-Sourced: https://github.com/muaz-khan/RTCMultiConnection\n\n';

    banner += '// --------------------------------------------------\n';
    banner += '// Muaz Khan     - www.MuazKhan.com\n';
    banner += '// MIT License   - www.WebRTC-Experiment.com/licence\n';
    banner += '// --------------------------------------------------\n\n';

    // configure project
    grunt.initConfig({
        // make node configurations available
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                stripBanners: true,
                separator: '\n',
                banner: banner
            },
            dist: {
                src: [
                    'src/lib/head.js',
                    'src/lib/amd.js',

                    'src/lib/SocketConnection.js', // You can replace it with: FirebaseConnection.js || PubNubConnection.js
                    'src/lib/MultiPeersHandler.js',

                    // 'src/lib/adapter.js', ---- optional
                    'node_modules/detectrtc/DetectRTC.js', // npm install detectrtc
                    'src/lib/globals.js',

                    'src/lib/ios-hacks.js', // to support ios
                    'src/lib/RTCPeerConnection.js',
                    'src/lib/CodecsHandler.js', // to force H264 or codecs other than opus

                    'src/lib/OnIceCandidateHandler.js',
                    'src/lib/IceServersHandler.js',

                    'src/lib/getUserMedia.js',
                    'src/lib/StreamsHandler.js',

                    'src/lib/TextSenderReceiver.js',
                    'src/lib/FileProgressBarHandler.js',

                    'src/lib/TranslationHandler.js',

                    'src/lib/RTCMultiConnection.js',
                    'src/lib/tail.js'
                ],
                dest: './temp/RTCMultiConnection.js',
            },
        },
        replace: {
            dist: {
                options: {
                    patterns: [{
                        json: grunt.file.readJSON('config.json')
                    }, {
                        match: 'version',
                        replacement: versionNumber
                    }]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['./temp/RTCMultiConnection.js'],
                    dest: './'
                }]
            }
        },
        clean: ['./temp', 'RTCMultiConnection.js'],
        uglify: {
            options: {
                mangle: false,
                banner: banner
            },
            my_target: {
                files: {
                    'dist/RTCMultiConnection.min.js': ['RTCMultiConnection.js']
                }
            }
        },
        copy: {
            main: {
                options: {
                    flatten: true
                },
                files: {
                    'dist/RTCMultiConnection.js': ['RTCMultiConnection.js']
                },
            },
        },
        jsbeautifier: {
            files: ['RTCMultiConnection.js', 'src/lib/*.js', 'Gruntfile.js', ],
            options: {
                js: {
                    braceStyle: "collapse",
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: " ",
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                },
                html: {
                    braceStyle: "collapse",
                    indentChar: " ",
                    indentScripts: "keep",
                    indentSize: 4,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    unformatted: ["a", "sub", "sup", "b", "i", "u"],
                    wrapLineLength: 0
                },
                css: {
                    indentChar: " ",
                    indentSize: 4
                }
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'v%VERSION%',
                commitFiles: ['package.json', 'bower.json'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: '%VERSION%',
                push: false,
                pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        watch: {
            scripts: {
                files: ['src/lib/*.js'],
                tasks: ['concat', 'replace', 'jsbeautifier', 'uglify', 'copy', 'clean'],
                options: {
                    spawn: false,
                },
            }
        }
    });

    // enable plugins

    // set default tasks to run when grunt is called without parameters
    // http://gruntjs.com/api/grunt.task
    grunt.registerTask('default', ['concat', 'replace', 'jsbeautifier', 'uglify', 'copy', 'clean']);
    grunt.loadNpmTasks('grunt-contrib-watch');
};
