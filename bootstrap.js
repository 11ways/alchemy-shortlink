let config = alchemy.plugins.shortlink;

if (!config.base_url) {
	throw new Error('The shortlink plugin requires a `base` url configuration');
}

let options = {

	// The base url of the shortlinker
	base_url : null,

	// The API key to allow remote shortlinks to be made
	// @TODO: allow multiple keys
	api_key  : null,

	// QR code settings
	qr : {

		// The optional logo to use inside the QR codes
		logo : null,

		// The background color of the QR code
		background: '#fff',

		// The color of the dots
		dots_color: '#000',

		// The type of dots. Can be:
		// rounded, dots, classy, classy-rounded, square or extra-rounded
		dots_type : 'rounded',

		// The type of error correction
		// Can be L, M, Q, H
		error_correction : 'Q',
	}
};

// Inject the user-overridden options
alchemy.plugins.shortlink = Object.merge(options, config);

Router.serveDependencyFile('qr-code-styling', {
	file  : 'lib/qr-code-styling.js',
	alias : '/scripts/qr-code-styling.js',
});

Router.add({
	name       : 'Shortlink#create',
	methods    : 'post',
	paths      : '/api/shortlink/create',
});

Router.add({
	name       : 'Shortlink#redirect',
	methods    : 'get',
	paths      : '/{short_code}'
});

Router.add({
	name       : 'Shortlink#catchAll',
	methods    : 'get',
	paths      : /\/(.*)/,
});