# react-carousel
Wrap HTMLelements or React Components in me to make them into slides in a carousel

# Installation
```shell
npm install @prisguiden/react-carousel --save
```

# Usage

Add the needed carousel css/to your project

```scss

// my-styles.scss
@use 'carousel' with (
  $base-size: 14px,
  $primary-color: purple
);

```

...or just add the precompiled css to your DOM

```html
<!-- Copy /dist/carousel.css to your assets folder -->
<link rel="stylesheet" type="text/css" href="/my-assets/css/carousel.css" />
```

Create a React component and use Carousel as a wrapper

```jsx

import React from "react"
import Carousel from "@prisguiden/react-carousel"

function MyCarousel(props) {
    const settings = {
        snap: true,
        infinite: true,
        vertical: false,
        loop: true,
        slides: "auto",
        swipeMode: "drag",
        keyboard: false,
        controls: true
    }

    const items = [
                { name: "Item 1" },
                { name: "Item 2" },
                { name: "Item 3" },
                { name: "Item 4" },
                { name: "Item 5" }
          ]

    return(
           <Carousel {...settings >
               {items.map((item, index) => {
                   // note: carousel children can be both HTMLelements and React Components
                   return (
                           <div key={index}>
                               <h3>{item.name}</h3>
                           </div>
                           )
               })}
           </Carousel>

    )
}
```

## License

The MIT License (MIT)

Copyright (c) 2020 Geir Kristian Thunem, Prisguiden.no

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
