/**
 * Shortlink Daily Statistics model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
const ShortlinkDailyStatistics = Function.inherits('Alchemy.Model', 'ShortlinkDailyStatistics');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
ShortlinkDailyStatistics.constitute(function addFields() {

	// Remove created field
	this.schema.remove('created');

	// The shortlink this belongs to
	this.belongsTo('Shortlink');

	this.addField('year', 'Integer');
	this.addField('month', 'Integer');
	this.addField('day', 'Integer');

	this.addField('total_hits', 'Integer', {
		description : 'Total amount of hits',
	});

	this.addField('qr_hits', 'Integer', {
		description : 'Amount of hits via QR code',
	});

	this.addField('regular_hits', 'Integer', {
		description : 'Amount of non-QR code hits',
	});
});
