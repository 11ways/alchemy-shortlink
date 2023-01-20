/**
 * The link-creator custom element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
const LinkCreator = Function.inherits('Alchemy.Element.Media.Base', 'AlLinkCreator');

/**
 * The stylesheet to load for this element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
LinkCreator.setStylesheetFile('shortlink/al_link_creator');

/**
 * The template code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
LinkCreator.setTemplateFile('element/link_creator');

/**
 * The element has been added to the dom for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
LinkCreator.setMethod(async function introduced() {

	let button = this.querySelector('al-button.button');

	button.addEventListener('activate', e => {
		e.preventDefault();
		this.submitForm();
	});
});

/**
 * Submit the form
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
LinkCreator.setMethod(async function submitForm() {

	let form = this.querySelector('al-form');

	form.clearErrors();

	let long_url_field = form.querySelector('al-field[field-name="long_url"]'),
	    media_field = form.querySelector('al-field[field-name="file"]');
	
	if (!long_url_field.value && !media_field.value) {
		form.showError(new Error('Either a long_url or a file is required'));
		return;
	}

	return form.submit();
});