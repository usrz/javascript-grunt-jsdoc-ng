var helper = require('jsdoc/util/templateHelper');
var minifier = require('html-minifier');

function minify(html) {
  return minifier.minify(html, {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: false,
    collapseBooleanAttributes: true
  });
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
  if (doclet.params) {
    for (var i in doclet.params) {
      renderLinks(helper, doclet.params[i]);
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

  console.log("(function() {");
  console.log("angular.module('ngDocData', [])");
  console.log(".constant('$title',   ", env.conf.templates.windowTitle ? JSON.stringify(env.conf.templates.windowTitle) : "'API documentation'", ')');
  console.log(".constant('$readme',  ", opts.readme ? JSON.stringify(opts.readme) : "''", ')');
  console.log(".constant('$doclets', ", JSON.stringify(doccos, null, 2), ');');
  console.log("})();");

  }
