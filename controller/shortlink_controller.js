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
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {String}   title
 */
Shortlink.setMethod(function setPageTitle(title) {

	if (!title) {
		title = '';
	} else {
		title += ' | ';
	}

	title += alchemy.settings.title;

	this.setTitle(title);
});

/**
 * Create a new shortlink via the API
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.2
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setAction(async function create(conduit) {

	let api_key = conduit.headers.api_key;

	if (!api_key || typeof api_key != 'string' || !api_key.trim()) {
		return conduit.end({
			message : 'No API key was found!'
		});
	}

	api_key = api_key.trim();

	let KeyModel = this.getModel('ShortlinkApiKey');
	let key = await KeyModel.findByValues({
		api_key : api_key
	});

	if (!key) {
		return conduit.end({
			message : 'API key does not match!'
		});
	}

	let shortlink = this.getModel('Shortlink');

	let long_url = conduit.param('long_url') || conduit.param('longurl'),
	    short_code = conduit.param('shortcode') || conduit.param('short_code'),
	    document;

	try {
		document = await shortlink.createShortUrl({
			long_url   : long_url,
			short_code : short_code,
			user_id    : key.user_id
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
 * My shortlinks
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setAction(async function myShortlinks(conduit) {

	let result = [];
	let user_id = conduit.getUserId();

	let page_size = conduit.param('page_size') || 25;
	let page = conduit.param('page') || 1;
	let sort = conduit.param('sort');

	if (user_id) {
		const Shortlink = this.getModel('Shortlink');
		let crit = Shortlink.find();
		crit.where('user_id').equals(user_id);
		crit.page(page, page_size);

		let sort_config = {};

		if (sort?.field) {
			sort_config[sort.field] = sort.dir;
		} else {
			sort_config.created = -1;
		}

		crit.sort(sort_config);

		result = await Shortlink.find(crit);

		for (let record of result) {
			let view_action = new Classes.Alchemy.Form.Action.Url({
				name : 'view',
				icon : 'eye',
				placement : ['row', 'context'],
				url       : alchemy.routeUrl('Shortlink#view', {
					shortlink : record.$pk,
				})
			});

			record.$hold.actions = [view_action];
		}
	}

	conduit.end(result);
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

	this.setPageTitle('Dashboard');

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

	this.setPageTitle('View');

	if (shortlink.file) {
		const file = await this.getModel('MediaFile').findByPk(shortlink.file);
		this.set('shortlink_file', file);
	}

	let daily_apex_config = await shortlink.getApexChartsConfig();

	this.set('daily_apex_config', daily_apex_config);

	this.set('qr', alchemy.plugins.shortlink?.qr);
	this.set('shortlink', shortlink);
	this.render('shortlink/view');
});

/**
 * Create a new link
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 */
Shortlink.setMethod(async function createShortlink(conduit, body) {

	if (!body?.user_id) {
		body.user_id = conduit.getUserId();
	}

	if (!body?.ip) {
		body.ip = conduit.ip;
	}

	const Shortlink = this.getModel('Shortlink');

	let record = await Shortlink.createShortUrl(body);

	conduit.redirect(alchemy.routeUrl('Shortlink#view', {shortlink: record._id}));	
});