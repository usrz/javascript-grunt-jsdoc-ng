'use strict';

(function() {

  /* ======================================================================== */
  /* A quick-and-dirty Promise-like ThenAble                                  */
  /* ======================================================================== */

  function ThenAble(onSuccess, onFailure) {
    var status = 0;
    var result = null;
    var chain = [];

    var resolve = function(success) {
      if (status == 0) {
        result = success;
        status = 1;
        if (onSuccess) try {
          result = onSuccess(result);
        } catch (error) {
          result = error;
          status = -1;
        }
        notify(chain);
      }
    }

    var reject = function(failure) {
      if (status == 0) {
        result = failure;
        status = -1;
        if (onFailure) try {
          result = onFailure(result);
          status = 1;
        } catch (error) {
          result = error;
        }
        notify(chain);
      }
    }

    var then = function(onSuccess, onFailure) {
      var chained = new ThenAble(onSuccess, onFailure);
      if (status == 0) {
        chain.push(chained);
      } else {
        notify([chained]);
      }
      return chained.promise;
    }

    var notify = function(chain) {
      var method = status > 0 ? "resolve" :
                   status < 0 ? "reject" :
                   null;
      if (method) for (var i in chain) {
        chain[i][method](result);
      }
    }

    var promise = Object.defineProperties(new Object(), {
      "then":  { enumerable: true, configurable: false, value: then },
      "catch": { enumerable: true, configurable: false, value:
        function(onFailure) {
          return then(null, onFailure);
        }
      }
    });

    return Object.defineProperties(this, {
      "promise": { enumerable: true, configurable: false, value: promise },
      "resolve": { enumerable: true, configurable: false, value: resolve },
      "reject":  { enumerable: true, configurable: false, value: reject  }

    });

  }

  /* ======================================================================== */
  /* Internal variable definitions and functions                              */
  /* ======================================================================== */

  /* Flatten an array, or array of array, for aguments */
  function flatten(iterable) {
    if (! iterable) return [];

    var array = [];
    for (var i = 0; i < iterable.length; i ++) {
      var current = iterable[i];
      if (typeof(current) == 'string') {
        array.push(current);
      } else if (Array.isArray(current)) {
        array = array.concat(flatten(current));
      } else {
        throw new Error("Esquire: Invalid dependency: " + current);
      }
    }
    return array;
  };

  /* ======================================================================== */
  /* Event managemet for script loading                                       */
  /* ======================================================================== */

  /* Loaded scripts are all scripts we already loaded */
  var loadedScripts = {};
  /* Script locations are then-ables for scripts being loaded */
  var scriptPromises = {};

  /* Fetch and remove the promise */
  function fetchDetails(event) {
    var filename = event.filename || event.target && event.target.src;
    if (scriptPromises[filename]) {

      /* Only process this once... */
      if (event.stopPropagation) event.stopPropagation();
      if (event.preventDefault) event.preventDefault();

      /* Try to zap the <script /> element */
      if (event.target && event.target.parentNode) try {
        event.target.parentNode.removeChild(event.target);
      } catch (error) {
        // This might have never slapped in the DOM
      }

      /* Wipe-and-return... */
      var promise = scriptPromises[filename];
      delete scriptPromises[filename];
      promise.remaining -= 1; // decrement!
      return { script: filename, promise: promise };
    }
  }

  function onScriptLoad(event) {
    var details = fetchDetails(event);
    if (details) {
      console.debug("Esquire: Successfully loaded script '", details.script, "'");
      if (details.promise.remaining == 0) {
        details.promise.resolve(Esquire.modules);
      }

    }
  }

  function onScriptError(event) {
    var details = fetchDetails(event);
    if (details) {
      console.warn("Esquire: Unable to load script '", details.script, "'");
      var error = event.error || new Error("Unable to load script '" + details.script + "'");
      details.promise.reject(error);
    }
  }

  /* Global error handlers */
  window.addEventListener('error', onScriptError, true);

  /* ======================================================================== */
  /* Script loader, exposed as a static method on the Esquire class           */
  /* ======================================================================== */

  /* Our document reference */
  var document = window.document;

  /**
   * Load an external script and return a _then-able_ `Promise`.
   *
   * @static
   * @function load
   * @memberof Esquire
   * @example
   * Esquire.load('scriptA.js', 'scriptB.js')
   *   .then(
   *     function(modules) {
   *       // All good: 'modules' will be the same as {@link Esquire.modules}
   *     },
   *     function(failure) {
   *       // Something bad happend: 'failure' will contain the reason.
   *     }
   *   );
   * @param {*} ... The scripts to load (a string or an array thereof).
   */
  function load() {
    if (! document) throw new Error("Esquire: Document not available");

    /* Find our first script and its parent */
    var firstScript = document.getElementsByTagName('script')[0];
    var scriptsParent = firstScript.parentNode;

    /* Our then-able for notifications */
    var thenable = new ThenAble(function(success) {
        return success;
      }, function(failure) {
        throw failure;
      });

    /* Mark the number of remainig scripts on the then-able */
    thenable.remaining = 0;

    /* Create all our script tags */
    var locations = flatten(arguments);
    var scripts = [];
    for (var i in locations) {
      (function(location) {
        /* Create our script tags */
        var script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = location;

        /* Normalize location */
        location = script.src;

        /* Skip loading if we already did, or remember location and the prmise */
        if (loadedScripts[location]) {
          console.debug("Esquire: Script '" + location + "' already loaded");
        } else if (scriptPromises[location]) {
          console.debug("Esquire: Script '" + location + "' already being loaded");
        } else {
          script.addEventListener('load', onScriptLoad, false);
          script.addEventListener('error', onScriptError, false);
          scriptPromises[location] = thenable;

          /* Remember our script and its location */
          thenable.remaining += 1;
          scripts.push(script);

        }

      })(locations[i]);
    }

    /* Load all our script tags */
    if (scripts.length == 0) {
      thenable.resolve(Esquire.modules);
    } else {
      for (var i in scripts) {
        console.debug("Esquire: About to load '" + scripts[i].src + "'");
        scriptsParent.insertBefore(scripts[i], firstScript);
      }
    }

    /* Return a then-able */
    return thenable.promise;
  }

  /* ======================================================================== */
  /* Object definition                                                        */
  /* ======================================================================== */

  /* Placeholder for Esquire */
  if (! window.Esquire) window.Esquire = {};
  window.Esquire.load = load;


})();
