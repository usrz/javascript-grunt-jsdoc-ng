module.exports = function(grunt) {

  grunt.initConfig({

    /* Wrap NG templates */
    'ngtemplates': {
      'default': {
        'src': 'src/templates/**.html',
        'dest': 'dist/jsdoc-ng-templates.js',
        'options': {
          'module': 'jsDocNG-Templates',
          'bootstrap': function(module, script) {
            return "angular.module('" + module + "', [])"
                 + ".run(['$templateCache', function($templateCache) {"
                 + script + "}]);"
          },
          'url': function(url) { return url.substring(4); },
          'htmlmin': {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true,
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          }
        }
      }
    },

    /* Uglify task */
    'uglify': {
      'defaut': {
        src: ['src/jsdoc-ng.js', 'dist/jsdoc-ng-templates.js'],
        dest: 'dist/jsdoc-ng.min.js',
        'options': { 'wrap': true }
      }
    },

    /* Lessify task */
    'less': {
      'defaut': {
        src: 'src/jsdoc-ng.less',
        dest: 'dist/jsdoc-ng.min.css',
        options: { compress: true }
      }
    },

    /* Sample doccos */
    'jsdoc-ng' : {
      'dist' : {
        template: 'jsdoc-ng',
        dest: 'samples-output',
        src: ['README.md',
              'samples/*.js',
              'node_modules/esquire/src/**/*.js',
              'node_modules/usrz-promize/src/**/*.js',
              'node_modules/grunt-jsdoc/node_modules/jsdoc/lib/jsdoc/**/*.js'],
        options: {
          "plugins": ["plugins/markdown"],
          "templates": {
            "cleverLinks":    true,
            "monospaceLinks": true,
            "windowTitle": "jsDocNG Sample",
            "minify": false
          },
          "markdown": {
            "parser": "gfm",
            "hardwrap": true
          }
        }
      }
    }

  });

  /* Register ourself (sans NPN) */
  grunt.loadTasks("./tasks");

  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  /* Default task: requirejs then uglify */
  grunt.registerTask('default', ['ngtemplates', 'uglify', 'less']);
  grunt.registerTask('samples', ['default', 'jsdoc-ng']);

};
