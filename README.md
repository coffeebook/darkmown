# Darkmown is a CoffeeScript port of Markdown

I forked Darkmown initially because of three reasons:

1. I wanted to have Creole syntax for writing emphasised (italic) texts using `//italic texts//`
1. I was exploring Markdown/Wiki languages to support a literate programming endavour.
1. And this project was written using CoffeeScript so it made a good choice

## History

### 2013

Mar 03: Added Creole syntax for writing emphasis as `//italic texts go here//`.
        Updated references from upstream repository to this local fork.


## Features
- Normalized titles (it only supports # to create titles from `<h1>` to `<h6>`)
- Auto-link urls (it supports Markdown syntax too)
- Auto-link emails (same for links, just type an email and it will automatically linked)
- Format paragraphs the same way you write, it automatically insert line breakes
- more to come...

## Demo

See a [Live Demo](http://coffeebook.github.com/darkmown/)

## License

(The MIT License)

Copyright (c) 2012 Denis Ciccale [@tdecs](http://twitter.com/tdecs)

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions of
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
