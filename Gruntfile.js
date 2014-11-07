module.exports = function(grunt) {
  grunt.initConfig({

    /* Unit testing */
    'karma': {
      'load': {
        configFile: 'karma.load.js',
        runnerPort: 9999,
        singleRun: true,
        browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],
        logLevel: 'ERROR'
      },
      'default': {
        configFile: 'karma.conf.js',
        runnerPort: 9999,
        singleRun: true,
        browsers: ['PhantomJS', 'Chrome', 'Firefox', 'Safari'],
        logLevel: 'ERROR'
      },
    },

    /* Uglify task */
    'uglify': {
      'load': {
        src: 'src/esquire-load.js',
        dest: 'esquire-load.min.js'
      },
      'inject': {
        src: 'src/esquire-inject.js',
        dest: 'esquire-inject.min.js'
      },
      'defaut': {
        src: [ 'src/esquire-inject.js', 'src/esquire-load.js' ],
        dest: 'esquire.min.js'
      }
    },

    /* Documentation task */
    'jsdoc' : {
      'dist' : {
        src: ['src/*.js', 'README.md',
              'node_modules/grunt-jsdoc/node_modules/jsdoc/lib/jsdoc/**/*.js',
              '../ngdocs/footest/**/*.js',
              'node_modules/jaguarjs-jsdoc/demo/sample/**/*.js' ],
        options: {
          destination: 'docs',
          template : 'node_modules/jaguarjs-jsdoc',
          configure : 'jsdoc.conf.json'
        }
      }
    },

    /* Publish GirHub Pages */
    'gh-pages': {
      src: '**/*',
      'options': {
        base: 'docs'
      }
    }

  });

  /* Load our plugins */
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-gh-pages');

  /* Default task: requirejs then uglify */
  grunt.registerTask('default', ['karma',   'uglify'  ]);
  grunt.registerTask('docs',    ['jsdoc',   'gh-pages']);

};
