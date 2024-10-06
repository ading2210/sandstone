# Experimental Web Proxy

This is an experimental web proxy utilizing sandboxed iframes and no service worker.

## Features
- Every proxied page runs in a sandboxed iframe
- Can be used from an HTML file or as a data URL
- Does not use service workers
- Does not use JS rewriting
- Only client dependency is [libcurl.js](https://www.npmjs.com/package/libcurl.js)

## Site Support
- Discord
  - The login page does work, but not the captcha
- Most static sites

## Status
This is at a very early stage of development and lacks support for most web APIs. 

### Working Features
- Fetch API
- Basic javascript
- Local storage
- Web workers
- XMLHttpRequest
- Media elements such as `<img>`
- CSS rewriting
- Anchor tags (mostly)
- HTML redirects

### Notable Unimplemented Features
- HTML forms
- Cookies
- ES6 modules

## License
```
ading2210/newproxy - A web proxy using sandboxed iframes 
Copyright (C) 2024 ading2210

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```