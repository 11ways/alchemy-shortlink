const Shortlink = Hawkejs.Model.getClass('Shortlink');

/**
 * Get the short url for a QR code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.5
 *
 * @return   {String}
 */
Shortlink.setDocumentProperty(function qr_short_url() {

	let result;

	if (Blast.isBrowser) {
		result = hawkejs.exposed('shortlink_base');
	} else {
		result = alchemy.plugins.shortlink.base_url;
	}

	if (!result || typeof result != 'string') {
		return this.short_url;
	}

	if (!result.endsWith('/')) {
		result += '/';
	}

	result += 'qr/' + this.short_code;

	let url = RURL.parse(result);

	return url.href;
});

/**
 * Get the filename for a QR code image
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.3
 *
 * @return   {String}
 */
Shortlink.setDocumentProperty(function qr_filename() {

	let code = this.short_code;

	if (!code) {
		code = this._id;
	}

	code = String(code).slug();

	return 'qr_' + code;
});
