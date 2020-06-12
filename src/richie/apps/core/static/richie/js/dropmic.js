/*!
 * Dropdown component originally based from "Dropmic.js v0.3.3"
 *
 * Modified for cleaner classnames.
 *
 * Original credits:
 *     https://github.com/agence-webup/dropmic
 *     (c) 2016-2020 Agence Webup
 *     Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Dropmic = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var Dropmic =
  /*#__PURE__*/
  function () {
    function Dropmic(target, options) {
      _classCallCheck(this, Dropmic);

      this.target = target;
      this.btn = target.querySelector('[data-dropmic-btn]');
      this.container = null;
      this.showClass = "dropmic--show";
      this.defaults = _defineProperty({
        onOpen: null,
        onClose: null,
        beforeClose: null
      }, "beforeClose", null);
      this.options = this.extendObject({}, this.defaults, options);
      this.list = null;
      this.legend = null;
      this.initialized = false;
      this.init();
    }

    _createClass(Dropmic, [{
      key: "init",
      value: function init() {
        this._bindEvents();
      }
    }, {
      key: "_findAncestor",
      value: function _findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls)) {
        }

        return el;
      }
    }, {
      key: "_stringToDom",
      value: function _stringToDom(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
      }
    }, {
      key: "_bindEvents",
      value: function _bindEvents() {
        var _this = this;

        // Show menu
        this.btn.addEventListener("click", function (event) {
          event.preventDefault();

          if (!_this.target.classList.contains(_this.showClass)) {
            _this.open();
          } else {
            _this.close();
          }
        }); // Close menu when mouthclick outside menu

        document.addEventListener("click", function (event) {
          if (!(_this._findAncestor(event.target, 'dropmic') === _this.target)) {
            if (_this.target.classList.contains(_this.showClass)) {
              _this.close.call(_this);
            }
          }
        }); // Close menu with escape key

        this.target.addEventListener("keydown", function (event) {
          if (event.keyCode === 27) {
            _this.close();

            _this.btn.focus();
          }
        });
        this.target.addEventListener("keydown", function (event) {
          if (_this.target.classList.contains(_this.showClass)) {
            // Tab navigation
            var elementList = _this.target.querySelectorAll(".dropmic-menu__content");

            var elementLast = elementList.length - 1;

            if (event.keyCode === 9 && document.activeElement === elementList[elementLast]) {
              event.preventDefault();
              elementList[0].focus();
            } // Arrow Up/Down navigation


            if (event.keyCode === 38 || event.keyCode === 40) {
              event.preventDefault();

              var currentItemIndex = _this._getCurrentItemIndex(elementList, document.activeElement);

              if (currentItemIndex === undefined) {
                elementList[0].focus();
              } else {
                if (event.keyCode === 38) {
                  elementList[self._getPreviousItemIndex(elementList, currentItemIndex)].focus();
                } else {
                  elementList[self._getNextItemIndex(elementList, currentItemIndex)].focus();
                }
              }
            }
          }
        });
      } // Navigation function

    }, {
      key: "_getCurrentItemIndex",
      value: function _getCurrentItemIndex(list, element) {
        for (var i = 0; i < list.length; i++) {
          if (element === list[i]) {
            return i;
          }
        }

        return undefined;
      }
    }, {
      key: "_getPreviousItemIndex",
      value: function _getPreviousItemIndex(list, currentItemIndex) {
        if (currentItemIndex > 0) {
          return currentItemIndex - 1;
        } else {
          return list.length - 1;
        }
      }
    }, {
      key: "_getNextItemIndex",
      value: function _getNextItemIndex(list, currentItemIndex) {
        if (currentItemIndex === list.length - 1) {
          return 0;
        } else {
          return currentItemIndex + 1;
        }
      }
      /**
      * Constructors
      */
      // Initialize dropdown if you want to generate it with JS

    }, {
      key: "_isInitialized",
      value: function _isInitialized() {
        if (this.initialized === false) {
          this._constructDropdown();

          this.initialized = true;
        }
      } // Construct dropdown struture

    }, {
      key: "_constructDropdown",
      value: function _constructDropdown() {
        this.container = this._stringToDom("<div class=\"dropmic-menu\" aria-hidden=\"true\"></div>");
        this.target.appendChild(this.container);
      } // Construct list if it doesn't exist

    }, {
      key: "_constructList",
      value: function _constructList() {
        if (this.list === null) {
          this.list = this._stringToDom("<ul class=\"dropmic-menu__list\" role=\"menu\"></ul>");
          this.container.appendChild(this.list);
        }

        return this.list;
      } // Construct a list item

    }, {
      key: "_constructItem",
      value: function _constructItem(content) {
        var item = this._stringToDom("<li class=\"dropmic-menu__item\" role=\"menuitem\"></li>");

        item.appendChild(content);
        return item;
      } // Construct legend content

    }, {
      key: "_constructCustom",
      value: function _constructCustom(content) {
        if (this.legend === null) {
          this.legend = this._stringToDom("<div class=\"dropmic-menu__legend\">".concat(content, "</div>"));
          this.container.appendChild(this.legend);
        } else {
          this.legend.innerHTML = content;
        }
      }
      /**
      * Callback methods
      */

    }, {
      key: "_onOpen",
      value: function _onOpen() {
        if (this.options.onOpen) {
          this.options.onOpen();
        }
      }
    }, {
      key: "_onClose",
      value: function _onClose() {
        if (this.options.onClose) {
          this.options.onClose();
        }
      }
    }, {
      key: "_beforeOpen",
      value: function _beforeOpen() {
        if (this.options.beforeOpen) {
          this.options.beforeOpen();
        }
      }
    }, {
      key: "_beforeClose",
      value: function _beforeClose() {
        if (this.options.beforeClose) {
          this.options.beforeClose();
        }
      }
      /**
      * Helpers
      */

    }, {
      key: "extendObject",
      value: function extendObject() {
        for (var i = 1; i < arguments.length; i++) {
          for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
              arguments[0][key] = arguments[i][key];
            }
          }
        }

        return arguments[0];
      }
      /**
      * Public methods to generate menu
      */
      // Add a link

    }, {
      key: "addLink",
      value: function addLink(label, url) {
        this._isInitialized();

        var link = this._stringToDom("<a class=\"dropmic-menu__content\" href=\"".concat(url, "\" tabindex=\"-1\">").concat(label, "</a>"));

        this._constructList().appendChild(this._constructItem(link));
      } // Add a button

    }, {
      key: "addBtn",
      value: function addBtn(label, callback) {
        this._isInitialized();

        if (!(typeof callback === "function")) {
          console.warning('callback is not a function');
          return;
        }

        var btn = this._stringToDom("<button class=\"dropmic-menu__content\" tabindex=\"-1\"></button>");

        btn.innerHTML = label;

        this._constructList().appendChild(this._constructItem(btn));

        btn.addEventListener('click', function (event) {
          callback(event);
        });
        return btn;
      } // Add only a text in a span

    }, {
      key: "addLabel",
      value: function addLabel(text) {
        this._isInitialized();

        var label = this._stringToDom("<span class=\"dropmic-menu__content\">".concat(text, "</span>"));

        this._constructList().appendChild(this._constructItem(label));
      } // Add legend content (not in list), just have fun

    }, {
      key: "setCustomContent",
      value: function setCustomContent(content) {
        this._isInitialized();

        this._constructCustom(content);
      } // Update target button content

    }, {
      key: "updateTargetBtn",
      value: function updateTargetBtn(content) {
        this.btn.innerHTML = content;
      } // Open dropdown

    }, {
      key: "open",
      value: function open() {
        this._beforeOpen();

        this.target.classList.add(this.showClass);
        this.target.querySelector("[aria-hidden]").setAttribute("aria-hidden", "false");
        var listItems = this.target.querySelectorAll(".dropmic-menu__content");
        [].forEach.call(listItems, function (el) {
          el.setAttribute("tabindex", "0");
        });

        this._onOpen();
      } // Close dropdown

    }, {
      key: "close",
      value: function close() {
        this._beforeClose();

        this.target.classList.remove(this.showClass);
        this.target.querySelector("[aria-hidden]").setAttribute("aria-hidden", "true");
        var listItems = this.target.querySelectorAll(".dropmic-menu__content");
        [].forEach.call(listItems, function (el) {
          el.setAttribute("tabindex", "-1");
        });

        this._onClose();
      }
    }]);

    return Dropmic;
  }();

  return Dropmic;

})));
