/**
 * This is FooTest!
 *
 * @ngdoc Foo
 * @constructor
 * @classdesc A long winded description of the FooTest class!
 * @summary Short summary...
 */
function FooTest() {
  /**
   * A simple property...
   */
  this.baz = "foo";

  /**
   * An Inner class?
   *
   * @class
   */
  function BarEst() {
    //...
    /** Some stuff */
    this.stuff = function(bar) {
      return bar;
    }

    /**
     * An Inner-inner class?
     *
     * @class
     */
    function BazWest() {
      //...
      /** More stuff */
      this.moreStuff = function(bar) {
        return bar;
      }
    }


  }
}

/**
 * Some Static stuff
 */
FooTest.gonzo = "gonzo"

(function(xyz) {
  /**
   * @class
   * @name NestedInXYZ
   */
  function NestedInXYZ() {}
})(xyz);

/**
 * Bingo child namespace
 * @namespace childns
 * @memberof namespace
 */
namespace.childns = {};

/**
 * Gonzo child-of-a-child namespace
 * @namespace grandchildns
 * @memberof namespace.childns
 */
namespace.childns.grandchildns = {};

