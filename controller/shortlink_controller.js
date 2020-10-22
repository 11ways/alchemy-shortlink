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
const Shortlink = Function.inherits('Alchemy.Controller', function Shortlink(conduit, options) {
	Shortlink.super.call(this, conduit, options);
});

/**
 * Create a new shortlink
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
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

	conduit.end({
		data : {
			url : document.short_url,
		}
	});
});

/**
 * Redirect the user
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Conduit}   conduit
 * @param    {String}    short_code
 */
Shortlink.setAction(async function redirect(conduit, short_code) {

	let shortlink = this.getModel('Shortlink');

	let document = await shortlink.findByShortcode(short_code);

	if (!document || !document.long_url) {
		return conduit.notFound();
	}

	document.registerHit(conduit);

	return conduit.redirect(document.long_url);
});