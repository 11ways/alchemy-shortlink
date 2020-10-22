let config = alchemy.plugins.shortlink;

if (!config.base_url) {
	throw new Error('The shortlink plugin requires a `base` url configuration');
}

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