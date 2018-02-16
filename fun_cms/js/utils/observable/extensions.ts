/**
 * Centralized place to add methods & operators on observable
 *
 * There are several options to consume RxJS operators & methods:
 *
 * - include the whole Kitchen Sink
 *   => this is unacceptable as it would increase payload size too much
 *
 * - use the bind operator [0]
 *   => we did not choose this as it's still an early stage proposal and requires additional babel transpilation
 *
 * - use pipable operators [1]
 *   => we did not choose this approach as it only works on operators but not on methods (those located
 *      in the "observable" subfolder)
 *
 * - use the side-effect based "add" imports [0]
 *   => although it's not the cleanest approach it's the best compromise in terms of consistency, payload size
 *      and build simplicity.
 *
 * [0]: https://github.com/ReactiveX/rxjs#es6-via-npm
 * [1]: https://github.com/ReactiveX/rxjs/blob/master/doc/pipeable-operators.md
 */

import { Observable } from 'rxjs/Observable';
