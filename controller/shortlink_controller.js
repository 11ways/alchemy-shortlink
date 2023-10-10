/**
 * The Shortlink Controller class
 *
 * @constructor
 * @extends       {Alchemy.Controller}
 *
 * @author        Jelle De Loecker   <jelle@elevenways.be>
 * @since         0.1.0
 * @version       0.1.0
 */
const Shortlink = Function.inherits('Alchemy.Controller', 'Shortlink');

/**
 * Create a new shortlink
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.1
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setAction(async function create(conduit) {

	if (alchemy.plugins.shortlink.api_key) {
		let api_key = conduit.headers.api_key;

		if (alchemy.plugins.shortlink.api_key != api_key) {
			return conduit.end({
				message : 'API key does not match!'
			});
		}
	}

	let shortlink = this.getModel('Shortlink');

	let long_url = conduit.param('long_url') || conduit.param('longurl'),
	    short_code = conduit.param('shortcode') || conduit.param('short_code'),
	    document,
	    user_id = conduit.headers.user_id;

	try {
		document = await shortlink.createShortUrl({
			long_url   : long_url,
			short_code : short_code,
			user_id    : user_id
		});
	} catch (err) {
		console.log('ERR:', err)
		return conduit.end({
			message : err.message
		});
	}

	let response = {
		shorturl : document.short_url,
	};

	conduit.end(response);
});

/**
 * Redirect a QR code scan
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    short_code
 */
Shortlink.setAction(async function redirectQr(conduit, short_code) {

	let shortlink = this.getModel('Shortlink');
	let document = await shortlink.findByShortcode(short_code);

	this.handleShortlink(conduit, document, true);
});

/**
 * Redirect the user
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    short_code
 */
Shortlink.setAction(async function redirect(conduit, short_code) {

	let shortlink = this.getModel('Shortlink');

	let document = await shortlink.findByShortcode(short_code);

	this.handleShortlink(conduit, document, false);
});

/**
 * Catchall
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.1
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    path
 */
Shortlink.setAction(async function catchAll(conduit, path) {

	let shortlink = this.getModel('Shortlink');

	let document = await shortlink.findByShortcode(path);

	this.handleShortlink(conduit, document, false);
});

/**
 * Catchall for QR links
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 * @param    {String}    path
 */
Shortlink.setAction(async function catchAllQr(conduit, path) {

	let shortlink = this.getModel('Shortlink');

	let document = await shortlink.findByShortcode(path);

	this.handleShortlink(conduit, document, true);
});

/**
 * Handle the found document
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 * @param    {Shortlink} shortlink
 * @param    {Boolean}   from_qr
 */
Shortlink.setMethod(async function handleShortlink(conduit, shortlink, from_qr) {

	if (!shortlink) {
		return conduit.notFound();
	}

	let long_url = shortlink.long_url,
	    file_id = shortlink.file;

	if (!long_url && !file_id) {
		return conduit.notFound();
	}

	let view_type = conduit.param('view_type');

	if (view_type == 'qr') {
		this.set('qr', alchemy.plugins.shortlink?.qr);
		this.set('shortlink', shortlink);
		return this.render('shortlink/qr');
	}

	shortlink.registerHit(conduit, from_qr);

	if (file_id) {
		const MediaFile = this.getModel('MediaFile');
		let file = await MediaFile.findByPk(file_id);

		let serve_options = {
			disposition : 'inline',
			filename    : file.filename,
		};

		return conduit.serveFile(file.path, serve_options);
	}

	return conduit.redirect(long_url);
});

/**
 * Show the dashboard
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setAction(async function dashboard(conduit) {

	if (conduit.method == 'post') {
		let data = conduit.body?.Shortlink;

		if (!data || Object.isEmpty(data)) {
			return conduit.error(new Error('No valid shortlink data was given'));
		}

		return this.createShortlink(conduit, data);
	}

	this.render('shortlink/dashboard');
});

/**
 * View the details of a shortlink
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 * @param    {Shortlink} shortlink
 */
Shortlink.setAction(async function view(conduit, shortlink) {

	if (shortlink.file) {
		const file = await this.getModel('MediaFile').findByPk(shortlink.file);
		this.set('shortlink_file', file);
	}

	this.set('qr', alchemy.plugins.shortlink?.qr);
	this.set('shortlink', shortlink);
	this.render('shortlink/view');
});

/**
 * Create a new link
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setMethod(async function createShortlink(conduit, body) {

	const Shortlink = this.getModel('Shortlink');

	let record = await Shortlink.createShortUrl(body);

	conduit.redirect(alchemy.routeUrl('Shortlink#view', {shortlink: record._id}));	
});