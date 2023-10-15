const Shortlink = Hawkejs.Model.getClass('Shortlink');

/**
 * Get the short url for a QR code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
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

	return result;
});