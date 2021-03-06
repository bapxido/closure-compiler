/*
 * Copyright 2016 The Closure Compiler Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.module('jscomp.runtime_tests.polyfill_tests.reflect_construct_test');
goog.setTestOnly();

const testSuite = goog.require('goog.testing.testSuite');
const testing = goog.require('jscomp.runtime_tests.polyfill_tests.testing');
const userAgent = goog.require('goog.userAgent');

const noCheck = testing.noCheck;

testSuite({
  shouldRunTests() {
    // Not polyfilled to ES3
    const isOldIe = !userAgent.IE || userAgent.isVersionOrHigher(9);
    // Also, our Reflect.construct() implementation won't work
    // when we've overridden the native implementation, as the
    // force-polyfill tests do.
    const hasOverriddenNativeReflect =
        $native.Reflect && $native.Reflect != Reflect;
    return !isOldIe && !hasOverriddenNativeReflect;
  },

  testConstruct() {
    const Foo = class {
      constructor(a, b) {
        this.x = 10 * a + b;
      }
      foo() {
        return this.x + 200;
      }
    };
    const Bar = class {
      constructor(a, b) {
        this.x = -1;
        fail('Bar constructor should never run');
      }
      foo() {
        return this.x + 300;
      }
    };

    let obj = Reflect.construct(Foo, [5, 9]);
    assertEquals(59, obj.x);
    assertEquals(259, obj.foo());
    assertTrue(obj instanceof Foo);
    assertFalse(obj instanceof Bar);

    obj = Reflect.construct(Foo, [2, 6], Bar);
    assertEquals(26, obj.x);
    assertEquals(326, obj.foo());
    assertFalse(obj instanceof Foo);
    assertTrue(obj instanceof Bar);
  },

  testConstruct_newTarget() {
    /** @constructor */
    let X = function() { this.target = null; };
    /** @preserveTry */
    try {
      X = noCheck(eval('class { constructor() { this.target = new.target; } ' +
                       'x() { return 42; }}'));
    } catch (err) {
      // NOTE: Do nothing if new.target fails to parse.
      return;
    }

    /** @constructor */
    const Y = function() {
      this.target = -1;
      fail('Y constructor should never run');
    };
    Y.prototype.y = function() { return 23; };

    const x = Reflect.construct(X, [], Y);
    assertEquals(Y, x.target);
    assertEquals(23, x.y());
    assertUndefined(noCheck(x).x);
  },
});
