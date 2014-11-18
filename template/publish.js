var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var fs = require('jsdoc/fs');

/* Minification */
function minify(html) {
  return html;
}

function renderLinks(helper, doclet) {
  if (doclet.description) {
    doclet.description = minify(helper.resolveLinks(doclet.description));
  }
  if (doclet.classdesc) {
    doclet.classdesc = minify(helper.resolveLinks(doclet.classdesc));
  }
  if (doclet.summary) {
    doclet.summary = minify(helper.resolveLinks(doclet.summary));
  }
  if (doclet.examples) {
    for (var i in doclet.examples) { // not minified!
      doclet.examples[i] = helper.resolveLinks(doclet.examples[i]);
    }
  }
  if (doclet.returns) {
    for (var i in doclet.returns) {
      renderLinks(helper, doclet.returns[i]);
    }
  }
  if (doclet.params) {
    for (var i in doclet.params) {
      renderLinks(helper, doclet.params[i]);
    }
  }
  if (doclet.exceptions) {
    for (var i in doclet.exceptions) {
      renderLinks(helper, doclet.exceptions[i]);
    }
  }
  return doclet;
}

function createLink(helper, doclet, data) {
  if (doclet.kind == 'class')     return(doclet.longname);
  if (doclet.kind == 'module')    return(doclet.longname);
  if (doclet.kind == 'namespace') return(doclet.longname);

  if (doclet.scope == 'global') return("#" + doclet.name);

  var parents = helper.find(data, {longname: doclet.memberof});
  if (parents.length == 0) {
    return "#" + doclet.name;
  } else {
    var link = createLink(helper, parents[0], data);
    return link + "#" + doclet.name;
  }
}

exports.publish = function(taffyData, opts, tutorials) {

  /* Break line after "Generating output files..." */
  logger.printInfo("\n");

  /* Minify/uglify? (default: yes!) */
  var doMinify = true;
  if (env.conf.templates.minify != null) {
    doMinify = env.conf.templates.minify;
  }

  /* Override the HTML minifier above */
  if (doMinify) {
    logger.info("Output minification enabled");
    var minifier = require('html-minifier');
    minify = function(html) {
      return minifier.minify(html, {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        preserveLineBreaks: false,
        collapseBooleanAttributes: true
      });
    }
  } else {
    logger.info("Output minification disabled");
  }

  /* Process all our doclets */
  var data = helper.prune(taffyData);
  helper.addEventListeners(data);
  helper.setTutorials(tutorials);

  data().each(function(doclet) {
    helper.registerLink(doclet.longname, "#!/" + createLink(helper, doclet, data));
  });

  var doccos = [];
  data().each(function(doclet) {
    if (! doclet.name) return;
    if (doclet.kind == 'file') return;

    var current = renderLinks(helper, JSON.parse(JSON.stringify(doclet)));
    var id = current.___id;
    delete current.comment;
    delete current.meta;
    delete current.___id;
    delete current.___s;

    current.$href = createLink(helper, doclet, taffyData);
    current.$id = id;

    doccos.push(current);
  });

  /* Non-minified angular script */
  var script = "(function() {"
             + "angular.module('jsDocNG-Data', [])"
             + ".constant('$title',   " + (env.conf.templates.windowTitle ? JSON.stringify(env.conf.templates.windowTitle) : "'API documentation'") + ')'
             + ".constant('$readme',  " + (opts.readme ? JSON.stringify(opts.readme) : "''") + ')'
             + ".constant('$doclets', " + JSON.stringify(doccos, null, 2) + ');'
             + "})();"

  if (doMinify) {
    logger.info("Minifying JavaScript output");
    var uglifier = require('uglify-js');
    script = uglifier.minify(script, {fromString: true}).code;
  }

  /* Paths here and there */
  var outdir = opts.destination;
  var srcdir = path.join(opts.template, '..');
  var fontdir = path.join(outdir, 'fonts');
  var libsdir = path.join(outdir, 'libs');

  /* Create all our directories */
  fs.mkPath(outdir);
  fs.mkPath(libsdir);
  fs.mkPath(fontdir);

  /* Read in our "index.pub.html", and replace our title */
  var index = fs.readFileSync(path.join(srcdir, 'src', 'index.pub.html'), 'utf8');
  if (env.conf.templates.windowTitle) {
    index = index.replace("<title>API Documentation</title>",
                          "<title>" + env.conf.templates.windowTitle + "</title>");
  }

  /* Minify the index */
  index = minify(index);

  /* Write index and doclet data */
  logger.printInfo("Writing output files...");

  fs.writeFileSync(path.join(outdir, 'index.html'), index, 'utf8');
  fs.writeFileSync(path.join(outdir, 'jsdoc-ng.data.js'), script, 'utf8');

  /* Copy minified JS and CSS */
  fs.copyFileSync(path.join(srcdir, 'dist', 'jsdoc-ng.min.js'), outdir);
  fs.copyFileSync(path.join(srcdir, 'dist', 'jsdoc-ng.min.css'), outdir);

  /* Copy libraries and fonts */
  fs.ls(path.join(srcdir, 'src', 'libs')).forEach(function(file) {
    fs.copyFileSync(file, libsdir);
  });

  fs.ls(path.join(srcdir, 'src', 'fonts')).forEach(function(file) {
    fs.copyFileSync(file, fontdir);
  });

}
