/**
 * The al-qr-code custom element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
const QrCode = Function.inherits('Alchemy.Element.App', 'AlQrCode');

/**
 * The stylesheet to load for this element
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setStylesheetFile('shortlink/al_qr_code');

/**
 * The filename for downloads
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.3
 */
QrCode.setAttribute('qr-filename');

/**
 * The actual data to add to the QR code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-content');

/**
 * The optional logo to add to the center
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-logo');

/**
 * The background color
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-background');

/**
 * The color of the dots
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-dots-color');

/**
 * The type of dots
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-dots-type');

/**
 * The type of error correction
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
QrCode.setAttribute('qr-error-correction');

/**
 * The element has been added to the dom for the first time
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.4
 */
QrCode.setMethod(async function introduced() {

	await hawkejs.require('qr-code-styling');

	let qr_options = {
		width: 1500,
		height: 1500,
		data: this.qr_content,
		image: this.qr_logo,
		type: 'canvas',
		qrOptions : {
			errorCorrectionLevel: this.qr_error_correction,
		},
		dotsOptions: {
			color: this.qr_dots_color,
			type: this.qr_dots_type,
		},
		backgroundOptions: {
			color: this.qr_background,
		},
		imageOptions: {
			crossOrigin: "anonymous",
			margin: 15
		}
	};

	this.qr_options = qr_options;

	this.recreateQrCode();

	this.addEventListener('contextmenu', e => {
		this.showContextMenu(e);
	});

	this.background_is_on = true;
	this.previous_background = null;
});

/**
 * Recreate the QR code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.3
 */
QrCode.setMethod(function recreateQrCode(e) {

	Hawkejs.removeChildren(this);

	const qrCode = new QRCodeStyling(this.qr_options);
	qrCode.append(this);

	this.qr_code_instance = qrCode;
});

/**
 * Force a download of the current QR code
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.4
 */
QrCode.setMethod(async function downloadAsFile(type, width, height, dot_color) {

	await hawkejs.require('qr-code-styling');

	let instance;

	let options = JSON.clone(this.qr_options);
	options.width = width || 9000;
	options.height = height || 9000;

	if (dot_color) {
		if (!options.dotsOptions) {
			options.dotsOptions = {};
		}

		options.dotsOptions.color = dot_color;
	}

	instance = new QRCodeStyling(options);

	if (!type) {
		type = 'png';
	}

	let filename;

	if (this.qr_filename) {
		filename = this.qr_filename;
	}

	if (filename) {
		if (width && height) {
			filename += '_' + width + 'x' + height;
		}

		if (dot_color) {
			filename += '_' + String(dot_color).slug();
		}
	}

	let download_options = {
		extension : type,
		name      : filename,
	};

	instance.download(download_options);
});

/**
 * Get the current toggle-background title
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.4
 */
QrCode.setMethod(function getToggleBackgroundTitle() {

	let result = 'Toggle background';
	let color = this.qr_options?.backgroundOptions?.color;

	if (color) {
		result += ' (is now ' + color + ')';
	}

	return result;
});

/**
 * Show the context menu
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.3
 * @version  0.2.4
 */
QrCode.setMethod(function showContextMenu(e) {

	let menu = this.createElement('he-context-menu');

	menu.addEntry(this.getToggleBackgroundTitle(), () => {

		if (!this.qr_options) {
			this.qr_options = {};
		}

		if (!this.qr_options.backgroundOptions) {
			this.qr_options.backgroundOptions = {};
		}

		if (this.background_is_on) {
			// Remember the current background color
			this.previous_background = this.qr_options?.backgroundOptions?.color;

			// Set it to transparent
			this.qr_options.backgroundOptions.color = 'transparent';

			this.background_is_on = false;
		} else {
			this.qr_options.backgroundOptions.color = this.previous_background;
			this.background_is_on = true;
		}

		this.recreateQrCode();
	});

	if (!this.qr_logo) {
		// Logos are somehow always drawn horribly
		// (They are included in the file with a set width & height, and then scaled,
		// which causes blurriness)
		menu.addEntry({
			title : 'Download SVG',
		}, () => this.downloadAsFile('svg'));
	}

	menu.addEntry({
		title : 'Download PNG',
	}, () => this.downloadAsFile('png'));

	menu.addEntry({
		title : 'Download JPEG',
	}, () => this.downloadAsFile('jpeg'));

	menu.addEntry({
		title : 'Download PNG (High-res)',
	}, () => this.downloadAsFile('png', 3000, 3000));

	menu.addEntry({
		title : 'Download PNG (Super-high-res)',
	}, () => this.downloadAsFile('png', 10000, 10000));

	menu.addEntry({
		title : 'Download PNG (Super-high-res, monochrome)',
	}, () => this.downloadAsFile('png', 10000, 10000, '#000'));

	menu.show(e);
});