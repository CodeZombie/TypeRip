# TypeRip
The Adobe Font ripper.
## [Get It Here](http://codezombie.github.io/TypeRip/)

### How to use it
  1. Enter an Adobe Fonts [font family](https://fonts.adobe.com/fonts) or [font collection](https://fonts.adobe.com/collections) URL into the address bar, then press enter.
  2. Browse the available fonts under this family, using the download button to save them to your machine.
  3. That's it.

### Terms
* Do not use any downloaded fonts for anything other than testing purposes. Think of it like a try-before-you-buy system. This tool merely saves a copy of what Adobe makes publicly available through their website, but this does not give you the legal right to use the fonts as if you have purchased a license. If you want to publish any work using these fonts, you _must_ purchase a license through adobe.

### Whats new?

May 5, 2021:
* Typerip can now rip the entire available character set from any font. Big thanks to everyone that reported bugs and collected information on this issue.
* Added the option to download fonts without processing. This is useful if your download hangs and/or crashes your browser. Downloading the fonts without processing will always work, but you will have to edit the fonts manually to change their names and ensure compatibility with your OS.

May 3, 2021:
* Added the ability to read font collection URLs and download their contents as you would with a font family.
* Added a "Download All" button to font families and collections, downloading a single zip of all the contents of the font pack.
* Fonts now download as a ZIP archive.
* Switched to a more consistent CORS proxy.

March 22, 2020:
* Cosmetic fixes
* Removed all references to "TypeKit", as Adobe has renamed the service to "Adobe Fonts"

March 9, 2020:
* Fixed a bug in OpenType.js that would fail to re-encode some fonts.

Oct 21, 2019:
* Rewrote entire application from scratch
* New, cleaner and simpler user interface
* Fonts are automatically repaired and renamed correctly

### Screenshot
![Screenshot #1](https://i.imgur.com/5cyZTJ4.png)

### License
typerip.js is released under the WTFPL (http://www.wtfpl.net/)
