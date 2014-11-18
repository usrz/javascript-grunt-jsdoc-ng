'use strict';

var ngDoc = angular.module('jsDocNG', [ 'jsDocNG-Data', 'jsDocNG-Templates' ])

/* ======================================================================== */
/* CONFIGURATION                                                            */
/* ======================================================================== */

ngDoc.config(['$locationProvider', '$provide', '$doclets', function($locationProvider, $provide, $doclets) {

  /* Configure our location provider */
  $locationProvider.html5Mode(false);
  $locationProvider.hashPrefix("!");

  /* "Index" our doclets by path and longname */
  var byPath = {};
  var byName = {};
  for (var i in $doclets) {
    var doclet = $doclets[i];
    byPath[doclet.$href] = doclet;
    byName[doclet.longname] = doclet;
  }

  /* Create links to the parent */
  for (var i in $doclets) {
    var doclet = $doclets[i];
    var parent = byName[doclet.memberof];
    if (parent != null) doclet.$parent = parent;
  }

  /* Create prefixes for names */
  var findPrefix = function(element) {
    if (!element) return '';
    if (!element.$parent) return '';

    var parent = element.$parent;
    if ((element.kind != 'module') && (parent.kind == 'module')) return '';

    var prefix = findPrefix(parent);
    if (prefix) return prefix + "." + parent.name;
    return parent.name;
  }

  for (var i in $doclets) {
    var doclet = $doclets[i];
    var prefix = findPrefix(doclet);
    if (prefix) doclet.$prefix = prefix;
  }

  /* Provide our doclets by name/path as constants */
  $provide.constant('$docletsByName', byName);
  $provide.constant('$docletsByPath', byPath);
  if (window) window.$$doclets = byName;

}]);

/* ======================================================================== */
/* FILTERS & SERVICES                                                       */
/* ======================================================================== */

ngDoc.filter('html', ['$sce', function($sce) {
  return function(value) {
    if (value == null) return null;
    return $sce.trustAsHtml(value);
  };
}]);

ngDoc.filter('type', ['$sce', '$docletsByName', function($sce, $docletsByName) {

  function sanitize(value) {
    if (!value) return '';
    return value.replace(/&/g,  '&amp;')
                .replace(/\'/g, '&apos;')
                .replace(/\"/g, '&quot;')
                .replace(/</g,  '&lt;')
                .replace(/>/g,  '&gt;');
  }

  function typeFilter(value) {
    /* Basics */
    if (value == null) return null;
    value = value.trim();

    /* Object, array and type */
    var object = /^Object\.<(.*),(.*)>$/.exec(value);
    var array  = /^Array\.<(.*)>$/.exec(value);

    /* Recurse object and array */
    if (object) {
      return "{" + typeFilter(object[1]) + ":&nbsp;"
                 + typeFilter(object[2]) + "}";
    } else if (array) {
      return typeFilter(array[1]) + "[]";
    } else {
      var type = $docletsByName[value];
      if (type) {
        return '<a href="#!/' + type.$href + '">' + sanitize(type.name) + '</a>';
      } else {
        return sanitize(value);
      }
    }
  }

  return function(value) {
    return $sce.trustAsHtml(typeFilter(value));
  };
}]);

ngDoc.factory('$docletsByName', ['$doclets', function($doclets) {

  return function(spec, doclets) {
    if (! doclets) doclets = $doclets;
    var result = $filter('filter')(doclets, spec, true);
    return $filter('orderBy')(result, "longname");
  }
}]);

ngDoc.factory('$filterDoclets', ['$filter', '$doclets', function($filter, $doclets) {
  return function(spec, doclets) {
    if (! doclets) doclets = $doclets;
    var results = $filter('filter')(doclets, spec, true);
    var notypes = $filter('filter')(results, { kind: '!typedef' }, true);
    return $filter('orderBy')(notypes, "longname");
  }
}]);

ngDoc.factory('$findChildren', ['$filterDoclets', function($filterDoclets) {

  function findChildrenByKind(parent, kind, callback) {
    var children = $filterDoclets({ kind: kind, memberof: parent.longname });
    for (var i in children) {
      if (callback) callback(children[i]);
      findChildren(children[i], callback);
    }
  }

  function findChildren(parent, callback) {
    findChildrenByKind(parent, 'class', callback);
    findChildrenByKind(parent, 'namespace', callback);
  }

  return function(members) {
    var result = [];

    for (var i in members) {
      result.push(members[i]);
    }

    for (var i in members) {
      findChildren(members[i], function(child) {
        result.push(child);
      });
    }

    return result;
  }

}]);

/* ======================================================================== */
/* STARTUP                                                                  */
/* ======================================================================== */

ngDoc.run(['$rootScope', '$location', '$docletsByPath', function($rootScope, $location, $docletsByPath) {

  /* Attach a location change handler */
  var currentDoclet = null;
  $rootScope.$on('$locationChangeSuccess', function() {
    /* Our path and hash */
    var path = $location.path();
    var hash = $location.hash();

    /* Remove leading slashes */
    while (path[0] == '/') path = path.substring(1);

    /* New doclet */
    var newDoclet = null;
    if (path && hash) {
      newDoclet = $docletsByPath[path + "#" + hash];
    } else if (path) {
      newDoclet = $docletsByPath[path];
    } else if (hash) {
      newDoclet = $docletsByPath["#" + hash];
    } else {
      newDoclet = null;
    }

    /* Emit event if necessary */
    if (newDoclet != currentDoclet) {
      currentDoclet = newDoclet;
      $rootScope.$broadcast('$docletChanged', newDoclet, currentDoclet);
    }
  });

}]);

/* ======================================================================== */
/* CONTROLLERS                                                              */
/* ======================================================================== */

/*
 * Abstract controller preparing en "elements" entry in the scope,
 * with all doclets matching a given spec grouped by kind
 */
function ModuleController($scope, $filterDoclets, $findChildren, spec) {

  this.reset = function() {
    $scope.elements = null;
  }

  this.apply = function(spec) {
    spec.kind = '!module';
    var elements = $filterDoclets(spec);
    if ($findChildren) elements = $findChildren(elements);
    if (elements.length) {
      var count = 0;
      var grouped = {};
      for (var i in elements) {
        var element = elements[i];
        if (element.kind === 'typedef') continue;

        var kind = grouped[element.kind];
        if (!kind) kind = grouped[element.kind] = [];
        kind.push(element);
        count ++;
      }
      if (count) {
        $scope.elements = grouped;
      } else {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  if (spec) this.apply(spec);
};

/**
 * Controller for all global doclets. Extends ModuleController.
 */
ngDoc.controller('globalsController', ['$scope', '$filterDoclets', '$findChildren', function($scope, $filterDoclets, $findChildren) {
  ModuleController.call(this, $scope, $filterDoclets, $findChildren, { scope: 'global', access: '!protected' });
}]);

/**
 * Controller for a specified module. Extends ModuleController and injects
 * all members of said module.
 */
ngDoc.controller('moduleController', ['$scope', '$attrs', '$filterDoclets', '$findChildren', function($scope, $attrs, $filterDoclets, $findChildren) {
  ModuleController.call(this, $scope, $filterDoclets, $findChildren);

  var $this = this;
  $scope.$parent.$watch($attrs['module'] || 'module', function(module) {
    $scope.module = module;
    if (module) {
      $this.apply({memberof: module.longname, access: '!protected' });
    } else {
      $this.reset();
    }
  });
}]);

/**
 * Main navbar controller: injects "globals" (all global doclets),
 * "modules" (an array of every module doclet), "title" (the title of the
 * API) and "selectedDocletID" (the currently selected doclet).
 */
ngDoc.controller('navbarController', ['$scope', '$title', '$filterDoclets', '$findChildren', function($scope, $title, $filterDoclets, $findChildren) {

  /* The selected doclet is either the class, or the doclet itself */
  $scope.$on('$docletChanged', function(event, doclet) {
    if (doclet) {
      var parent = doclet;
      while (parent && (parent.kind != 'class')) {
        parent = parent.$parent;
      }
      if (parent && (parent.kind == 'class')) {
        $scope.selectedDocletID = parent.$id;
      } else {
        $scope.selectedDocletID = doclet.$id;
      }
    } else {
      $scope.selectedDocletID = null;
    }
  });

  /* Inject a list of all the globals (if we have any) */
  var globals = $filterDoclets({scope: 'global', kind: '!module', access: '!protected'});
  if (globals.length) {
    globals = $findChildren(globals);
    $scope.globals = globals;
  }

  /* Inject a list of all the modules (if we have any) */
  var modules = $filterDoclets({kind: 'module'});
  if (modules.length) $scope.modules = modules;

  /* The documentation title */
  $scope.title = $title;

}]);

/**
 * Controller for the navbar's "expanded" content. Extends ModuleController
 * and inject in the scope all children of whatever doclet we are expanding.
 */
ngDoc.controller('navbarExpandedController', ['$scope', '$attrs', '$filterDoclets', function($scope, $attrs, $filterDoclets) {
  ModuleController.call(this, $scope, $filterDoclets);

  var $this = this;
  $scope.$parent.$watch($attrs['doclet'] || 'doclet', function(doclet) {
    $scope.doclet = doclet;
    if (doclet) {
      $this.apply({memberof: doclet.longname});
    } else {
      $this.reset();
    }
  });
}]);

/* Content */
ngDoc.controller('contentController', ['$scope', '$location', '$title', '$docletsByName', '$filterDoclets', '$findChildren', '$readme',
  function($scope, $location, $title, $docletsByName, $filterDoclets, $findChildren, $readme) {
    ModuleController.call(this, $scope, $filterDoclets, $findChildren);

    /* Always keep our readme around */
    $scope.readme = $readme;

    /* The content doclet/page is either a class, module, globals, or readme */
    var $this = this;
    $scope.$on('$docletChanged', function(event, doclet) {
      if (doclet) {

        if (doclet.kind === 'typedef') {
          var href = doclet.$href;
          while (doclet && doclet.type && doclet.type.names && (doclet.kind === 'typedef')) {
            doclet = $docletsByName[doclet.type.names[0]];
          }
          if (doclet && (doclet.$href != href)) {
            $location.url(doclet.$href);
          } else {
            $scope.template = null;
            $scope.doclet = null;
            $this.reset();
          }
          return;
        }

        var parent = doclet;
        while (parent && (parent.kind != 'class')
                      && (parent.kind != 'module')
                      && (parent.kind != 'namespace')) {
          parent = parent.$parent;
        }

        if (parent && (parent.kind == 'class')) {
          $scope.template = "templates/content-class.html";
          $scope.doclet = parent;
          $this.apply({memberof: parent.longname});
        } else if (parent && (parent.kind == 'module')) {
          $scope.template = "templates/content-module.html";
          $scope.doclet = parent;
          $this.apply({memberof: parent.longname});
        } else if (parent && (parent.kind == 'namespace')) {
          $scope.template = "templates/content-module.html";
          $scope.doclet = parent;
          $this.apply({memberof: parent.longname});
        } else {
          $scope.template = "templates/content-globals.html";
          $scope.doclet = null;
          $this.apply({scope: 'global'});
        }
      } else {
        $scope.template = null;
        $scope.doclet = null;
        $this.reset();
      }
    });
  }]
);

ngDoc.controller('exampleController', ['$scope', '$attrs', function($scope, $attrs) {
  var $this = this;
  $scope.$parent.$watch($attrs['example'] || 'example', function(example) {
    if (example) {

      /* Parse out caption */
      var caption = null;
      var result = /^(.*)\n?/.exec(example);
      if (result) {
        caption = result[1].trim();
        if (caption == '-') caption = null;
        example = example.substring(result[0].length);
      }

      /* Highlighted */
      var language = null;
      try {
        var highlighted = hljs.highlightAuto(example);
        if (highlighted) {
          example = highlighted.value;
          language = highlighted.language;
        }
      } catch (exception) {
        console.warn("Exception parsing example", exception);
      }

      $scope.example = example;
      $scope.caption = caption;
      $scope.language = language;
    } else {
      $scope.example = null;
      $scope.caption = null;
      $scope.language = null;
    }
  });

}]);
