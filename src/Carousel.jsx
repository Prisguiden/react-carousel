import React from "react"
import PropTypes from "prop-types"
import { Swipeable } from "react-swipeable"
import CarouselSlide from "./CarouselSlide"

const defaultState = {
    swiping: 0,
    offset: 0,
    currentIndex: 0,
    fixedSlideSize: false,
    slidePositions: [],
    availableSize: null,
    slidesTotalSize: null,
    autoSliding: false,
    clones: null
}

export default class Carousel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentIndex: this.props.currentIndex || 0,
            ...defaultState
        }

        this.initialized = false
        this.recalculate = false
        this.slideRefs = [] // for keeping slides on init
        this.autoSlideSpeed = 300 // ms - this may change, depending on distance
        this.snapTimeout = null // make shure all parameters from snapping is set before running transitions
        this.transitionTimeout = null // to disable transition-duration (css prop) after autoSlideSpeed

        this.swipeConfig = {
            delta: 30, // min distance(px) before a swipe starts
            preventDefaultTouchmoveEvent: true, // preventDefault on touchmove,
            trackTouch: true, // track touch input
            trackMouse: true, // track mouse input
            rotationAngle: 0 // set a rotation angle
        }

        this.setCarouselRef = this.setCarouselRef.bind(this)
        this.setItemRef = this.setItemRef.bind(this)
        this.getTransform = this.getTransform.bind(this)

        this.prev = this.prev.bind(this)
        this.next = this.next.bind(this)
        this.changeCurrentIndex = this.changeCurrentIndex.bind(this)
        this.handleKeyboard = this.handleKeyboard.bind(this)
        this.handleSelect = this.handleSelect.bind(this)
        this.onSwipedLeft = this.onSwipedLeft.bind(this)
        this.onSwipedRight = this.onSwipedRight.bind(this)
        this.onSwipeDrag = this.onSwipeDrag.bind(this)
        this.onSwipeDragDone = this.onSwipeDragDone.bind(this)
    }

    // LIFESYCLE METHODS

    componentDidMount() {
        // start event listener for arrow keys on keyboard?
        const { keyboard } = this.props
        if (keyboard) {
            document.addEventListener("keydown", this.handleKeyboard)
        }

        this.computeSlides()

        // TODO: Add resizeObserver and recalculate everything if bounds != this.availableSize
    }

    componentWillUnmount() {
        // stop event listener for keyboard
        clearTimeout(this.snapTimeout)
        clearTimeout(this.transitionTimeout)

        const { keyboard } = this.props
        if (keyboard) {
            document.removeEventListener("keydown", this.handleKeyboard)
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const updateParent = this.props.onChangeIndex
        const { children } = this.props

        if (
            !this.recalculate &&
            this.initialized &&
            prevProps.children.length &&
            prevProps.children.length != children.length
        ) {
            // A slide has been added/removed
            // re-initialize everyting
            // recalculate will trigger recreation of clones & slidePositions when last slide runs its reference callback
            this.recalculate = true
            this.slideRefs = []
            this.setState({ ...defaultState })
        }

        if (typeof updateParent == "function") {
            // the carousels currentIndex is tracked/controlled by an ancestor.
            const { infinite } = this.props
            const pidx = this.props.currentIndex
            const idx = this.state.currentIndex
            // infinite carousels allways use indexes belonging to a duplicate set above the original one
            let realIdx = idx
            if (infinite && idx >= children.length * 2) {
                realIdx = idx - children.length
            } else if (infinite && idx <= children.length) {
                realIdx = idx + children.length
            }

            if (
                typeof pidx != "undefined" &&
                prevProps.currentIndex != pidx &&
                pidx != realIdx
            ) {
                // parent component tells us to change current index
                this.changeCurrentIndex(pidx) // will handle infinite quirks
            }

            if (idx != prevState.currentIndex && pidx != realIdx) {
                // the index is tracked by an ancestor.
                // this component changed current slide - update the parent
                updateParent(realIdx)
            }
        }
    }

    // REACT REFERENCE CALLBACKS
    // note: setItemRef is only in use when !this.initialized - else we're using clones without ref

    setCarouselRef(element) {
        if (element) {
            const { vertical, children } = this.props
            const containerSize = element.getBoundingClientRect()
            this.availableSize = vertical
                ? containerSize.height
                : containerSize.width
        }
    }

    setItemRef(element, index) {
        const { vertical, slides, children } = this.props
        if ((!this.initialized || this.recalculate) && element) {
            if (slides != "auto") {
                // each slide size & start will be added in componentDidMount
                this.slideRefs[index] = {
                    index: index
                }
            } else {
                // calculate each slide size based on its css width/heigth
                const slideSizes = element.getBoundingClientRect()
                const size = vertical ? slideSizes.height : slideSizes.width
                const previousItem = this.slideRefs[index - 1] || null
                const start = previousItem
                    ? previousItem.start + previousItem.size
                    : 0
                this.slideRefs[index] = {
                    index: index,
                    start: start,
                    size: size
                }
            }

            if (this.recalculate && index == children.length - 1) {
                // need to manually call computeSlides AFTER all the refs have been set
                this.computeSlides()
                this.recalculate = false
            }
        }
    }

    // INIT FUNCTION TO CALCULATE SLIDE SIZES AND SETTING UP ENV
    computeSlides() {
        const { children, slides, infinite } = this.props
        let { currentIndex, slidePositions } = this.state
        if (infinite && currentIndex > children.length - 1) {
            // This carousel is currently displaying a clone of the actual slide
            // Need to find the correct index amongst the original children
            currentIndex = currentIndex - slidePositions.length / 3
        }

        // set stuffs added by ref callbacks to state
        const fixedSlideSize =
            slides != "auto" ? Math.floor(this.availableSize / slides) : null
        let slidesTotalSize = fixedSlideSize
            ? fixedSlideSize * this.slideRefs.length
            : this.slideRefs.reduce((prev, curr) => {
                  const acc = isNaN(prev) ? parseInt(prev.size) : prev
                  return acc + parseInt(curr.size)
              })

        if (fixedSlideSize) {
            // need to set each slides size + start
            // this could not calculate on setItemRef
            slidePositions = this.slideRefs.map((item, index) => {
                return Object.assign({}, item, {
                    size: fixedSlideSize,
                    start: fixedSlideSize * index
                })
            })
        } else {
            slidePositions = this.slideRefs
        }

        const clones = []
        let newCurrentIndex = currentIndex
        if (infinite) {
            slidesTotalSize = slidesTotalSize * 3

            const extendedSlidePositions = []
            let nextStart = 0
            let nextIdx = 0
            for (let i = 1; i <= 3; i++) {
                slidePositions.forEach((slide, index) => {
                    extendedSlidePositions[nextIdx] = Object.assign({}, slide, {
                        index: nextIdx,
                        start: nextStart
                    })
                    clones[nextIdx] = React.cloneElement(children[index])
                    nextIdx += 1
                    nextStart = nextStart + slide.size
                })
            }

            // set current index to first item of duplicates
            // that way we have items covering both directions of slider
            newCurrentIndex = slidePositions.length
            slidePositions = extendedSlidePositions
        } else {
            slidePositions.forEach((slide, index) => {
                clones[index] = React.cloneElement(children[index])
            })
        }

        this.setState(
            {
                clones: clones,
                currentIndex: newCurrentIndex,
                fixedSlideSize: fixedSlideSize,
                slidesTotalSize: slidesTotalSize,
                slidePositions: slidePositions
            },
            () => {
                this.initialized = true
            }
        )
    }

    changeCurrentIndex(index) {
        // THIS METHOD IS CALLED ON PREV/NEXT AND WHENEVER A CONTROLLED COMPONENT GETS NEW INDEX FROM PARENT

        // TODO: when getting updates from parent on infinite carousels:
        // Need more information about what direction to scroll. Might scroll the wron way now
        // See TODO note further down

        const { infinite, loop, children } = this.props
        const { currentIndex, slidePositions } = this.state
        const slidesCount = children.length
        let idx = index
        if (infinite) {
            // might need to update to a more fitting (clone) index
            // only if we're told to change index to a slide outside the mid-range of an infinite carousel
            if (index <= slidesCount - 1) {
                idx = slidesCount + index
            }
            if (index >= slidesCount * 2) {
                idx = index - children.length
            }
        }

        // Figure out if we should play somekind of autoslide transition
        if (idx != currentIndex) {
            if (!infinite && !loop) {
                // NO INFINITE OR LOOP - SHOULD STILL CHANGE INDEX REGARDLESS
                // other methods calling this function prevents going beyond available index
                this.autoSlide({ currentIndex: idx })
            } else {
                let spacewarp = 0 // direction to swipe in

                if (idx > currentIndex && idx > currentIndex + 1) {
                    // swiping forward more than one
                    // OR jumping forward into a later set of clones
                    // OR looping (backwards) from first to last
                    spacewarp = 1
                }
                if (idx < currentIndex && idx < currentIndex - 1) {
                    // swiping backwards more than one
                    // OR jumping backwards into an earlier set of clones
                    // OR or looping (forwards) from last to first
                    spacewarp = -1
                }

                if (spacewarp == 0) {
                    // regular step; +/- one index changed
                    // nothing unique happes for loop/infinite here
                    this.autoSlide({ currentIndex: idx })
                } else {
                    // WELCOME TO THE DANGERZONE! WE ARE SPECEWARPING INTO HYPERSPACE
                    // loop and infinite tackle this their own way

                    if (!infinite) {
                        // LOOP MODE - jumping between first-last
                        // OR a controlled (non-infinite) component is told to swipe more than one slide
                        const autoswipe =
                            slidePositions[currentIndex].start -
                            slidePositions[idx].start
                        const speed = Math.round(Math.abs(autoswipe) * 1.5)
                        this.setState(
                            { currentIndex: idx, swiping: autoswipe },
                            () => {
                                this.snapTimeout = setTimeout(() => {
                                    this.autoSlide({ swiping: 0 }, speed)
                                }, 10)
                            }
                        )
                    } else {
                        // INFINITE MODE
                        // TODO: IMPROVE! - ALGORITHM FOR DIRECTION NOT OPTIMAL ON INFINITE SCROLLS
                        // need to add information about what direction the swipe actually had
                        // using spacewarp direction as swipe directions is unreliable

                        const x = currentIndex
                        const y = slidesCount
                        let singleStep = false
                        if (
                            x == idx + 1 ||
                            x == idx + y + 1 ||
                            x == idx - y + 1
                        )
                            singleStep = true
                        if (
                            x == idx - 1 ||
                            x == idx + y - 1 ||
                            x == idx - y - 1
                        )
                            singleStep = true

                        if (singleStep) {
                            // only changing index by one slide
                            // BUT jumping between first/last item to facilitate infinite scroll
                            // postitive spacewarp value means going forwards
                            const autoSwipingItemId =
                                idx < currentIndex ? idx - 1 : idx
                            const dist = slidePositions[autoSwipingItemId].size
                            const autoswipe = spacewarp == 1 ? dist : -dist
                            this.setState(
                                { currentIndex: idx, swiping: autoswipe },
                                () => {
                                    this.snapTimeout = setTimeout(() => {
                                        this.autoSlide({ swiping: 0 })
                                    }, 10)
                                }
                            )
                        } else {
                            // we have been told to move by more than one slide
                            // this only happens for controlled components when parent changes this.props.currentIndex
                            const forward = !!(spacewarp > 0)
                            const autoSwipingItemId = forward ? idx - 1 : idx
                            const dist = slidePositions[autoSwipingItemId].size
                            const autoswipe = forward ? -dist : dist
                            this.setState(
                                { currentIndex: idx, swiping: autoswipe },
                                () => {
                                    this.snapTimeout = setTimeout(() => {
                                        this.autoSlide({ swiping: 0 })
                                    }, 10)
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    autoSlide(nextState, speed) {
        let resetSpeed = false
        if (speed) {
            resetSpeed = this.autoSlideSpeed
            this.autoSlideSpeed = speed
        }
        // helper method to ensure trasition-duration is set during sliding
        // only intended for state changes to state.currentIndex or state.swiping
        this.setState({ autoSliding: true }, () => {
            this.setState(nextState, () => {
                this.transitionTimeout = setTimeout(() => {
                    this.setState({ autoSliding: false }, () => {
                        if (resetSpeed) {
                            this.autoSlideSpeed = resetSpeed
                        }
                    })
                }, this.autoSlideSpeed)
            })
        })
    }

    // EVENT CALLBACK METHODS USED IN RENDER

    prev() {
        const { children, loop } = this.props
        const { currentIndex, slidePositions } = this.state
        if (currentIndex > 0) {
            this.changeCurrentIndex(currentIndex - 1)
        } else {
            if (loop) this.changeCurrentIndex(children.length - 1)
        }
    }

    next() {
        const { children, loop } = this.props
        const { currentIndex, slidePositions } = this.state
        if (currentIndex < slidePositions.length - 1) {
            this.changeCurrentIndex(currentIndex + 1)
        } else {
            if (loop) this.changeCurrentIndex(0)
        }
    }

    onSwipedLeft(eventData) {
        this.next()
    }

    onSwipedRight(eventData) {
        this.prev()
    }

    handleKeyboard(event) {
        if (event.keyCode === 37) this.prev()
        if (event.keyCode === 39) this.next()
    }

    handleSelect(index, event) {
        const { swiping } = this.state
        const { onSelect } = this.props
        if (!swiping) {
            // this is a direct click, and not just onSwipeDragDone leaking the event
            if (onSelect) {
                // this carousel has i custom onSelect function
                onSelect(index, event)
            } else if (event.target.firstChild.href) {
                // the slide is a link - navigate to href
                window.location.href = event.target.firstChild.href
            }
        }
    }

    onSwipeDrag(eventData) {
        const { vertical } = this.props
        this.setState({
            swiping: vertical ? eventData.deltaY : eventData.deltaX
        })
    }

    onSwipeDragDone(eventData) {
        // update currentIndex to the closest slideIndex from current swipe offset
        // remaining swipe value will be transitioned away if this.props.snap
        // if this.props.infinte: currentIndex index will be swapped to a equivilant min-range slide-clone

        // TODO: Add support for inertia (continued scroll after release) by reading eventData.velocity

        const { infinite, snap } = this.props
        const { swiping, currentIndex, slidePositions } = this.state
        const pos = slidePositions[currentIndex].start + swiping
        const closestItem = slidePositions.reduce((prev, curr) => {
            return Math.abs(curr.start - pos) < Math.abs(prev.start - pos)
                ? curr
                : prev
        })

        let index = closestItem.index
        const diff = -(closestItem.start - pos)

        if (infinite) {
            // adjust currentIndex to same slide in the mid-segment of clones
            const slidesCount = slidePositions.length / 3
            const minIndex = slidesCount - 1
            const maxIndex = slidesCount * 2 - 1
            if (index <= minIndex) {
                index = slidesCount + index
            } else if (index >= maxIndex) {
                index = index - slidesCount
            }
        }
        this.setState({ currentIndex: index, swiping: diff }, () => {
            if (snap) {
                this.snapTimeout = setTimeout(() => {
                    this.autoSlide({ swiping: 0 })
                }, 10)
            }
        })
    }

    getTransform() {
        const { vertical } = this.props
        const {
            currentIndex,
            fixedSlideSize,
            swiping,
            slidePositions,
            autoSliding
        } = this.state

        const style = {}
        let pos
        if (fixedSlideSize) {
            pos = fixedSlideSize * currentIndex
        } else {
            pos =
                (slidePositions[currentIndex] &&
                    slidePositions[currentIndex].start) ||
                0
        }
        pos += swiping

        const x = (!vertical && -pos) || 0
        const y = (vertical && -pos) || 0

        style.transform = `translate3d(${x}px, ${y}px, 0px)`
        if (autoSliding) style.transitionDuration = this.autoSlideSpeed + "ms"

        return style
    }

    render() {
        const {
            className,
            slides,
            controls,
            onSelect,
            swipeMode,
            vertical,
            children
        } = this.props
        const {
            currentIndex,
            fixedSlideSize,
            swiping,
            clones,
            autoSliding
        } = this.state
        const transformStyle = this.getTransform()

        return (
            <div
                className={
                    "carousel-container" +
                    (controls ? " carousel-container--with-controls " : " ") +
                    (className ? className : "")
                }
            >
                {controls && (
                    <button
                        type="button"
                        className="carousel__control--prev"
                        onClick={this.prev}
                    >
                        Forrige
                    </button>
                )}

                <Swipeable
                    className="carousel-swipe-wrapper"
                    onSwipedLeft={
                        swipeMode == "step" ? this.onSwipedLeft : null
                    }
                    onSwipedRight={
                        swipeMode == "step" ? this.onSwipedRight : null
                    }
                    onSwiping={swipeMode == "drag" ? this.onSwipeDrag : null}
                    onSwiped={swipeMode == "drag" ? this.onSwipeDragDone : null}
                    {...this.swipeConfig}
                >
                    <div
                        ref={this.setCarouselRef}
                        className={
                            "carousel" +
                            (vertical ? " carousel--vertical" : "") +
                            (swipeMode == "step"
                                ? " carousel--transition-delay"
                                : "")
                        }
                        style={transformStyle}
                    >
                        {!clones &&
                            children.map((item, index) => {
                                return (
                                    <CarouselSlide
                                        key={index}
                                        index={index}
                                        itemRef={this.setItemRef}
                                    >
                                        {item}
                                    </CarouselSlide>
                                )
                            })}

                        {clones &&
                            clones.map((item, index) => {
                                return (
                                    <CarouselSlide
                                        key={index}
                                        index={index}
                                        isCurrent={index == currentIndex}
                                        onClick={e =>
                                            this.handleSelect(index, e)
                                        }
                                        width={
                                            !vertical && fixedSlideSize
                                                ? fixedSlideSize
                                                : null
                                        }
                                        height={
                                            vertical && fixedSlideSize
                                                ? fixedSlideSize
                                                : null
                                        }
                                    >
                                        {item}
                                    </CarouselSlide>
                                )
                            })}
                    </div>
                </Swipeable>

                {controls && (
                    <button
                        type="button"
                        className="carousel__control--next"
                        onClick={this.next}
                    >
                        Neste
                    </button>
                )}
            </div>
        )
    }
}

Carousel.defaultProps = {
    snap: true,
    infinite: true,
    vertical: false,
    loop: true,
    slides: "auto",
    swipeMode: "drag",
    keyboard: false,
    controls: true
}

Carousel.propTypes = {
    className: PropTypes.string,
    currentIndex: PropTypes.number,
    onChangeIndex: PropTypes.func,
    onSelect: PropTypes.func,
    vertical: PropTypes.bool.isRequired,
    snap: PropTypes.bool,
    infinite: PropTypes.bool,
    loop: PropTypes.bool.isRequired,
    slides: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(["auto"])])
        .isRequired,
    swipeMode: PropTypes.oneOf(["drag", "step", "none"]).isRequired,
    keyboard: PropTypes.bool.isRequired,
    controls: PropTypes.bool.isRequired
}
