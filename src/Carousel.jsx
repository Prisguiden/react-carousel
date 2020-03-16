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
    autoSliding: false,
    clones: null,
    isLooping: false,
    isDragging: false
}

const defaultSwipeConfig = {
    delta: 30, // min distance(px) before a swipe starts
    preventDefaultTouchmoveEvent: true, // preventDefault on touchmove,
    trackTouch: true, // track touch input
    trackMouse: true, // track mouse input
    rotationAngle: 0 // set a rotation angle
}

export default class Carousel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentIndex: this.props.currentIndex || 0,
            ...defaultState
        }

        this.swipeConfig = Object.assign(
            {},
            defaultSwipeConfig,
            props.swipeConfig
        )

        this.initialized = false
        this.recalculate = false
        this.carouselRef = null
        this.resizeObserver = null
        this.slideRefs = [] // for keeping slides on init
        this.autoSlideSpeed = 300 // ms - this may change, depending on distance
        this.snapTimeout = null // make shure all parameters from snapping is set before running transitions
        this.transitionTimeout = null // to disable transition-duration (css prop) after autoSlideSpeed

        this.setCarouselRef = this.setCarouselRef.bind(this)
        this.setItemRef = this.setItemRef.bind(this)
        this.getTransform = this.getTransform.bind(this)
        this.calculateCarouselOffset = this.calculateCarouselOffset.bind(this)

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
        const { keyboard, slidesInView, vertical } = this.props
        if (keyboard) {
            document.addEventListener("keydown", this.handleKeyboard)
        }

        this.computeSlides()

        // Add resizeObserver and recalculate slide sizes if slidesInView != auto
        if (slidesInView != "auto" && window.ResizeObserver) {
            this.resizeObserver = new window.ResizeObserver(
                (entries, observer) => {
                    for (let entry of entries) {
                        const size = vertical
                            ? entry.contentRect.height
                            : entry.contentRect.width
                        if (size != this.availableSize) {
                            this.availableSize = size
                            this.computeSlides()
                        }
                    }
                }
            )
            this.resizeObserver.observe(this.carouselRef)
        }
    }

    componentWillUnmount() {
        // stop event listener for keyboard
        clearTimeout(this.snapTimeout)
        clearTimeout(this.transitionTimeout)

        const { keyboard } = this.props
        if (keyboard) {
            document.removeEventListener("keydown", this.handleKeyboard)
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect()
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { onChangeIndex } = this.props
        const { children } = this.props
        var oldKeys = JSON.stringify(prevProps.children.map(child => child.key))
        var newKeys = JSON.stringify(children.map(child => child.key))

        if (
            !this.recalculate &&
            this.initialized &&
            prevProps.children.length &&
            (prevProps.children.length != children.length ||
                oldKeys !== newKeys)
        ) {
            // A slide has been added,removed or moved
            // re-initialize everyting
            // recalculate will trigger recreation of clones & slidePositions when last slide runs its reference callback
            this.recalculate = true
            this.slideRefs = []
            this.setState({ ...defaultState })
        }

        if (typeof onChangeIndex == "function") {
            // the carousels currentIndex is tracked/controlled by an ancestor.
            const { infinite } = this.props
            const propsIndex = this.props.currentIndex
            const stateIndex = this.state.currentIndex

            let realStateIndex = stateIndex
            if (infinite) {
                // infinite carousels allways use indexes belonging to a duplicate set above the original one
                if (realStateIndex >= children.length) {
                    realStateIndex = stateIndex - children.length
                }
            }

            if (
                typeof propsIndex != "undefined" &&
                prevProps.currentIndex != propsIndex &&
                propsIndex != realStateIndex
            ) {
                // parent component tells us to change current index
                this.changeCurrentIndex(propsIndex) // will handle infinite quirks
            }

            if (
                stateIndex != prevState.currentIndex &&
                propsIndex != realStateIndex
            ) {
                // the index is tracked by an ancestor.
                // this component changed current slide - update the parent
                onChangeIndex(realStateIndex)
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
            this.carouselRef = element
        }
    }

    setItemRef(element, index) {
        const { vertical, slidesInView, children } = this.props
        if ((!this.initialized || this.recalculate) && element) {
            if (slidesInView != "auto") {
                // each slide size & start will be added when this.computeSlides() runs
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
        const { children, slidesInView, infinite } = this.props
        let { currentIndex, slidePositions } = this.state
        if (infinite && currentIndex > children.length - 1) {
            // This carousel is currently displaying a clone of the actual slide
            // Need to find the correct index amongst the original children
            currentIndex = currentIndex - slidePositions.length / 3
        }

        // set stuffs added by ref callbacks to state
        const fixedSlideSize =
            slidesInView != "auto"
                ? Math.floor(this.availableSize / slidesInView)
                : null

        if (fixedSlideSize) {
            // need to set each slides size + start
            // this could not calculate on setItemRef
            slidePositions = this.slideRefs.map((item, index) => {
                return {
                    ...item,
                    size: fixedSlideSize,
                    start: fixedSlideSize * index
                }
            })
        } else {
            slidePositions = this.slideRefs
        }

        const clones = []
        let newCurrentIndex = currentIndex
        if (infinite) {
            const extendedSlidePositions = []
            let nextStart = 0
            let nextIdx = 0
            for (let i = 1; i <= 3; i++) {
                slidePositions.forEach((slide, index) => {
                    extendedSlidePositions[nextIdx] = {
                        ...slide,
                        index: nextIdx,
                        start: nextStart
                    }
                    clones[nextIdx] = React.cloneElement(children[index])
                    nextIdx += 1
                    nextStart = nextStart + slide.size
                })
            }

            // set current index to first item of duplicates
            // that way we have items covering both directions of slider
            newCurrentIndex += slidePositions.length
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

        const { infinite, loop, children, swipeMode } = this.props
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
                idx = index - slidesCount
            }
        }

        const nextOffset =
            !infinite && swipeMode == "step"
                ? this.calculateCarouselOffset(idx)
                : 0

        if (idx != currentIndex) {
            // Figure out if we should play somekind of autoslide transition
            if (
                (!infinite && !loop) ||
                (idx == currentIndex + 1 || idx == currentIndex - 1)
            ) {
                // NO INFINITE OR LOOP
                // OR regular step +/- just one slide changed
                // other methods calling this function prevents going beyond available index
                this.autoSlide({ currentIndex: idx, offset: nextOffset })
            } else {
                // WELCOME TO THE DANGERZONE! WE ARE SPECEWARPING INTO HYPERSPACE

                // figure out if infinite carousel is still just changing +/- 1 slide (but shifting between clone-sets)
                let infiniteSingleStep = 0
                if (infinite) {
                    if (
                        currentIndex == idx + 1 ||
                        currentIndex == idx + slidesCount + 1 ||
                        currentIndex == idx - slidesCount + 1
                    )
                        infiniteSingleStep = 1
                    if (
                        currentIndex == idx - 1 ||
                        currentIndex == idx + slidesCount - 1 ||
                        currentIndex == idx - slidesCount - 1
                    )
                        infiniteSingleStep = -1
                }

                if (infiniteSingleStep == 0) {
                    // jumping more than one slide
                    // OR jumping between first-last in loop mode
                    const totalSlidesSize =
                        slidePositions[slidesCount - 1].start +
                        slidePositions[slidesCount - 1].size
                    if (
                        !infinite &&
                        swipeMode == "step" &&
                        this.availableSize > totalSlidesSize
                    ) {
                        // prevent playing loop animation; all slides are visible at all times
                        this.autoSlide({ currentIndex: idx })
                    } else {
                        const autoswipe =
                            slidePositions[currentIndex].start -
                            slidePositions[idx].start
                        //const speed = Math.round(Math.abs(autoswipe) * 0.25)
                        const speed = 0
                        this.setState(
                            {
                                currentIndex: idx,
                                swiping: autoswipe,
                                isLooping: true,
                                offset: nextOffset
                            },
                            () => {
                                this.snapTimeout = setTimeout(() => {
                                    this.autoSlide(
                                        { swiping: 0, isLooping: false },
                                        speed
                                    )
                                }, 150)
                            }
                        )
                    }
                } else {
                    // only changing index by one slide
                    // BUT jumping between first/last item to facilitate infinite scroll
                    // postitive infiniteSingleStep value means going forwards
                    const autoSwipingItemId = idx < currentIndex ? idx - 1 : idx
                    const dist = slidePositions[autoSwipingItemId].size
                    const autoswipe = infiniteSingleStep == 1 ? dist : -dist
                    this.setState(
                        {
                            currentIndex: idx,
                            swiping: autoswipe,
                            offset: nextOffset
                        },
                        () => {
                            this.snapTimeout = setTimeout(() => {
                                this.autoSlide({ swiping: 0 })
                            }, 50)
                        }
                    )
                }
            }
        }
    }

    autoSlide(nextState, speed) {
        const { swipeMode } = this.props
        const { isLooping } = this.state
        let resetSpeed = false
        if (speed) {
            resetSpeed = this.autoSlideSpeed
            this.autoSlideSpeed = speed
        }
        // helper method to ensure trasition-duration is set during sliding
        // only intended for state changes to state.currentIndex or state.swiping
        this.setState({ autoSliding: true }, () => {
            // start autoslide sequence
            if (isLooping && !nextState.isLooping) {
                // await stopping isLooping by breaking it out in its own, delayed setState
                delete nextState.isLooping
                this.fadeTimeout = setTimeout(() => {
                    this.setState({ isLooping: false })
                }, 250)
            }

            // set the next state (perform the autoSlide)
            this.setState(nextState, () => {
                // stop autoSliding when the animations has completed
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

    calculateCarouselOffset(slideIndex) {
        const { slidePositions } = this.state
        const currentOffset = this.state.offset
        let offset = currentOffset

        // specialcase for step mode - we need to figure out if a translate offset is needed
        if (typeof slideIndex != "undefined") {
            // perform translate if there is no further items
            // translate by size of the item to dissapear from view
            const currentSlide = slidePositions[slideIndex]
            const nextSlide =
                slideIndex + 1 in slidePositions &&
                slidePositions[slideIndex + 1]
            const previousSlide =
                slideIndex - 1 in slidePositions &&
                slidePositions[slideIndex - 1]
            const finalSlide = slidePositions[slidePositions.length - 1]
            const currentEnd = this.availableSize - offset
            const totalSlidesSize = finalSlide.start + finalSlide.size

            if (this.availableSize >= totalSlidesSize) {
                // all slides are visible at all times
                offset = 0
            } else if (this.availableSize < currentSlide.size * 3) {
                // the carousel is not big enough to show prev + next. Just adjust offset to show current slide
                offset = currentSlide.start
            } else {
                // adjust offset so that pevious and next slide is allways visible
                if (!nextSlide) {
                    // we have reached the end of carousel
                    // set offset so that currentSlide is fully visible
                    offset =
                        currentSlide.start +
                        currentSlide.size -
                        this.availableSize
                } else {
                    if (!previousSlide) {
                        // we have reaced the beginning of carousel
                        // set offset so that currentSlide is fully visible
                        offset = 0
                    } else {
                        // we are in-between beginning/end
                        if (nextSlide.start + nextSlide.size > currentEnd) {
                            // next slide is out of view
                            offset =
                                nextSlide.start +
                                nextSlide.size -
                                this.availableSize
                        } else if (previousSlide.start < offset) {
                            // previous slide is out of view
                            offset = previousSlide.start
                        }
                    }
                }
            }
        }

        return offset
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
            isDragging: true,
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
        this.setState(
            { currentIndex: index, swiping: diff, isDragging: false },
            () => {
                if (snap) {
                    this.snapTimeout = setTimeout(() => {
                        this.autoSlide({ swiping: 0 })
                    }, 10)
                }
            }
        )
    }

    getTransform() {
        const { vertical, swipeMode, infinite } = this.props
        const {
            currentIndex,
            offset,
            fixedSlideSize,
            swiping,
            slidePositions,
            autoSliding,
            isLooping,
            isDragging
        } = this.state

        const style = {}
        if (isDragging) {
            style.transition = "none"
        } else if (autoSliding || isLooping) {
            style.transition = `transform ${this.autoSlideSpeed}ms, filter 150ms ease-out, -webkit-filter 150ms ease-out, opacity 150ms ease-out`
        }

        if (isLooping) {
            style.filter = "blur(1px)"
            style.WebkitFilter = "blur(1px)"
            style.opacity = 0
        } else {
            style.filter = "none"
            style.WebkitFilter = "none"
            style.opacity = 1
        }

        let pos = 0
        if (!infinite && swipeMode == "step") {
            // in this mode we dont change translate before next slide after/before currentIndex is the last fully visible one
            // this translate-value is set to state on this.autoSlide (setCurrentIndex allways calls that method) so we don't need to calcualte it here
            pos = offset + swiping
        } else {
            // translate so that currentIndex is allways the first visible slide
            if (fixedSlideSize) {
                pos = fixedSlideSize * currentIndex
            } else {
                pos =
                    (slidePositions[currentIndex] &&
                        slidePositions[currentIndex].start) ||
                    0
            }
            pos += swiping
        }

        const x = (!vertical && -pos) || 0
        const y = (vertical && -pos) || 0

        style.transform = `translate3d(${x}px, ${y}px, 0px)`
        return style
    }

    render() {
        const {
            className,
            slidesInView,
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
                    (controls
                        ? vertical
                            ? " carousel-container--with-vertical-controls"
                            : " carousel-container--with-controls "
                        : " ") +
                    (className ? className : "")
                }
            >
                {controls && (
                    <button
                        type="button"
                        className={
                            "carousel__control " +
                            (vertical
                                ? "carousel__control--up"
                                : "carousel__control--left")
                        }
                        onClick={this.prev}
                    >
                        Forrige
                    </button>
                )}

                <Swipeable
                    className="carousel-swipe-wrapper"
                    onSwipedLeft={
                        !vertical && swipeMode == "step"
                            ? this.onSwipedLeft
                            : null
                    }
                    onSwipedRight={
                        !vertical && swipeMode == "step"
                            ? this.onSwipedRight
                            : null
                    }
                    onSwipedUp={
                        vertical && swipeMode == "step"
                            ? this.onSwipedLeft
                            : null
                    }
                    onSwipedDown={
                        vertical && swipeMode == "step"
                            ? this.onSwipedRight
                            : null
                    }
                    onSwiping={swipeMode == "drag" ? this.onSwipeDrag : null}
                    onSwiped={swipeMode == "drag" ? this.onSwipeDragDone : null}
                    {...this.swipeConfig}
                >
                    <div
                        ref={this.setCarouselRef}
                        className={
                            "carousel" + (vertical ? " carousel--vertical" : "")
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
                        className={
                            "carousel__control " +
                            (vertical
                                ? "carousel__control--down"
                                : "carousel__control--right")
                        }
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
    slidesInView: "auto",
    swipeMode: "step",
    snap: true,
    loop: true,
    infinite: false,
    vertical: false,
    keyboard: false,
    controls: false,
    swipeConfig: {}
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
    slidesInView: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf(["auto"])
    ]).isRequired,
    swipeMode: PropTypes.oneOf(["drag", "step", "none"]).isRequired,
    keyboard: PropTypes.bool.isRequired,
    controls: PropTypes.bool.isRequired,
    swipeConfig: PropTypes.object.isRequired
}
