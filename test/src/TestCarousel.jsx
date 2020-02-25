import React from "react"
import Carousel from "../../dist/Carousel.js"

export default class TestCarousel extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            reloading: false,
            slides: "auto",
            controls: false,
            loop: false,
            infinite: false,
            snap: false,
            vertical: false
        }
        this.isReloading = false
        this.reloadTimeout = null
        this.toggleBoolOption = this.toggleBoolOption.bind(this)
        this.renderToggle = this.renderToggle.bind(this)
        this.reloadCarousel = this.reloadCarousel.bind(this)
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
                    value={val}
                    onChange={e => {
                        this.toggleBoolOption(name)
                    }}
                />
                <label htmlFor={name}>{name}</label>
            </div>
        )
    }

    render() {
        const {
            reloading,
            slides,
            controls,
            loop,
            infinite,
            snap,
            vertical
        } = this.state
        const items = ["slide1", "slide2", "slide3", "slide4", "slide5"]

        return (
            <div className="test-carousel">
                <section className="test-carousel__actions">
                    {this.renderToggle("controls")}
                    {this.renderToggle("loop")}
                    {this.renderToggle("infinite")}
                    {this.renderToggle("snap")}
                    {this.renderToggle("vertical")}
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
                                        key={index}
                                    >
                                        {slide}
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
