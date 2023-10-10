Router.serveDependencyFile('qr-code-styling', {
	file  : 'lib/qr-code-styling.js',
	alias : '/scripts/qr-code-styling.js',
});

Router.add({
	name       : 'Shortlink#view',
	methods    : 'get',
	paths      : '/dashboard/{[Shortlink._id]shortlink}',
	permission : 'shortlink',
});

Router.add({
	name       : 'Shortlink#dashboard',
	methods    : ['get', 'post'],
	paths      : '/dashboard',
	breadcrumb : 'static.dashboard',
	permission : 'shortlink',
	weight     : 999,
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