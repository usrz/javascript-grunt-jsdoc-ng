Grunt JsDoc NG
==============

This is a very simple wrapper to [JSDoc](http://usejsdoc.org/) for [Grunt](http://gruntjs.com/),
without any need to have Java installed.

Installation and usage
----------------------

Use NPM to install this:

```bash
npm install --save-dev grunt-jsdoc-ng
```

Load the task as any other [Grunt](http://gruntjs.com/) plugin:

```javascript
grunt.loadNpmTasks('grunt-jsdoc-ng');
```

And the configure the task normally:

```javascript
'jsdoc-ng' : {
  'mysubtaskname' : {
    src: ['src/*.js', 'README.md' ],
    dest: 'docs',
    template : 'jsdoc-ng',
    options: {
      // ...
    }
  }
}
```

The various configuration options are:

* `src`: The usual list of sources like any other [Grunt](http://gruntjs.com/) task
* `dest`: The destination directory where documents will be written to.
* `template`:
  * Leave empty (or use the keyword `default`) for the standard [JSDoc](http://usejsdoc.org/) template.
  * Use the keyword `jsdoc-ng` for my built-in, [Angular JS](https://angularjs.org/)  based template.
  * Specify any path to a template directory (where `publish.js` resides).
* `options`: Anything recognized by [JSDoc](http://usejsdoc.org/) as a configuration (basically,
  the contents of your `conf.json` as specified [here](http://usejsdoc.org/about-configuring-jsdoc.html).

Embedded template
-----------------

While the [Angular JS](https://angularjs.org/) doesn't expose *all* the functionalities
of [JSDoc](http://usejsdoc.org/), it's __good enough__ (at least for me) for normal usage.

A couple of extra options can be configured in the `templates` section of the configuration:

* `windowTitle`: The nice title for the API to produce.
* `minify`: (*default*: __true__) If __false__ HTML and JavaScript will not be minified.

See [`Gruntfile.js`](Gruntfile.js#L63-64) for an example on of how to use them.

