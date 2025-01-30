# Sandstone

[<img src="https://upload.wikimedia.org/wikipedia/commons/a/af/USDA_Mineral_Sandstone_93c3955.jpg?20050520171627" height="128px">](https://commons.wikimedia.org/wiki/File:USDA_Mineral_Sandstone_93c3955.jpg)

Sandstone is an experimental web proxy utilizing sandboxed iframes and no service worker.

## Features
- Every proxied page runs in a sandboxed iframe
- Can be used from an HTML file or as a data URL
- Does not use service workers
- Uses [libcurl.js](https://www.npmjs.com/package/libcurl.js) and [Wisp](https://github.com/MercuryWorkshop/wisp-protocol) for end-to-end encryption

## Site Support
- [Discord](https://discord.com/app)
  - The login page does work, but not the captcha
  - Works in v0.1.1 but not v0.2.0
- [v86](https://copy.sh/v86/)
- [Minecraft Classic](https://classic.minecraft.net/)
- Youtube embeds
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
- Anchor tags 
- HTML redirects
- HTML forms

### Notable Unimplemented Features
- Cookies
- ES6 modules

## Usage
### Building
1. Clone this repository and cd into it.
2. Run `npm i` to install the dependencies.
3. Run `npm run build:prod` to bundle the client JS. You may also use `npm run dev`.

### Running the Example Frontend
1. Cd into the `example` subdirectory
2. Run `npm i` to install the server dependencies
3. Run `npm run start` which will start the web server

## License
```
ading2210/sandstone - A web proxy using sandboxed iframes 
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