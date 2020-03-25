"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactSwipeable = require("react-swipeable");

var _CarouselSlide = _interopRequireDefault(require("./CarouselSlide"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _createSuper(Derived) {
  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  return function () {
    var Super = _getPrototypeOf(Derived),
        result;

    if (isNativeReflectConstruct()) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var defaultState = {
  swiping: 0,
  // swipes by user
  offset: 0,
  // current computed offset to display currentIndex in view
  currentIndex: 0,
  // currently active slide index
  availableSize: null,
  // carousel container size
  autoSliding: false,
  // controls transition-delay
  clones: null,
  // children is converted into clones then displayed as slides
  clonePositions: [],
  // dataset of each clones relative start-position and size
  isLooping: false,
  // controls fadeout
  isDragging: false // when user is interacting; disables transition-delay

};
var defaultSwipeConfig = {
  delta: 30,
  // min distance(px) before a swipe starts
  preventDefaultTouchmoveEvent: true,
  // preventDefault on touchmove,
  trackTouch: true,
  // track touch input
  trackMouse: true,
  // track mouse input
  rotationAngle: 0 // set a rotation angle

};

var Carousel =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Carousel, _React$Component);

  var _super = _createSuper(Carousel);

  function Carousel(props) {
    var _this;

    _classCallCheck(this, Carousel);

    _this = _super.call(this, props);
    _this.state = _objectSpread({
      currentIndex: _this.props.currentIndex || 0
    }, defaultState);
    _this.swipeConfig = Object.assign({}, defaultSwipeConfig, props.swipeConfig);
    _this.carouselRef = null; // carousel element reference

    _this.slideRefs = []; // slide (children) element references

    _this.resizeObserver = null; // event listener on carousel container

    _this.autoSlideSpeed = 300; // ms - this may change, depending isLooping & autoSliding states

    _this.snapTimeout = null; // make shure all parameters from snapping is set before running transitions

    _this.transitionTimeout = null; // to disable transition-duration (css prop) after autoSlideSpeed
    // init/setup functions

    _this.setCarouselRef = _this.setCarouselRef.bind(_assertThisInitialized(_this));
    _this.setSlideRef = _this.setSlideRef.bind(_assertThisInitialized(_this));
    _this.getTransform = _this.getTransform.bind(_assertThisInitialized(_this));
    _this.calculateCarouselOffset = _this.calculateCarouselOffset.bind(_assertThisInitialized(_this)); // main function for updating internal currentIndex state
    // this is used in componentDidUpdate + usage methods

    _this.changeCurrentIndex = _this.changeCurrentIndex.bind(_assertThisInitialized(_this)); // methods for usage

    _this.prev = _this.prev.bind(_assertThisInitialized(_this));
    _this.next = _this.next.bind(_assertThisInitialized(_this));
    _this.handleKeyboard = _this.handleKeyboard.bind(_assertThisInitialized(_this));
    _this.handleSelect = _this.handleSelect.bind(_assertThisInitialized(_this));
    _this.onSwipedLeft = _this.onSwipedLeft.bind(_assertThisInitialized(_this));
    _this.onSwipedRight = _this.onSwipedRight.bind(_assertThisInitialized(_this));
    _this.onSwipeDrag = _this.onSwipeDrag.bind(_assertThisInitialized(_this));
    _this.onSwipeDragDone = _this.onSwipeDragDone.bind(_assertThisInitialized(_this));
    return _this;
  } // LIFESYCLE METHODS


  _createClass(Carousel, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      // start event listener for arrow keys on keyboard?
      var _this$props = this.props,
          keyboard = _this$props.keyboard,
          slidesInView = _this$props.slidesInView,
          vertical = _this$props.vertical,
          infinite = _this$props.infinite,
          swipeMode = _this$props.swipeMode;

      if (keyboard) {
        document.addEventListener("keydown", this.handleKeyboard);
      } // Add resizeObserver and recalculate slide sizes if slidesInView != auto


      if (window.ResizeObserver) {
        this.resizeObserver = new window.ResizeObserver(function (entries, observer) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = entries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var entry = _step.value;
              var size = vertical ? entry.contentRect.height : entry.contentRect.width;

              if (size != _this2.availableSize) {
                _this2.availableSize = size;

                _this2.computeClonePositions();

                if (!infinite && swipeMode == "step") {
                  // in this mode this.getTransform needs state.offset instead of state.currentIndex
                  _this2.setState({
                    offset: _this2.calculateCarouselOffset(_this2.state.currentIndex)
                  });
                }
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        });
        this.resizeObserver.observe(this.carouselRef);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      // kill timeouts, eventlisteners and observers
      clearTimeout(this.snapTimeout);
      clearTimeout(this.transitionTimeout);
      var keyboard = this.props.keyboard;

      if (keyboard) {
        document.removeEventListener("keydown", this.handleKeyboard);
      }

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState) {
      var _this$props2 = this.props,
          onChangeIndex = _this$props2.onChangeIndex,
          children = _this$props2.children;
      var clones = this.state.clones;
      var oldKeys = JSON.stringify(prevProps.children.map(function (child) {
        return child.key;
      }));
      var newKeys = JSON.stringify(children.map(function (child) {
        return child.key;
      }));

      if (clones && prevProps.children.length && (prevProps.children.length != children.length || oldKeys !== newKeys)) {
        // A slide has been added,removed or moved
        // HARD REBOOT EVERYTING
        // note: removing clones will trigger re-creation & -calculation
        this.slideRefs = [];
        this.setState(_objectSpread({}, defaultState));
      }

      if (typeof onChangeIndex == "function") {
        // the carousels currentIndex is tracked/controlled by an ancestor.
        var infinite = this.props.infinite;
        var propsIndex = this.props.currentIndex; // current index provided by ancestor

        var stateIndex = this.state.currentIndex; // current index in our records - this should be +children.length higher when infinite

        var realStateIndex = this.state.currentIndex % children.length; // current index adjusted to match ancestors range

        if (typeof propsIndex != "undefined" && prevProps.currentIndex != propsIndex && propsIndex != realStateIndex) {
          // parent changed index in props but our state is not equal
          this.changeCurrentIndex(propsIndex);
        }

        if (stateIndex != prevState.currentIndex && propsIndex != realStateIndex) {
          // this component changed current slide - update the parent
          onChangeIndex(realStateIndex);
        }
      }
    } // REACT ELEMENT REFERENCE CALLBACKS

  }, {
    key: "setCarouselRef",
    value: function setCarouselRef(element) {
      if (element) {
        var _this$props3 = this.props,
            vertical = _this$props3.vertical,
            children = _this$props3.children;
        var containerSize = element.getBoundingClientRect();
        this.availableSize = vertical ? containerSize.height : containerSize.width;
        this.carouselRef = element;
        element.addEventListener("dragstart", function (e) {
          if (e.target.nodeName === "A") {
            e.preventDefault();
          }
        });
      }
    }
  }, {
    key: "setSlideRef",
    value: function setSlideRef(element, index) {
      var children = this.props.children;
      var _this$state = this.state,
          clones = _this$state.clones,
          clonePositions = _this$state.clonePositions; // set the ref

      if (element) {
        this.slideRefs[index] = {
          index: index,
          element: element
        }; // set up stuff when the final ref is set

        if (!clones && index == children.length - 1) {
          // generate clones - this is done only once per init/reset
          // this will trigger a new render and a new setSlideRef cycle
          this.createClones();
        }

        if (clones && !clonePositions.length && index == clones.length - 1) {
          // compute each slide-clone start & size
          this.computeClonePositions();
        }
      }
    } // INIT FUNCTIONS TO CALCULATE SLIDE SIZES AND SETTING UP ENV
    // carousel allways displays clones instead of children when it is done setting up

  }, {
    key: "createClones",
    value: function createClones() {
      var _this3 = this;

      var _this$props4 = this.props,
          infinite = _this$props4.infinite,
          children = _this$props4.children;
      var currentIndex = this.state.currentIndex;
      var clones = [];
      var newCurrentIndex = currentIndex;

      if (infinite) {
        (function () {
          // loop over slideRefs 3 times
          // this way we have extra clones covering both directions of slider
          var nextIdx = 0;

          for (var i = 1; i <= 3; i++) {
            children.forEach(function (slide, index) {
              clones[nextIdx] = _react["default"].cloneElement(slide);
              nextIdx += 1;
            });
          } // set current index to first item of duplicates


          newCurrentIndex += _this3.slideRefs.length;
        })();
      } else {
        children.forEach(function (slide, index) {
          clones[index] = _react["default"].cloneElement(slide);
        });
      }

      this.setState({
        clones: clones,
        currentIndex: newCurrentIndex
      });
    } // use element references to calculate each clones start + size
    // note: this could not calculate when running setSlideRef because we did not have this.availableWidth

  }, {
    key: "computeClonePositions",
    value: function computeClonePositions() {
      var _this4 = this;

      var _this$props5 = this.props,
          slidesInView = _this$props5.slidesInView,
          infinite = _this$props5.infinite,
          vertical = _this$props5.vertical;
      var clones = this.state.clones;
      var fixedSlideSize = null;

      if (_typeof(slidesInView) === "object" && slidesInView != null) {
        // carousel is operating with dynamic set of boundaries for slidesInView.
        // figure out how many slides to show for currently availableSize in container
        var bestBoundsMatch = null;
        var slidesForCurrentView = 1; // fallback to one slide

        for (var bounds in slidesInView) {
          if (bounds < this.availableSize) {
            // current caousel size is big enough to use these bounds
            if (!bestBoundsMatch) {
              // first bounds below current carousel size
              bestBoundsMatch = bounds;
              slidesForCurrentView = slidesInView[bounds];
            } else if (bounds > bestBoundsMatch) {
              // current bounds are bigger than found before
              bestBoundsMatch = bounds;
              slidesForCurrentView = slidesInView[bounds];
            }
          }
        }

        fixedSlideSize = Math.floor(this.availableSize / slidesForCurrentView);
      } else if (slidesInView != "auto") {
        // carousel has a staic number of slides at all times
        fixedSlideSize = Math.floor(this.availableSize / slidesInView);
      } // apply size + start to each clone


      var clonePositions = [];

      if (fixedSlideSize) {
        // all slides have the same size
        clonePositions = clones.map(function (clone, index) {
          return {
            index: index,
            size: fixedSlideSize,
            start: fixedSlideSize * index
          };
        });
      } else {
        // slidesInView == "auto"
        // each slide can have unique size
        // calculate each size + start based on slideRef.element computed width/heigth in DOM
        var prev = null;
        clonePositions = clones.map(function (clone, index) {
          var element = _this4.slideRefs[index % _this4.slideRefs.length].element;
          var slideSizes = element.getBoundingClientRect();
          var result = {
            index: index,
            size: vertical ? slideSizes.height : slideSizes.width,
            start: prev ? prev.start + prev.size : 0
          };
          prev = result;
          return result;
        });
      }

      this.setState({
        clonePositions: clonePositions
      });
    }
  }, {
    key: "changeCurrentIndex",
    value: function changeCurrentIndex(index) {
      var _this5 = this;

      // THIS METHOD IS CALLED
      // * ON PREV/NEXT
      // * WHENEVER A CONTROLLED COMPONENT GETS NEW INDEX FROM PARENT
      var _this$props6 = this.props,
          infinite = _this$props6.infinite,
          loop = _this$props6.loop,
          children = _this$props6.children,
          swipeMode = _this$props6.swipeMode;
      var _this$state2 = this.state,
          currentIndex = _this$state2.currentIndex,
          clonePositions = _this$state2.clonePositions;
      var slidesCount = children.length;
      var idx = index;

      if (infinite) {
        // might need to update to a more fitting (clone) index
        // only if we're told to change index to a slide outside the mid-range of an infinite carousel
        if (index <= slidesCount - 1) {
          idx = slidesCount + index;
        }

        if (index >= slidesCount * 2) {
          idx = index - slidesCount;
        }
      } // specialcase when props [ !inifinte && swipeMode == "step" ]
      // these carousels use this state.offset instead of currentIndex in this.getTransform()


      var nextOffset = !infinite && swipeMode == "step" ? this.calculateCarouselOffset(idx) : 0;

      if (idx != currentIndex) {
        // Figure out if we should play somekind of autoslide transition
        if (!infinite && !loop || idx == currentIndex + 1 || idx == currentIndex - 1) {
          // NO INFINITE OR LOOP
          // OR regular step +/- just one slide changed
          // other methods calling this function prevents going beyond available index
          // TODO: Improve this algorithm to allow regular autosliding for several steps when the distance is short
          this.autoSlide({
            currentIndex: idx,
            offset: nextOffset
          });
        } else {
          // WELCOME TO THE DANGERZONE! WE ARE SPECEWARPING INTO HYPERSPACE
          // figure out if infinite carousel is still just changing +/- 1 slide (but shifting between clone-sets)
          var infiniteSingleStep = 0;

          if (infinite) {
            if (currentIndex == idx + 1 || currentIndex == idx + slidesCount + 1 || currentIndex == idx - slidesCount + 1) infiniteSingleStep = 1;
            if (currentIndex == idx - 1 || currentIndex == idx + slidesCount - 1 || currentIndex == idx - slidesCount - 1) infiniteSingleStep = -1;
          }

          if (infiniteSingleStep == 0) {
            // jumping more than one slide
            // OR jumping between first-last in loop mode
            var totalSlidesSize = clonePositions[clonePositions.length - 1].start + clonePositions[clonePositions.length - 1].size;

            if (!infinite && swipeMode == "step" && this.availableSize > totalSlidesSize) {
              // prevent playing loop animation; all slides are visible at all times
              this.autoSlide({
                currentIndex: idx
              });
            } else {
              var autoswipe = clonePositions[currentIndex].start - clonePositions[idx].start; //const speed = Math.round(Math.abs(autoswipe) * 0.25)

              var speed = 0;
              this.setState({
                currentIndex: idx,
                swiping: autoswipe,
                isLooping: true,
                offset: nextOffset
              }, function () {
                _this5.snapTimeout = setTimeout(function () {
                  _this5.autoSlide({
                    swiping: 0,
                    isLooping: false
                  }, speed);
                }, 150);
              });
            }
          } else {
            // only changing index by one slide
            // BUT jumping between first/last item to facilitate infinite scroll
            // postitive infiniteSingleStep value means going forwards
            var autoSwipingItemId = idx < currentIndex ? idx - 1 : idx;
            var dist = clonePositions[autoSwipingItemId].size;

            var _autoswipe = infiniteSingleStep == 1 ? dist : -dist;

            this.setState({
              currentIndex: idx,
              swiping: _autoswipe,
              offset: nextOffset
            }, function () {
              _this5.snapTimeout = setTimeout(function () {
                _this5.autoSlide({
                  swiping: 0
                });
              }, 50);
            });
          }
        }
      }
    }
  }, {
    key: "autoSlide",
    value: function autoSlide(nextState, speed) {
      var _this6 = this;

      var swipeMode = this.props.swipeMode;
      var isLooping = this.state.isLooping;
      var resetSpeed = false;

      if (speed) {
        resetSpeed = this.autoSlideSpeed;
        this.autoSlideSpeed = speed;
      } // helper method to ensure trasition-duration is set during sliding
      // only intended for state changes to state.currentIndex or state.swiping


      this.setState({
        autoSliding: true
      }, function () {
        // start autoslide sequence
        if (isLooping && !nextState.isLooping) {
          // await stopping isLooping by breaking it out in its own, delayed setState
          delete nextState.isLooping;
          _this6.fadeTimeout = setTimeout(function () {
            _this6.setState({
              isLooping: false
            });
          }, 250);
        } // set the next state (perform the autoSlide)


        _this6.setState(nextState, function () {
          // stop autoSliding when the animations has completed
          _this6.transitionTimeout = setTimeout(function () {
            _this6.setState({
              autoSliding: false
            }, function () {
              if (resetSpeed) {
                _this6.autoSlideSpeed = resetSpeed;
              }
            });
          }, _this6.autoSlideSpeed);
        });
      });
    }
  }, {
    key: "calculateCarouselOffset",
    value: function calculateCarouselOffset(slideIndex) {
      var clonePositions = this.state.clonePositions;
      var currentOffset = this.state.offset;
      var offset = currentOffset; // specialcase for step mode - we need to figure out if a translate offset is needed

      if (typeof slideIndex != "undefined") {
        // perform translate if there is no further items
        // translate by size of the item to dissapear from view
        var currentSlide = clonePositions[slideIndex];
        var nextSlide = slideIndex + 1 in clonePositions && clonePositions[slideIndex + 1];
        var previousSlide = slideIndex - 1 in clonePositions && clonePositions[slideIndex - 1];
        var finalSlide = clonePositions[clonePositions.length - 1];
        var currentEnd = this.availableSize - offset;
        var totalSlidesSize = finalSlide.start + finalSlide.size;

        if (this.availableSize >= totalSlidesSize) {
          // all slides are visible at all times
          offset = 0;
        } else if (this.availableSize < currentSlide.size * 3) {
          // the carousel is not big enough to show prev + next. Just adjust offset to show current slide
          offset = currentSlide.start;
        } else {
          // adjust offset so that pevious and next slide is allways visible
          if (!nextSlide) {
            // we have reached the end of carousel
            // set offset so that currentSlide is fully visible
            offset = currentSlide.start + currentSlide.size - this.availableSize;
          } else {
            if (!previousSlide) {
              // we have reaced the beginning of carousel
              // set offset so that currentSlide is fully visible
              offset = 0;
            } else {
              // we are in-between beginning/end
              if (nextSlide.start + nextSlide.size > currentEnd) {
                // next slide is out of view
                offset = nextSlide.start + nextSlide.size - this.availableSize;
              } else if (previousSlide.start < offset) {
                // previous slide is out of view
                offset = previousSlide.start;
              }
            }
          }
        }
      }

      return offset;
    } // EVENT CALLBACK METHODS USED IN RENDER

  }, {
    key: "prev",
    value: function prev() {
      var _this$props7 = this.props,
          children = _this$props7.children,
          loop = _this$props7.loop;
      var currentIndex = this.state.currentIndex;

      if (currentIndex > 0) {
        this.changeCurrentIndex(currentIndex - 1);
      } else {
        if (loop) this.changeCurrentIndex(children.length - 1);
      }
    }
  }, {
    key: "next",
    value: function next() {
      var _this$props8 = this.props,
          children = _this$props8.children,
          loop = _this$props8.loop;
      var _this$state3 = this.state,
          currentIndex = _this$state3.currentIndex,
          clonePositions = _this$state3.clonePositions;

      if (currentIndex < clonePositions.length - 1) {
        this.changeCurrentIndex(currentIndex + 1);
      } else {
        if (loop) this.changeCurrentIndex(0);
      }
    }
  }, {
    key: "onSwipedLeft",
    value: function onSwipedLeft(eventData) {
      this.next();
    }
  }, {
    key: "onSwipedRight",
    value: function onSwipedRight(eventData) {
      this.prev();
    }
  }, {
    key: "handleKeyboard",
    value: function handleKeyboard(event) {
      if (event.keyCode === 37) this.prev();
      if (event.keyCode === 39) this.next();
    }
  }, {
    key: "handleSelect",
    value: function handleSelect(index, event) {
      var swiping = this.state.swiping;
      var onSelect = this.props.onSelect;

      if (!swiping) {
        // this is a direct click, and not just onSwipeDragDone leaking the event
        if (onSelect) {
          // this carousel has i custom onSelect function
          onSelect(index, event);
        }
      } else {
        event.preventDefault();
      }
    }
  }, {
    key: "onSwipeDrag",
    value: function onSwipeDrag(eventData) {
      var vertical = this.props.vertical;
      this.setState({
        isDragging: true,
        swiping: vertical ? eventData.deltaY : eventData.deltaX
      });
    }
  }, {
    key: "onSwipeDragDone",
    value: function onSwipeDragDone(eventData) {
      var _this7 = this;

      // update currentIndex to the closest slideIndex from current swipe offset
      // remaining swipe value will be transitioned away if this.props.snap
      // if this.props.infinte: currentIndex index will be swapped to a equivilant min-range slide-clone
      // TODO: Add support for inertia (continued scroll after release) by reading eventData.velocity
      var _this$props9 = this.props,
          infinite = _this$props9.infinite,
          snap = _this$props9.snap,
          lazySwipe = _this$props9.lazySwipe,
          vertical = _this$props9.vertical;
      var _this$state4 = this.state,
          swiping = _this$state4.swiping,
          currentIndex = _this$state4.currentIndex,
          clonePositions = _this$state4.clonePositions;
      var pos = clonePositions[currentIndex].start + swiping;
      var closestItem = clonePositions.reduce(function (prev, curr) {
        return Math.abs(curr.start - pos) < Math.abs(prev.start - pos) ? curr : prev;
      });

      if (snap && lazySwipe && closestItem.index == currentIndex) {
        // allow lazy users to trigger prev/next even if they swiped just a minimum distance
        var modifier = 0;

        if (vertical) {
          if (eventData.dir == "Down") modifier = 1;
          if (eventData.dir == "Up") modifier = -1;
        } else {
          if (eventData.dir == "Left") modifier = 1;
          if (eventData.dir == "Right") modifier = -1;
        }

        closestItem = clonePositions[currentIndex + modifier] ? clonePositions[currentIndex + modifier] : clonePositions[currentIndex];
      }

      var index = closestItem.index;
      var diff = -(closestItem.start - pos);

      if (infinite) {
        // adjust currentIndex to same slide in the mid-segment of clonePositions
        var slidesCount = clonePositions.length / 3;
        var minIndex = slidesCount - 1;
        var maxIndex = slidesCount * 2 - 1;

        if (index <= minIndex) {
          index = slidesCount + index;
        } else if (index >= maxIndex) {
          index = index - slidesCount;
        }
      }

      this.setState({
        currentIndex: index,
        swiping: diff,
        isDragging: false
      }, function () {
        if (snap) {
          _this7.snapTimeout = setTimeout(function () {
            _this7.autoSlide({
              swiping: 0
            });
          }, 10);
        }
      });
    }
  }, {
    key: "getTransform",
    value: function getTransform() {
      var _this$props10 = this.props,
          vertical = _this$props10.vertical,
          swipeMode = _this$props10.swipeMode,
          infinite = _this$props10.infinite;
      var _this$state5 = this.state,
          currentIndex = _this$state5.currentIndex,
          offset = _this$state5.offset,
          swiping = _this$state5.swiping,
          autoSliding = _this$state5.autoSliding,
          isLooping = _this$state5.isLooping,
          isDragging = _this$state5.isDragging,
          clonePositions = _this$state5.clonePositions;
      var style = {};

      if (clonePositions.length) {
        if (isDragging) {
          style.transition = "none";
        } else if (autoSliding || isLooping) {
          style.transition = "transform ".concat(this.autoSlideSpeed, "ms, filter 150ms ease-out, -webkit-filter 150ms ease-out, opacity 150ms ease-out");
        }

        if (isLooping) {
          style.filter = "blur(1px)";
          style.WebkitFilter = "blur(1px)";
          style.opacity = 0;
        } else {
          style.filter = "none";
          style.WebkitFilter = "none";
          style.opacity = 1;
        }

        var pos = 0;

        if (!infinite && swipeMode == "step") {
          // in this mode we dont change translate before next slide after/before currentIndex is the last fully visible one
          // this translate-value is set to state on this.autoSlide (setCurrentIndex allways calls that method) so we don't need to calcualte it here
          pos = offset + swiping;
        } else {
          // translate so that currentIndex is allways the first visible slide
          pos = clonePositions[currentIndex] && clonePositions[currentIndex].start || 0;
          pos += swiping;
        }

        var x = !vertical && -pos || 0;
        var y = vertical && -pos || 0;
        style.transform = "translate3d(".concat(x, "px, ").concat(y, "px, 0px)");
      }

      return style;
    }
  }, {
    key: "render",
    value: function render() {
      var _this8 = this;

      var _this$props11 = this.props,
          className = _this$props11.className,
          slidesInView = _this$props11.slidesInView,
          controls = _this$props11.controls,
          onSelect = _this$props11.onSelect,
          swipeMode = _this$props11.swipeMode,
          vertical = _this$props11.vertical,
          children = _this$props11.children;
      var _this$state6 = this.state,
          currentIndex = _this$state6.currentIndex,
          swiping = _this$state6.swiping,
          clones = _this$state6.clones,
          clonePositions = _this$state6.clonePositions,
          autoSliding = _this$state6.autoSliding;
      var transformStyle = this.getTransform();
      var slideHeight = vertical && slidesInView != "auto" && clonePositions.length ? clonePositions[0].size : null;
      var slideWidth = !vertical && slidesInView != "auto" && clonePositions.length ? clonePositions[0].size : null;
      return _react["default"].createElement("div", {
        className: "carousel-container" + (controls ? vertical ? " carousel-container--with-vertical-controls" : " carousel-container--with-controls " : " ") + (className ? className : "")
      }, controls && _react["default"].createElement("button", {
        type: "button",
        className: "carousel__control " + (vertical ? "carousel__control--up" : "carousel__control--left"),
        onClick: this.prev
      }, "Forrige"), _react["default"].createElement(_reactSwipeable.Swipeable, _extends({
        className: "carousel-swipe-wrapper",
        onSwipedLeft: !vertical && swipeMode == "step" ? this.onSwipedLeft : null,
        onSwipedRight: !vertical && swipeMode == "step" ? this.onSwipedRight : null,
        onSwipedUp: vertical && swipeMode == "step" ? this.onSwipedLeft : null,
        onSwipedDown: vertical && swipeMode == "step" ? this.onSwipedRight : null,
        onSwiping: swipeMode == "drag" ? this.onSwipeDrag : null,
        onSwiped: swipeMode == "drag" ? this.onSwipeDragDone : null
      }, this.swipeConfig), _react["default"].createElement("div", {
        ref: this.setCarouselRef,
        className: "carousel" + (vertical ? " carousel--vertical" : ""),
        style: transformStyle
      }, !clones && children.map(function (item, index) {
        return _react["default"].createElement(_CarouselSlide["default"], {
          key: index,
          index: index,
          itemRef: _this8.setSlideRef
        }, item);
      }), clones && clones.map(function (item, index) {
        return _react["default"].createElement(_CarouselSlide["default"], {
          key: index,
          index: index,
          itemRef: _this8.setSlideRef,
          isCurrent: index == currentIndex,
          onClick: function onClick(e) {
            return _this8.handleSelect(index, e);
          },
          width: slideWidth,
          height: slideHeight
        }, item);
      }))), controls && _react["default"].createElement("button", {
        type: "button",
        className: "carousel__control " + (vertical ? "carousel__control--down" : "carousel__control--right"),
        onClick: this.next
      }, "Neste"));
    }
  }]);

  return Carousel;
}(_react["default"].Component);

exports["default"] = Carousel;
Carousel.defaultProps = {
  slidesInView: "auto",
  swipeMode: "step",
  lazySwipe: true,
  snap: true,
  loop: true,
  infinite: false,
  vertical: false,
  keyboard: false,
  controls: false,
  swipeConfig: {}
};
Carousel.propTypes = {
  className: _propTypes["default"].string,
  currentIndex: _propTypes["default"].number,
  onChangeIndex: _propTypes["default"].func,
  onSelect: _propTypes["default"].func,
  vertical: _propTypes["default"].bool.isRequired,
  lazySwipe: _propTypes["default"].bool.isRequired,
  snap: _propTypes["default"].bool,
  infinite: _propTypes["default"].bool,
  loop: _propTypes["default"].bool.isRequired,
  slidesInView: _propTypes["default"].oneOfType([_propTypes["default"].object, _propTypes["default"].number, _propTypes["default"].oneOf(["auto"])]).isRequired,
  swipeMode: _propTypes["default"].oneOf(["drag", "step", "none"]).isRequired,
  keyboard: _propTypes["default"].bool.isRequired,
  controls: _propTypes["default"].bool.isRequired,
  swipeConfig: _propTypes["default"].object.isRequired
};