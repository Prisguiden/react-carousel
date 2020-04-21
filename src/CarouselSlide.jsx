import React from "react"
import PropTypes from "prop-types"

export default class CarouselSlide extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const {
            children,
            onClick,
            isCurrent,
            itemRef,
            index,
            width,
            height,
        } = this.props
        const style = {}
        if (width) style.width = width
        if (height) style.height = height

        return (
            <div
                style={style}
                ref={
                    (itemRef && ((element) => itemRef(element, index))) || null
                }
                className={
                    "carousel__slide" +
                    (isCurrent ? " carousel__slide--current" : "")
                }
                onClick={onClick}
            >
                {children}
            </div>
        )
    }
}

CarouselSlide.propTypes = {
    index: PropTypes.number,
    isCurrent: PropTypes.bool,
    onClick: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
    itemRef: PropTypes.func,
}
