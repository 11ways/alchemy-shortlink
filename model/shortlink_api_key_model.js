/**
 * Shortlink API Key model:
 * Keys that can be used to create shortlinks per user
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.2
 * @version  0.2.2
 */
const ShortlinkApiKey = Function.inherits('Alchemy.Model', 'ShortlinkApiKey');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.2
 * @version  0.2.2
 */
ShortlinkApiKey.constitute(function addFields() {

	// The user this belongs to
	this.belongsTo('User');

	// The title of this key
	this.addField('title', 'String');

	// The actual key
	this.addField('api_key', 'String', {
		description : 'The secret API key',
		unique      : true,
		private     : true,
	});
});

/**
 * Configure the default chimera fieldsets
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.2
 * @version  0.2.2
 */
ShortlinkApiKey.constitute(function chimeraConfig() {

	if (!this.chimera) {
		return;
	}

	// Get the list group
	let list = this.chimera.getActionFields('list');

	list.addField('created');
	list.addField('title');
	list.addField('user_id');

	// Get the edit group
	let edit = this.chimera.getActionFields('edit');

	edit.addField('user_id');
	edit.addField('title');
	edit.addField('api_key');
});

/**
 * Set the API key before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.2
 * @version  0.2.2
 */
ShortlinkApiKey.setMethod(async function beforeSave(doc) {

	let api_key = doc.api_key;

	if (api_key) {
		api_key = String(api_key).trim().toLowerCase();
		doc.api_key = api_key;
	}

	if (!api_key || typeof api_key != 'string' || api_key.length < 16) {
		let existing_record;

		do {
			api_key = Crypto.randomHex(24);
			existing_record = await this.findByValues({api_key});
		} while (existing_record);

		doc.api_key = api_key;
	}
});