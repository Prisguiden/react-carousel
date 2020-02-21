import React from "react"
import Carousel from "@prisguiden/react-carousel"

export default class ControlledCarousels extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            inSync: true,
            currentIndex: 0,
            slides: [
                { name: "Slide 1" },
                { name: "Slide 2" },
                { name: "Slide 3" },
                { name: "Slide 4" },
                { name: "Slide 5" }
            ]
        }
        this.updateIndex = this.updateIndex.bind(this)
        this.addSlide = this.addSlide.bind(this)
    }

    updateIndex(idx) {
        this.setState({ currentIndex: idx })
    }

    addSlide() {
        const number = Math.round(Math.random() * 100)
        const newSlides = [
            { name: "SuperSlide " + number },
            ...this.state.slides
        ]
        this.setState({ slides: newSlides })
    }

    toggleSync() {
        this.setState({ sync: !this.state.sync })
    }

    componentDidMount() {}

    render() {
        const { inSync, currentIndex, slides } = this.state

        // note: slide styles are just an example - feel free to use regular css
        const bigSlide = { width: "100px" }
        const smallSlide = { width: "50px" }

        return (
            <article className="example__app">
                <section>
                    <button onClick={this.addSlide}>Add slide</button>
                    <button onClick={this.toggleSync}>
                        {(inSync ? "Stop" : "Start") + "sync"}
                    </button>
                </section>
                <section>
                    <Carousel
                        currentIndex={inSync ? currentIndex : null}
                        onChangeIndex={inSync ? this.updateIndex : null}
                    >
                        {slides.map((slide, index) => {
                            return (
                                <div key={index} style={bigSlide}>
                                    {slide.name}
                                </div>
                            )
                        })}
                    </Carousel>
                </section>

                <section>
                    <Carousel
                        currentIndex={inSync ? currentIndex : null}
                        onChangeIndex={inSync ? this.updateIndex : null}
                    >
                        {slides.map((slide, index) => {
                            return (
                                <div key={index} style={smallSlide}>
                                    {slide.name}
                                </div>
                            )
                        })}
                    </Carousel>
                </section>
            </article>
        )
    }
}
