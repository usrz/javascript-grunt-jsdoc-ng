'use strict';

var path = require("path");
var tmp = require('temporary');

/* Current and JSDoc directories */
var baseDir = path.join(__dirname, '..');
var jsDocDir = path.join(baseDir, 'node_modules', 'jsdoc');
var cwDir = process.cwd();

/* Our Grunt plugin */
module.exports = function(grunt) {

  /*
   * Create a custom require method that adds `lib/jsdoc` and `node_modules`
   * to the module lookup path. This makes it possible to `require('jsdoc/foo')`
   * from external templates and plugins, and within JSDoc itself. It also
   * allows external templates and plugins to require JSDoc's module
   * dependencies without installing them locally.
   */
  var requizzle = require('../node_modules/jsdoc/node_modules/requizzle')({
    requirePaths: {
      before: [ path.join(__dirname, '..', 'node_modules', 'jsdoc', 'lib') ],
      after:  [ path.join(__dirname, '..', 'node_modules') ]
    },
    infect: true
  });

  /* ======================================================================== *
   * GRUNT: Register ourselves                                                *
   * ======================================================================== */

  /* Register self */
  grunt.registerMultiTask('jsdoc-ng', 'Create jsDoc Documentation', function() {

    /* Try to read our 'package.json' */
    var windowTitle = null;
    try {
      var npm = grunt.file.readJSON('package.json');
      console.log("NOM DESC", npm.description);
      if (npm && npm.description) {
        windowTitle = npm.description.trim();
        if (npm.version) {
          windowTitle += " (v. " + npm.version.trim() + ")";
        }
      }
    } catch (error) {
      // Just ignore if we can't read this...
    }

    /* Our configurations file, to pass to JSDoc */
    var options = this.options();
    if (options.templates && options.templates.windowTitle) {
      // do something about title here?
    } else if (options.templates) {
      options.templates.windowTitle = windowTitle;
    } else {
      options.templates = { windowTitle: windowTitle };
    }

    var config = new tmp.File();
    config.writeFileSync(JSON.stringify(options, 'utf8'));

    /* Remember our options defaulter */
    var template = this.data.template || null;

    /* We run JSDOC once per every files definition */
    this.files.forEach(function(f) {

      /* Filter out what we need */
      var args = []
      f.src.filter(function(filepath) {
        if (! grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          args.push(filepath);
          return true;
        }
      });

      /* Set up our configuration file */
      args.unshift(config.path);
      args.unshift('--configure');

      /* Set up our destination directory */
      args.unshift(f.dest);
      args.unshift('--destination');

      /* Setup our template */
      if (template == 'default') {
        template = path.join(jsDocDir, "templates", "default");
      } else if (template == 'jsdoc-ng') {
        template = path.join(baseDir, "template");
      }
      if (template) {
        args.unshift(template);
        args.unshift('--template');
      }


      /* ==================================================================== *
       * JSDOC: Environment and runtime initialization                        *
       * ==================================================================== */

      /* Prepare our global "env" */
      var env = global.env = {
        run: {
          start: new Date(),
          finish: null
        },
        args:        args,
        conf:        {}, // jsdoc.conf.json
        dirname:     jsDocDir,
        pwd:         cwDir,
        opts:        {},
        sourceFiles: [],
        version:     {}
      };

      /*
       * NOTE: Do not call "runtime.initialize(...), as it will parse the
       * command line options from Grunt (and we don't want that)
       */
      // var runtime = requizzle('../node_modules/jsdoc/lib/jsdoc/util/runtime');
      // runtime.initialize([jsDocDir, cwDir]);

      /* Then configure our "app" */
      var app = global.app = {
        jsdoc: {
          name:    requizzle('../node_modules/jsdoc/lib/jsdoc/name'),
          scanner: new (requizzle('../node_modules/jsdoc/lib/jsdoc/src/scanner').Scanner)(),
          parser:  null
        }
      };

      /* ==================================================================== *
       * JSDOC: Use Grunt's logger                                            *
       * ==================================================================== */

      var logger = requizzle('../node_modules/jsdoc/lib/jsdoc/util/logger');

      /* Level is determined by Grunt */
      logger.setLevel(1000);

      /* Inject Grunt's logging functions */
      logger.verbose = grunt.verbose.ok;
      logger.debug   = grunt.log.debug;
      logger.info    = grunt.log.ok;
      logger.warn    = grunt.log.error;
      logger.error   = grunt.log.error;
      logger.fatal   = grunt.log.error;

      logger.printVerbose = grunt.verbose.write;
      logger.printDebug   = grunt.log.write; // hmm...
      logger.printInfo    = grunt.log.write;

      /* ==================================================================== *
       * JSDOC: Use the command line helper to run within Grunt               *
       * ==================================================================== */

      var cli = requizzle('../node_modules/jsdoc/cli');

      /* Setup basics */
      cli.setVersionInfo()

      /* Parse command line arguments from "env.args" and load default options. */
      cli.loadConfig();

      /* ==================================================================== *
       * JSDOC: The @ngdoc (and related) tags                                 *
       * ==================================================================== */

      // var dictionary = requizzle('../node_modules/jsdoc/lib/jsdoc/tag/dictionary');
      // dictionary.defineTag('ngdoc', {
        // canHaveName
        // canHaveType
        // mustHaveValue
        // mustNotHaveDescription
        // mustNotHaveValue
      //   onTagged: function(doclet, tag) {
      //       doclet.ngdoc = true;
      //   }
      // });

      /* ==================================================================== *
       * JSDOC: Write the whole documentation tree                            *
       * ==================================================================== */

      /* Log what we're doing */
      grunt.log.subhead("Invoking JsDoc");
      grunt.verbose.ok("JsDoc command-line arguments", env.args);
      grunt.verbose.ok("JsDoc configuration options", env.opts);

      /* Run JSDoc */
      cli.logStart();
      cli.main(function(result) {
        config.unlinkSync();
        cli.logFinish();
        if (result != 0) {
          grunt.fail.fatal("Error in JsDoc", result);
        } else {
          grunt.log.subhead("JsDoc completed");
        }
      });

    }); // END -- this.files.forEach(....)
  });
};
