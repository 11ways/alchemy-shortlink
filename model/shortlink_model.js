let generator;

/**
 * Shortlink model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const Shortlink = Function.inherits('Alchemy.Model', function Shortlink(options) {
	Shortlink.super.call(this, options);
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.constitute(function addFields() {

	// The hashcode of the long url (this is not unique)
	this.addField('long_url_hash', 'Number');

	// The hashcode of the short code (this is not unique)
	this.addField('short_code_hash', 'Number');

	// The long url
	this.addField('long_url', 'String');

	// The short url
	this.addField('short_url', 'String', {unique: true});

	// The generated id part of the url
	this.addField('short_code', 'String', {unique: true});

	// The user this belongs to (if any)
	this.belongsTo('User');

	// The IP address that created this
	this.addField('ip', 'String');
});

/**
 * Set codes before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function beforeSave(document, options, next) {

	if (document.long_url) {
		document.long_url_hash = document.long_url.numberHash();
	} else {
		document.long_url_hash = null;
	}

	if (document.short_code) {
		document.short_code_hash = document.short_code.numberHash();
	} else {
		document.short_code_hash = null;
	}

	next();
});

/**
 * Get the nanoid generator
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function getNanoidGenerator() {

	if (!generator) {
		generator = Crypto.createNanoidGenerator('acdefhjkmnprtwxyz34679', 6);
	}

	return generator;
});

/**
 * Generate a nanoid
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function generateNanoid(size) {
	return this.getNanoidGenerator()(size);
});

/**
 * Look for a shortlink document with the given shortcode
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   short_code
 *
 * @return   {Document.Shortlink}
 */
Shortlink.setMethod(async function findByShortcode(short_code) {

	if (!short_code) {
		throw new Error('Failed to look for a shortlink document, no shortcode was given');
	}

	short_code = short_code.toLowerCase();

	return this.findByValues({
		short_code_hash : short_code.numberHash(),
		short_code      : short_code
	});
});

/**
 * Create a new short url
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   options
 *
 * @return   {Document.Shortlink}
 */
Shortlink.setMethod(async function createShortUrl(options) {

	let long_url = options.long_url,
	    short_code = options.short_code;

	if (!long_url) {
		throw new Error('Unable to create a short url without a long url');
	}

	if (!RURL.isUrl(long_url)) {
		throw new Error('The given long url does not seem to be valid');
	}

	// If a short_code is given, make sure it doesn't already exist
	if (short_code) {
		short_code = short_code.toLowerCase();

		let record = await this.findByShortcode(short_code);

		if (record) {

			if (record.long_url == long_url) {
				return record;
			}

			throw new Error('Unable to create a shorturl with keyword "' + short_code + '", it already exists');
		}
	} else {

		let record;

		do {
			// Generate a new short_code
			short_code = this.generateNanoid();

			// See if it exists
			record = await this.findByShortcode(short_code);
		} while (record);
	}

	let doc = this.createDocument();
	doc.long_url = long_url;
	doc.short_code = short_code;

	let short_url = RURL.parse('/' + short_code, alchemy.plugins.shortlink.base_url);

	doc.short_url = String(short_url);

	if (options.user_id) {
		doc.user_id = options.user_id;
	}

	if (options.ip) {
		doc.ip = options.ip;
	}

	await doc.save();

	return doc;
});

/**
 * Register a hit
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Conduit}   conduit
 *
 * @return   {Document.ShortlinkHit}
 */
Shortlink.setDocumentMethod(function registerHit(conduit) {

	let ShortlinkHit = this.getModel('ShortlinkHit'),
	    doc = ShortlinkHit.createDocument();

	doc.shortlink_id = this.$pk;
	doc.ip = conduit.ip;
	doc.user_agent = conduit.headers['user-agent'];
	doc.referrer = conduit.headers.referer || conduit.headers.referrer;

	doc.save();

	return doc;
});