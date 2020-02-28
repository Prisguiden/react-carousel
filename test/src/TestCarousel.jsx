import React from "react"
import Carousel from "../../dist/Carousel.js"

export default class TestCarousel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            items: [
                { id: 1, content: "slide1" },
                { id: 2, content: "slide2" },
                { id: 3, content: "slide3" },
                { id: 4, content: "slide4" },
                { id: 5, content: "slide5" },
                { id: 6, content: "slide6" },
                { id: 7, content: "slide7" },
                { id: 8, content: "slide8" },
                { id: 9, content: "slide9" }
            ],
            reloading: false,
            slides: "auto",
            controls: true,
            loop: true,
            infinite: false,
            snap: false,
            vertical: false
        }
        this.isReloading = false
        this.reloadTimeout = null
        this.toggleBoolOption = this.toggleBoolOption.bind(this)
        this.renderToggle = this.renderToggle.bind(this)
        this.reloadCarousel = this.reloadCarousel.bind(this)
        this.runTest = this.runTest.bind(this)
    }

    componentDidUpdate(prevProps, prevState) {
        const { loop, infinite } = this.state
        if (
            !this.isReloading &&
            (loop !== prevState.loop || infinite !== prevState.infinite)
        ) {
            // loop & infinite props does not support "hotswapping" need to reload the Carousel
            console.log("reloading", this.isReloading)
            this.isReloading = true
            this.reloadCarousel()
        }
    }

    componentWillUnmount() {
        clearTimeout(this.reloadTimeout)
    }

    reloadCarousel() {
        console.log("we are reloading")
        this.setState({ reloading: true }, () => {
            this.reloadTimeout = setTimeout(() => {
                console.log("done reloading")
                this.setState({ reloading: false }, () => {
                    this.isReloading = false
                })
            }, 500)
        })
    }

    toggleBoolOption(optionName) {
        const optionCurrent = this.state[optionName]
        const newState = {}
        newState[optionName] = !optionCurrent
        this.setState(newState)
    }

    renderToggle(name) {
        const val = this.state[name]
        return (
            <div className="test__toggle">
                <input
                    type="checkbox"
                    defaultChecked={val}
                    onChange={e => {
                        this.toggleBoolOption(name)
                    }}
                />
                <label htmlFor={name}>{name}</label>
            </div>
        )
    }

    runTest() {
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
        const {
            items,
            reloading,
            slides,
            controls,
            loop,
            infinite,
            snap,
            vertical
        } = this.state

        return (
            <div className="test-carousel">
                <section className="test-carousel__actions">
                    {this.renderToggle("controls")}
                    {this.renderToggle("loop")}
                    {this.renderToggle("infinite")}
                    {this.renderToggle("snap")}
                    {this.renderToggle("vertical")}
                    <button onClick={this.runTest}>Test your func</button>
                </section>
                <section>
                    {reloading ? (
                        <p>Reloading...</p>
                    ) : (
                        <Carousel
                            slides={slides}
                            controls={controls}
                            loop={loop}
                            infinite={infinite}
                            snap={snap}
                            vertical={vertical}
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
                    )}
                </section>
            </div>
        )
    }
}
