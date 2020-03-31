import React from "react"
import Carousel from "../../src/Carousel.jsx"

export default class TestCarousel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            // Shared props
            currentSlide: 0,
            items: [
                { id: 1, content: "slide1" },
                { id: 2, content: "slide2" },
                { id: 3, content: "slide3" },
                { id: 4, content: "slide4" },
                { id: 5, content: "slide5" },
                { id: 6, content: "slide6" },
                { id: 7, content: "slide7" },
                { id: 8, content: "slide8" },
                { id: 9, content: "slide9" },
                { id: 10, content: "slide10" },
                { id: 11, content: "slide11" }
            ],
            reloading: false,
            // Carousel states
            gallery: {
                controls: true,
                loop: true,
                infinite: true,
                snap: true,
                vertical: false,
                autoplay: false,
                swipeMode: "drag",
                keyboard: false
            },
            thumbs: {
                controls: true,
                loop: true,
                infinite: true,
                snap: true,
                vertical: false,
                autoplay: false,
                swipeMode: "drag",
                keyboard: false
            }
        }
        this.isReloading = false
        this.reloadTimeout = null
        this.toggleBoolOption = this.toggleBoolOption.bind(this)
        this.renderToggle = this.renderToggle.bind(this)
        this.reloadCarousel = this.reloadCarousel.bind(this)
        this.updateCurrentSlide = this.updateCurrentSlide.bind(this)
        this.addSlide = this.addSlide.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        const { loop, infinite } = this.state
        if (
            !this.isReloading &&
            (loop !== prevState.loop || infinite !== prevState.infinite)
        ) {
            // loop & infinite props does not support "hotswapping" need to reload the Carousel
            this.isReloading = true
            this.reloadCarousel()
        }
    }

    componentWillUnmount() {
        clearTimeout(this.reloadTimeout)
    }

    reloadCarousel() {
        this.setState({ reloading: true }, () => {
            this.reloadTimeout = setTimeout(() => {
                this.setState({ reloading: false }, () => {
                    this.isReloading = false
                })
            }, 500)
        })
    }

    updateCurrentSlide(index) {
        this.setState({ currentSlide: index })
    }

    toggleBoolOption(carousel, optionName) {
        const optionCurrent = this.state[carousel][optionName]
        const newState = {
            [carousel]: {
                ...this.state[carousel],
                [optionName]: !optionCurrent
            }
        }
        this.setState(newState)
    }

    renderToggle(carousel, name) {
        const val = this.state[carousel][name]
        return (
            <div className="test__toggle">
                <input
                    type="checkbox"
                    defaultChecked={val}
                    onChange={e => {
                        this.toggleBoolOption(carousel, name)
                    }}
                />
                <label htmlFor={name}>{name}</label>
            </div>
        )
    }

    addSlide() {
        const someNumber = Math.round(Math.random() * 100)
        const newSlides = [...this.state.items]
        newSlides.splice(0, 1)
        this.setState({
            items: [
                { id: someNumber, content: "new slide" + someNumber },
                ...newSlides
            ]
        })
    }

    render() {
        const { gallery, thumbs, currentSlide, items, reloading } = this.state

        return (
            <div className="test-carousel">
                <h2>TestCarousel</h2>
                <div className={"test-carousel__settings"}>
                    <section className="test-carousel__actions">
                        <h3>Gallery</h3>
                        {this.renderToggle("gallery", "controls")}
                        {this.renderToggle("gallery", "loop")}
                        {this.renderToggle("gallery", "infinite")}
                        {this.renderToggle("gallery", "snap")}
                        {this.renderToggle("gallery", "vertical")}
                        {this.renderToggle("gallery", "autoplay")}
                        {this.renderToggle("gallery", "keyboard")}
                    </section>
                    <section className="test-carousel__actions">
                        <h3>Thumbs</h3>
                        {this.renderToggle("thumbs", "controls")}
                        {this.renderToggle("thumbs", "loop")}
                        {this.renderToggle("thumbs", "infinite")}
                        {this.renderToggle("thumbs", "snap")}
                        {this.renderToggle("thumbs", "vertical")}
                        {this.renderToggle("thumbs", "autoplay")}
                        {this.renderToggle("thumbs", "keyboard")}
                    </section>
                    <section className="test-carousel__actions">
                        <h3>Utils</h3>
                        <button onClick={this.addSlide}>Add slide</button>
                        <button onClick={this.reloadCarousel}>Reload</button>
                    </section>
                </div>
                <section className="test-carousel__carousel">
                    {reloading ? (
                        <p>Reloading...</p>
                    ) : (
                        <>
                            <div className="main">
                                <Carousel
                                    slidesInView="auto"
                                    controls={gallery.controls}
                                    keyboard={gallery.keyboard}
                                    loop={gallery.loop}
                                    infinite={gallery.infinite}
                                    snap={gallery.snap}
                                    vertical={gallery.vertical}
                                    currentIndex={currentSlide}
                                    onChangeIndex={this.updateCurrentSlide}
                                    swipeMode={gallery.swipeMode}
                                    autoplay={gallery.autoplay}
                                >
                                    {items.map((slide, index) => {
                                        return (
                                            <div
                                                className="test-carousel__slide"
                                                key={slide.id}
                                            >
                                                {slide.content}
                                            </div>
                                        )
                                    })}
                                </Carousel>
                            </div>
                            <div className="thumbs">
                                <Carousel
                                    autoplay={thumbs.autoplay}
                                    keyboard={thumbs.keyboard}
                                    slidesInView="auto"
                                    controls={thumbs.controls}
                                    loop={thumbs.loop}
                                    infinite={thumbs.infinite}
                                    snap={thumbs.snap}
                                    vertical={thumbs.vertical}
                                    swipeMode={thumbs.swipeMode}
                                    currentIndex={currentSlide}
                                    onChangeIndex={this.updateCurrentSlide}
                                    onSelect={this.updateCurrentSlide}
                                >
                                    {items.map((slide, index) => {
                                        return (
                                            <div
                                                className="test-carousel__slide"
                                                key={slide.id}
                                            >
                                                {slide.content}
                                            </div>
                                        )
                                    })}
                                </Carousel>
                            </div>
                        </>
                    )}
                </section>
            </div>
        )
    }
}
