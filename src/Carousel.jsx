import React from "react"
import PropTypes from "prop-types"
import { Swipeable } from "react-swipeable"
import CarouselSlide from "./CarouselSlide"

const defaultState = {
    swiping: 0, // swipes by user
    offset: 0, // current computed offset to display currentIndex in view
    currentIndex: 0, // currently active slide index
    availableSize: null, // carousel container size
    autoSliding: false, // controls transition-delay
    clones: null, // children is converted into clones then displayed as slides
    clonePositions: [], // dataset of each clones relative start-position and size
    isLooping: false, // controls fadeout
    isDragging: false // when user is interacting; disables transition-delay
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

        this.carouselRef = null // carousel element reference
        this.slideRefs = [] // slide (children) element references
        this.resizeObserver = null // event listener on carousel container
        this.autoSlideSpeed = 300 // ms - this may change, depending isLooping & autoSliding states
        this.snapTimeout = null // make shure all parameters from snapping is set before running transitions
        this.transitionTimeout = null // to disable transition-duration (css prop) after autoSlideSpeed

        // init/setup functions
        this.setCarouselRef = this.setCarouselRef.bind(this)
        this.setSlideRef = this.setSlideRef.bind(this)
        this.getTransform = this.getTransform.bind(this)
        this.calculateCarouselOffset = this.calculateCarouselOffset.bind(this)

        // main function for updating internal currentIndex state
        // this is used in componentDidUpdate + usage methods
        this.changeCurrentIndex = this.changeCurrentIndex.bind(this)

        // methods for usage
        this.prev = this.prev.bind(this)
        this.next = this.next.bind(this)
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
        const {
            keyboard,
            slidesInView,
            vertical,
            infinite,
            swipeMode
        } = this.props
        if (keyboard) {
            document.addEventListener("keydown", this.handleKeyboard)
        }

        // Add resizeObserver and recalculate slide sizes if slidesInView != auto
        if (window.ResizeObserver) {
            this.resizeObserver = new window.ResizeObserver(
                (entries, observer) => {
                    for (let entry of entries) {
                        const size = vertical
                            ? entry.contentRect.height
                            : entry.contentRect.width
                        if (size != this.availableSize) {
                            this.availableSize = size
                            this.computeClonePositions()
                            if (!infinite && swipeMode == "step") {
                                // in this mode this.getTransform needs state.offset instead of state.currentIndex
                                this.setState({
                                    offset: this.calculateCarouselOffset(
                                        this.state.currentIndex
                                    )
                                })
                            }
                        }
                    }
                }
            )
            this.resizeObserver.observe(this.carouselRef)
        }
    }

    componentWillUnmount() {
        // kill timeouts, eventlisteners and observers
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
        const { onChangeIndex, children } = this.props
        const { clones } = this.state
        var oldKeys = JSON.stringify(prevProps.children.map(child => child.key))
        var newKeys = JSON.stringify(children.map(child => child.key))

        if (
            clones &&
            prevProps.children.length &&
            (prevProps.children.length != children.length ||
                oldKeys !== newKeys)
        ) {
            // A slide has been added,removed or moved

            // HARD REBOOT EVERYTING
            // note: removing clones will trigger re-creation & -calculation
            this.slideRefs = []
            this.setState({ ...defaultState })
        }

        if (typeof onChangeIndex == "function") {
            // the carousels currentIndex is tracked/controlled by an ancestor.
            const { infinite } = this.props
            const propsIndex = this.props.currentIndex // current index provided by ancestor
            const stateIndex = this.state.currentIndex // current index in our records - this should be +children.length higher when infinite
            const realStateIndex = this.state.currentIndex % children.length // current index adjusted to match ancestors range

            if (
                typeof propsIndex != "undefined" &&
                prevProps.currentIndex != propsIndex &&
                propsIndex != realStateIndex
            ) {
                // parent changed index in props but our state is not equal
                this.changeCurrentIndex(propsIndex)
            }

            if (
                stateIndex != prevState.currentIndex &&
                propsIndex != realStateIndex
            ) {
                // this component changed current slide - update the parent
                onChangeIndex(realStateIndex)
            }
        }
    }

    // REACT ELEMENT REFERENCE CALLBACKS
    setCarouselRef(element) {
        if (element) {
            const { vertical, children } = this.props
            const containerSize = element.getBoundingClientRect()
            this.availableSize = vertical
                ? containerSize.height
                : containerSize.width
            this.carouselRef = element

            element.addEventListener("dragstart", e => {
                if (e.target.nodeName === "A") {
                    e.preventDefault()
                }
            })
        }
    }

    setSlideRef(element, index) {
        const { children } = this.props
        const { clones, clonePositions } = this.state
        // set the ref
        if (element) {
            this.slideRefs[index] = {
                index: index,
                element: element
            }

            // set up stuff when the final ref is set
            if (!clones && index == children.length - 1) {
                // generate clones - this is done only once per init/reset
                // this will trigger a new render and a new setSlideRef cycle
                this.createClones()
            }

            if (
                clones &&
                !clonePositions.length &&
                index == clones.length - 1
            ) {
                // compute each slide-clone start & size
                this.computeClonePositions()
            }
        }
    }

    // INIT FUNCTIONS TO CALCULATE SLIDE SIZES AND SETTING UP ENV

    // carousel allways displays clones instead of children when it is done setting up
    createClones() {
        const { infinite, children } = this.props
        const { currentIndex } = this.state

        const clones = []
        let newCurrentIndex = currentIndex
        if (infinite) {
            // loop over slideRefs 3 times
            // this way we have extra clones covering both directions of slider
            let nextIdx = 0
            for (let i = 1; i <= 3; i++) {
                children.forEach((slide, index) => {
                    clones[nextIdx] = React.cloneElement(slide)
                    nextIdx += 1
                })
            }

            // set current index to first item of duplicates
            newCurrentIndex += this.slideRefs.length
        } else {
            children.forEach((slide, index) => {
                clones[index] = React.cloneElement(slide)
            })
        }
        this.setState({ clones: clones, currentIndex: newCurrentIndex })
    }

    // use element references to calculate each clones start + size
    // note: this could not calculate when running setSlideRef because we did not have this.availableWidth
    computeClonePositions() {
        const { slidesInView, infinite, vertical } = this.props
        const { clones } = this.state

        let fixedSlideSize = null
        if (typeof slidesInView === "object" && slidesInView != null) {
            // carousel is operating with dynamic set of boundaries for slidesInView.
            // figure out how many slides to show for currently availableSize in container
            let bestBoundsMatch = null
            let slidesForCurrentView = 1 // fallback to one slide
            for (const bounds in slidesInView) {
                if (bounds < this.availableSize) {
                    // current caousel size is big enough to use these bounds
                    if (!bestBoundsMatch) {
                        // first bounds below current carousel size
                        bestBoundsMatch = bounds
                        slidesForCurrentView = slidesInView[bounds]
                    } else if (bounds > bestBoundsMatch) {
                        // current bounds are bigger than found before
                        bestBoundsMatch = bounds
                        slidesForCurrentView = slidesInView[bounds]
                    }
                }
            }
            fixedSlideSize = Math.floor(
                this.availableSize / slidesForCurrentView
            )
        } else if (slidesInView != "auto") {
            // carousel has a staic number of slides at all times
            fixedSlideSize = Math.floor(this.availableSize / slidesInView)
        }

        // apply size + start to each clone
        let clonePositions = []
        if (fixedSlideSize) {
            // all slides have the same size
            clonePositions = clones.map((clone, index) => {
                return {
                    index: index,
                    size: fixedSlideSize,
                    start: fixedSlideSize * index
                }
            })
        } else {
            // slidesInView == "auto"
            // each slide can have unique size
            // calculate each size + start based on slideRef.element computed width/heigth in DOM
            let prev = null
            clonePositions = clones.map((clone, index) => {
                const element = this.slideRefs[index % this.slideRefs.length]
                    .element
                const slideSizes = element.getBoundingClientRect()
                const result = {
                    index: index,
                    size: vertical ? slideSizes.height : slideSizes.width,
                    start: prev ? prev.start + prev.size : 0
                }
                prev = result
                return result
            })
        }
        this.setState({ clonePositions: clonePositions })
    }

    changeCurrentIndex(index) {
        // THIS METHOD IS CALLED
        // * ON PREV/NEXT
        // * WHENEVER A CONTROLLED COMPONENT GETS NEW INDEX FROM PARENT

        const { infinite, loop, children, swipeMode } = this.props
        const { currentIndex, clonePositions } = this.state
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

        // specialcase when props [ !inifinte && swipeMode == "step" ]
        // these carousels use this state.offset instead of currentIndex in this.getTransform()
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

                // TODO: Improve this algorithm to allow regular autosliding for several steps when the distance is short
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
                        clonePositions[clonePositions.length - 1].start +
                        clonePositions[clonePositions.length - 1].size
                    if (
                        !infinite &&
                        swipeMode == "step" &&
                        this.availableSize > totalSlidesSize
                    ) {
                        // prevent playing loop animation; all slides are visible at all times
                        this.autoSlide({ currentIndex: idx })
                    } else {
                        const autoswipe =
                            clonePositions[currentIndex].start -
                            clonePositions[idx].start
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
                    const dist = clonePositions[autoSwipingItemId].size
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
        const { clonePositions } = this.state
        const currentOffset = this.state.offset
        let offset = currentOffset

        // specialcase for step mode - we need to figure out if a translate offset is needed
        if (typeof slideIndex != "undefined") {
            // perform translate if there is no further items
            // translate by size of the item to dissapear from view
            const currentSlide = clonePositions[slideIndex]
            const nextSlide =
                slideIndex + 1 in clonePositions &&
                clonePositions[slideIndex + 1]
            const previousSlide =
                slideIndex - 1 in clonePositions &&
                clonePositions[slideIndex - 1]
            const finalSlide = clonePositions[clonePositions.length - 1]
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
        const { currentIndex } = this.state
        if (currentIndex > 0) {
            this.changeCurrentIndex(currentIndex - 1)
        } else {
            if (loop) this.changeCurrentIndex(children.length - 1)
        }
    }

    next() {
        const { children, loop } = this.props
        const { currentIndex, clonePositions } = this.state
        if (currentIndex < clonePositions.length - 1) {
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
            }
        } else {
            event.preventDefault()
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

        const { infinite, snap, lazySwipe, vertical } = this.props
        const { swiping, currentIndex, clonePositions } = this.state
        const pos = clonePositions[currentIndex].start + swiping
        let closestItem = clonePositions.reduce((prev, curr) => {
            return Math.abs(curr.start - pos) < Math.abs(prev.start - pos)
                ? curr
                : prev
        })

        if (snap && lazySwipe && closestItem.index == currentIndex) {
            // allow lazy users to trigger prev/next even if they swiped just a minimum distance
            let modifier = 0
            if (vertical) {
                if (eventData.dir == "Down") modifier = 1
                if (eventData.dir == "Up") modifier = -1
            } else {
                if (eventData.dir == "Left") modifier = 1
                if (eventData.dir == "Right") modifier = -1
            }

            closestItem = clonePositions[currentIndex + modifier]
                ? clonePositions[currentIndex + modifier]
                : clonePositions[currentIndex]
        }
        let index = closestItem.index
        const diff = -(closestItem.start - pos)

        if (infinite) {
            // adjust currentIndex to same slide in the mid-segment of clonePositions
            const slidesCount = clonePositions.length / 3
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
            swiping,
            autoSliding,
            isLooping,
            isDragging,
            clonePositions
        } = this.state

        const style = {}

        if (clonePositions.length) {
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
                pos =
                    (clonePositions[currentIndex] &&
                        clonePositions[currentIndex].start) ||
                    0
                pos += swiping
            }

            const x = (!vertical && -pos) || 0
            const y = (vertical && -pos) || 0

            style.transform = `translate3d(${x}px, ${y}px, 0px)`
        }
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
            swiping,
            clones,
            clonePositions,
            autoSliding
        } = this.state
        const transformStyle = this.getTransform()
        const slideHeight =
            vertical && slidesInView != "auto" && clonePositions.length
                ? clonePositions[0].size
                : null
        const slideWidth =
            !vertical && slidesInView != "auto" && clonePositions.length
                ? clonePositions[0].size
                : null

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
                                        itemRef={this.setSlideRef}
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
                                        itemRef={this.setSlideRef}
                                        isCurrent={index == currentIndex}
                                        onClick={e =>
                                            this.handleSelect(index, e)
                                        }
                                        width={slideWidth}
                                        height={slideHeight}
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
    lazySwipe: true,
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
    lazySwipe: PropTypes.bool.isRequired,
    snap: PropTypes.bool,
    infinite: PropTypes.bool,
    loop: PropTypes.bool.isRequired,
    slidesInView: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.number,
        PropTypes.oneOf(["auto"])
    ]).isRequired,
    swipeMode: PropTypes.oneOf(["drag", "step", "none"]).isRequired,
    keyboard: PropTypes.bool.isRequired,
    controls: PropTypes.bool.isRequired,
    swipeConfig: PropTypes.object.isRequired
}
