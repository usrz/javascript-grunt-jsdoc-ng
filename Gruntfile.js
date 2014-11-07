module.exports = function(grunt) {
  grunt.initConfig({

    /* Wrap NG templates */
    'ngtemplates': {
      'default': {
        'src': 'src/templates/**.html',
        'dest': 'build/jsdocng-templates.js',
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
        src: ['src/jsdocng.js', 'build/jsdocng-templates.js'],
        dest: 'dist/jsdocng.min.js',
        'options': { 'wrap': true }
      }
    },

    /* Lessify task */
    'less': {
      'defaut': {
        src: 'src/jsdocng.less',
        dest: 'dist/jsdocng.min.css',
        options: { compress: true }
      }
    }

  });

  /* Load our plugins */
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');

  /* Default task: requirejs then uglify */
  grunt.registerTask('default', ['ngtemplates', 'uglify', 'less']);

};
