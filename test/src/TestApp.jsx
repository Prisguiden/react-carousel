import React, { Component } from "react"
import ReactDOM from "react-dom"
import TestCarousel from "./TestCarousel.jsx"
import "../../src/carousel.scss"
export default class TestApp extends Component {
    constructor(props) {
        super(props)

        this.state = {
            value: ""
        }
    }

    render() {
        return (
            <article>
                <header>Test/Debug page for @prisguiden/react-app</header>
                <section>
                    <header>
                        <h2>TestCarousel</h2>
                    </header>
                    <TestCarousel />
                </section>
            </article>
        )
    }
}

const appContainer = document.getElementById("test-app")
appContainer ? ReactDOM.render(<TestApp />, appContainer) : false
