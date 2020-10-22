/**
 * Shortlink Hit model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const ShortlinkHit = Function.inherits('Alchemy.Model', function ShortlinkHit(options) {
	ShortlinkHit.super.call(this, options);
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
