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
 * @version  0.2.0
 */
QrCode.setMethod(async function introduced() {

	await hawkejs.require('qr-code-styling');

	const qrCode = new QRCodeStyling({
		width: 1500,
		height: 1500,
		//type: "svg",
		data: this.qr_content,
		image: this.qr_logo,
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
	});

	//let canvas = document.createElement('canvas');
	//this.append(canvas);

	qrCode.append(this);
	
	
	//qrCode.download({ name: "qr", extension: "svg" });
});