const PASTE_LISTENER = Symbol('pasteListener');

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

	if (document[PASTE_LISTENER]) {
		document.removeEventListener(document[PASTE_LISTENER]);
	}

	document[PASTE_LISTENER] = async e => {

		let text = e.clipboardData.getData('text') || e.clipboardData.getData('text/plain');

		console.log('Got text:', text);

		// Ignore pasted text
		if (text) {
			return;
		}

		e.preventDefault();
  		const items = typeof navigator?.clipboard?.read === 'function' ? await navigator.clipboard.read() : e.clipboardData.files;

		for (const item of items) {
			let type;

			if (item.type) {
				type = item.type;
			} else if (item.types) {
				type = item.types[0];
			} else {
				continue;
			}

			if (type == 'text/plain') {
				continue;
			}

			let data = await item.getType(type);

			let filename = Date.now() + '_' + type.slug().underscore();

			let uploader = this.querySelector('al-file');
			uploader.uploadFile({
				file     : data,
				filename : filename,
			})

			break;
		}
	};

	document.addEventListener('paste', document[PASTE_LISTENER]);
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