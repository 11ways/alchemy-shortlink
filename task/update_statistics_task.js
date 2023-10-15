/**
 * The task to update statistics
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
const UpdateStatistics = Function.inherits('Alchemy.Task', 'Shortlink.Task', 'UpdateStatistics');

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
UpdateStatistics.constitute(function addFields() {
	this.schema.addField('update_hits_since', 'Datetime', {
		description: 'Update shortlinks that have been hit since this date',
	});
});

/**
 * Force this task to run every day at 6:27 AM
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
UpdateStatistics.addFallbackCronSchedule('27 06 * * *');

/**
 * The function to execute
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
UpdateStatistics.setMethod(async function executor() {

	const Shortlink = this.getModel('Shortlink');
	const now = Date.create();

	let since = this.getParam('update_hits_since');

	let records_to_update = await Shortlink.getShortlinksHitSince(since);
	let amount = records_to_update.length;

	for (let index = 0; index < amount; index++) {

		if (this.is_paused) {
			await this.waitUntilResumed();
		}

		if (this.has_stopped) {
			return;
		}

		let shortlink = records_to_update[index];
		await shortlink.generateStatistics(now);

		this.report(index / amount);
	}

});