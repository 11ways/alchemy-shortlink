## 0.2.4 (2023-10-19)

* Add "Toggle background" button to the `ql-qr-code` context menu

## 0.2.3 (2023-10-18)

* Add custom download options to the `al-qr-code` element

## 0.2.2 (2023-10-16)

* Add `ShortlinkApiKey` model, so each user can have their own API keys

## 0.2.1 (2023-10-15)

* Move routes to separate `routes.js` file, so they load in the correct order
* QR-codes will now link to `/qr/{shortcode}`, so we can track QR-code usages
* Add statistics to view page + overview on dashboard

## 0.2.0 (2023-01-24)

* Add QR-code view of shortlinks
* Add a link creator page & a view page
* Also host files
* Add basic paste handler
* Sort shortlink models by _id descending

## 0.1.1 (2023-01-19)

* Add catchall route, which now allows the use of slashes in shortcodes
* Allow looking by empty shortcodes

## 0.1.0 (2020-10-22)

* Initial release