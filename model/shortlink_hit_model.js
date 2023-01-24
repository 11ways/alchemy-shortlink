/**
 * Shortlink Hit model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const ShortlinkHit = Function.inherits('Alchemy.Model', 'ShortlinkHit');

/**
 * The default sort options
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type     {Object}
 */
ShortlinkHit.prepareProperty('sort', function sort() {
	return {_id: -1};
});


/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
ShortlinkHit.constitute(function addFields() {

	// The shortlink this belongs to
	this.belongsTo('Shortlink');

	// The IP address that followed this link
	this.addField('ip', 'String');

	// The useragent string
	this.addField('user_agent', 'String');

	// The referer
	this.addField('referrer', 'String');
});
