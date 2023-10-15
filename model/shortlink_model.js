let generator;

/**
 * Shortlink model
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
const Shortlink = Function.inherits('Alchemy.Model', 'Shortlink');

/**
 * The default sort options
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @type     {Object}
 */
Shortlink.prepareProperty('sort', function sort() {
	return {_id: -1};
});

/**
 * Constitute the class wide schema
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.0
 */
Shortlink.constitute(function addFields() {

	// The hashcode of the long url (this is not unique)
	this.addField('long_url_hash', 'Number');

	// The hashcode of the short code (this is not unique)
	this.addField('short_code_hash', 'Number');

	// The long url
	this.addField('long_url', 'String', {
		description : 'The URL to point to',
	});

	// The optional file to link to
	this.addField('file', 'File', {
		description : 'The optional file to link to instead',
	});

	// The generated id part of the url
	this.addField('short_code', 'String', {
		description : 'The shortcode used in the short url (unique). Can also contain slashes.',
		unique: true
	});

	// The short url
	this.addField('short_url', 'String', {
		description : 'The full short URL (unique)',
		unique: true
	});

	// The user this belongs to (if any)
	this.belongsTo('User', {
		description : 'The user that made this shortlink',
	});

	// When was the last date the daily statistics were generated for?
	this.addField('last_statistics_generated', 'Date', {
		description : 'The last date the daily statistics were generated for',
	});

	this.addField('total_hits', 'Integer', {
		description : 'Total amount of clicks',
	});

	this.addField('qr_hits', 'Integer', {
		description : 'Total amount of QR-code clicks',
	});

	this.addField('regular_hits', 'Integer', {
		description : 'Total amount of non-QR clicks',
	});

	this.addField('last_hit', 'Datetime', {
		description : 'When the last click happened',
	});

	// The IP address that created this
	this.addField('ip', 'String');
});

/**
 * Configure the default chimera fieldsets
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.0
 */
Shortlink.constitute(function chimeraConfig() {

	var list,
	    edit;

	if (!this.chimera) {
		return;
	}

	// Get the list group
	list = this.chimera.getActionFields('list');

	list.addField('created');
	list.addField('short_code');
	list.addField('long_url');
	list.addField('file');
	list.addField('User.username');

	// Get the edit group
	edit = this.chimera.getActionFields('edit');

	edit.addField('long_url');
	edit.addField('short_code');
	edit.addField('short_url');
	edit.addField('file');
	edit.addField('user_id');
	edit.addField('ip');
	edit.addField('last_statistics_generated');
});

/**
 * Set codes before saving
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function beforeSave(document, options, next) {

	if (document.long_url) {
		document.long_url_hash = document.long_url.numberHash();
	} else {
		document.long_url_hash = null;
	}

	if (document.short_code) {
		document.short_code_hash = document.short_code.numberHash();
	} else {
		document.short_code_hash = null;
	}

	if (!document.total_hits) {
		document.total_hits = 0;
	}

	if (!document.regular_hits) {
		document.regular_hits = 0;
	}

	if (!document.qr_hits) {
		document.qr_hits = 0;
	}

	next();
});

/**
 * Get the nanoid generator
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function getNanoidGenerator() {

	if (!generator) {
		// This is enough for 113 million shortcodes
		generator = Crypto.createNanoidGenerator('acdefhjkmnprtwxyz34679', 6);
	}

	return generator;
});

/**
 * Generate a nanoid
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Shortlink.setMethod(function generateNanoid(size) {
	return this.getNanoidGenerator()(size);
});

/**
 * Look for a shortlink document with the given shortcode
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   short_code
 *
 * @return   {Document.Shortlink}
 */
Shortlink.setMethod(async function findByShortcode(short_code) {

	if (short_code == null) {
		throw new Error('Failed to look for a shortlink document, no shortcode was given');
	}

	short_code = short_code.toLowerCase();

	return this.findByValues({
		short_code_hash : short_code.numberHash(),
		short_code      : short_code
	});
});

/**
 * Create a new short url
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.0
 *
 * @param    {Object}   options
 *
 * @return   {Document.Shortlink}
 */
Shortlink.setMethod(async function createShortUrl(options) {

	let long_url = options.long_url,
	    short_code = options.short_code,
	    file = options.file;
	
	if (file && long_url) {
		throw new Error('Unable to create a short url: upload a file or give a long url, both are not allowed');
	}

	if (!long_url && !file) {
		throw new Error('Unable to create a short url without a long url');
	}

	if (!file && !RURL.isUrl(long_url)) {
		throw new Error('The given long url does not seem to be valid');
	}

	// If a short_code is given, make sure it doesn't already exist
	if (short_code) {
		short_code = short_code.toLowerCase().trim().replace(/\/+/, '/');

		let index = short_code.indexOf('?');

		if (index > -1) {
			short_code = short_code.slice(0, index);
		}

		index = short_code.indexOf('#');

		if (index > -1) {
			short_code = short_code.slice(0, index);
		}

		while (short_code[0] == '/') {
			short_code = short_code.slice(1).trim();
		}

		if (short_code[short_code.length - 1] == '/') {
			short_code = short_code.slice(0, -1);
		}

		let record = await this.findByShortcode(short_code);

		if (record) {

			if (record.long_url == long_url) {
				return record;
			}

			throw new Error('Unable to create a shorturl with keyword "' + short_code + '", it already exists');
		}
	} else {

		let record;

		do {
			// Generate a new short_code
			short_code = this.generateNanoid();

			// See if it exists
			record = await this.findByShortcode(short_code);
		} while (record);
	}

	let doc = this.createDocument();

	if (long_url) {
		doc.long_url = long_url;
	}

	if (file) {
		doc.file = file;
	}

	doc.short_code = short_code;

	let short_url = RURL.parse('/' + short_code, alchemy.plugins.shortlink.base_url);

	doc.short_url = String(short_url);

	if (options.user_id) {
		doc.user_id = options.user_id;
	}

	if (options.ip) {
		doc.ip = options.ip;
	}

	await doc.save();

	return doc;
});

/**
 * Get all the shortlinks that received a hit
 * since the given date
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Date}   since
 *
 * @return   {Document.Shortlink[]}
 */
Shortlink.setMethod(async function getShortlinksHitSince(since) {

	if (!since) {
		since = Date.create().subtract(1, 'day');
	}

	if (typeof since != 'object') {
		since = Date.create(since);
	}

	const ShortlinkHit = this.getModel('ShortlinkHit');

	// Create a pipeline that gets all the shortlink ids
	// that have received a hit since the given date
	let pipeline = [
		{
			$match: {
				created: {
					$gte: since
				}
			}
		},
		{
			$project: {
				shortlink_id: 1,
			}
		},
		{
			$group: {
				_id: '$shortlink_id'
			}
		}
	];

	let shortlink_id_records = await ShortlinkHit.executeMongoPipeline(pipeline);
	let ids = [];

	for (let entry of shortlink_id_records) {
		ids.push(entry._id);
	}

	let crit = this.find();
	crit.where('_id').in(ids);

	let records = await this.find('all', crit);

	return records;
});

/**
 * Register a hit
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.0
 * @version  0.2.1
 *
 * @param    {Conduit}   conduit
 * @param    {Boolean}   from_qr
 *
 * @return   {Document.ShortlinkHit}
 */
Shortlink.setDocumentMethod(function registerHit(conduit, from_qr) {

	let ShortlinkHit = this.getModel('ShortlinkHit'),
	    doc = ShortlinkHit.createDocument();

	doc.shortlink_id = this.$pk;
	doc.ip = conduit.ip;
	doc.user_agent = conduit.headers['user-agent'];
	doc.referrer = conduit.headers.referer || conduit.headers.referrer;
	doc.from_qr = from_qr || false;

	doc.save();

	return doc;
});

/**
 * Create the config for Apex-charts
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
Shortlink.setDocumentMethod(async function getApexChartsConfig() {

	const now = Date.create();

	let records = await this.getDailyStatisticRecords();
	let min_date;
	let cumul_data = [];
	let daily_data = [];

	let running_clicks = 0;
	let min_clicks = null;
	let max_clicks = null;

	let x_max = now.getTime(),
	    x_min = now.clone().subtract(6, 'months').getTime();

	for (let record of records) {

		let date = new Date(record.year + '-' + record.month + '-' + record.day);

		if (!min_date || date < min_date) {
			min_date = date;
		}

		if (min_clicks == null || min_clicks > record.total_hits) {
			min_clicks = record.total_hits;
		}

		if (max_clicks == null || max_clicks < record.total_hits) {
			max_clicks = record.total_hits;
		}

		running_clicks += record.total_hits;

		cumul_data.push([+date, running_clicks]);
		daily_data.push([+date, record.total_hits]);
	}

	if (min_date > x_min) {
		x_min = min_date.getTime();
	}

	let apex_config = {
		series: [
			{
				name : 'cumul',
				type : 'line',
				data : cumul_data,
			},
			{
				name : 'daily',
				type : 'column',
				data : daily_data,
			},
		],
		chart : {
			type : 'line',
			height: 350,
			stacked: false,
			width: '100%',
			height: '100%',
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			width: [1, 1, 4]
		},
		// markers: {
		// 	size: 0,
		// 	style: 'hollow',
		// },
		xaxis: {
			type: 'datetime',
			min : x_min,
			max : x_max,
			tickAmount: 6,
			labels: {
				format: 'yyyy-MM-dd'
			},
		},
		yaxis: [
			{
				min        : 0,
				max        : Math.ceil(running_clicks * 1.1),
				seriesName : 'cumul',
				opposite   : false,
				axisTicks: {
					show: true,
				},
				axisBorder: {
					show: true,
					color: '#008FFB'
				},
				labels: {
					style: {
						colors: '#008FFB',
					}
				},
				title: {
					text: 'Cumulative hits',
					style: {
						color: '#008FFB',
					}
				},
			},
			{
				min        : 0,
				max        : Math.ceil(max_clicks * 1.1),
				seriesName : 'daily',
				opposite   : true,
				axisTicks: {
					show: true,
				},
				axisBorder: {
					show: true,
					color: '#00E396'
				},
				labels: {
					style: {
						colors: '#00E396',
					}
				},
				title: {
					text: 'Daily hits',
					style: {
						color: '#00E396',
					}
				},
			}
		],
		tooltip: {
			x: {
				format: 'dd MMM yyyy'
			}
		},
		
	};

	return apex_config;
});

/**
 * Get all the daily statistics records
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 */
Shortlink.setDocumentMethod(async function getDailyStatisticRecords() {

	// Generate the statistics.
	// This will hopefully only have to generate them for 1 (the current) day
	await this.generateStatistics();

	const SDS = Model.get('ShortlinkDailyStatistics');

	let crit = SDS.find();
	crit.where('shortlink_id').equals(this._id);
	crit.sort({'year': 'asc', 'month': 'asc', 'day': 'asc'});

	let all = await SDS.find('all', crit);

	return all;
});

/**
 * Generate statistics
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.1
 * @version  0.2.1
 *
 * @param    {Date}   until_date
 */
Shortlink.setDocumentMethod(async function generateStatistics(until_date) {

	const SDS = Model.get('ShortlinkDailyStatistics'),
	      Hits = Model.get('ShortlinkHit'),
	      now = new Date();

	let last_statistics_generated = this.last_statistics_generated;

	if (!last_statistics_generated) {
		last_statistics_generated = this.created.clone();
	}

	last_statistics_generated = last_statistics_generated.clone().startOf('day');

	let last_date;

	if (!until_date) {
		until_date = Date.create();
	}

	// Get all the days there were hits since the last time statistics were generated
	let date_pipeline = [
		{
			$match: {
				shortlink_id: this._id,
				created: {
					$gte: last_statistics_generated,
					$lte: until_date,
				}
			}
		},
		{
			$project: {
				year: {
					$year: '$created'
				},
				month: {
					$month: '$created'
				},
				day: {
					$dayOfMonth: '$created'
				}
			}
		},
		{
			$group: {
				_id: {
					year: '$year',
					month: '$month',
					day: '$day'
				}
			}
		},
		{
			$sort: {
				'_id.year': 1,
				'_id.month': 1,
				'_id.day': 1,
			}
		}
	];

	let dates_result = await Hits.executeMongoPipeline(date_pipeline);

	let tasks = [];

	for (let entry of dates_result) {
		let info = entry._id;

		let current_date = new Date(info.year, info.month - 1, info.day);

		if (current_date > last_date) {
			last_date = new Date(info.year, info.month - 1, info.day);
		}

		tasks.push(async (next) => {

			let record = await SDS.findByValues({
				shortlink_id : this._id,
				year         : current_date.getFullYear(),
				month        : current_date.getMonth() + 1,
				day          : current_date.getDate(),
			});

			if (!record) {
				record = SDS.createDocument();
				record.shortlink_id = this._id;
				record.year = current_date.getFullYear();
				record.month = current_date.getMonth() + 1;
				record.day = current_date.getDate();
			}

			let pipeline = [
				{
					$match: {
						shortlink_id: this._id,
						created: {
							$gte: current_date,
							$lte: current_date.clone().endOf('day'),
						}
					}
				},
				{
					$set: {
						total_hits: 1,
					}
				},
				{
					$project: {
						shortlink_id: 1,
						total_hits: 1,

						// Only count the ones that came from a QR code
						qr_hits: {
							$cond: {
								if: {
									$eq: ['$from_qr', true]
								},
								then: 1,
								else: 0
							}
						},
						regular_hits: {
							$cond: {
								if: {
									$eq: ['$from_qr', true]
								},
								then: 0,
								else: 1
							}
						},
					}
				},
				{
					$group: {
						_id: "$shortlink_id",
						total_hits: {
							$sum: '$total_hits'
						},
						qr_hits: {
							$sum: '$qr_hits'
						},
						regular_hits: {
							$sum: '$regular_hits'
						}
					},
				}
			];

			let result = await Hits.executeMongoPipeline(pipeline);
			let do_save = true;

			if (result?.length) {
				result = result[0];

				record.total_hits = result.total_hits;
				record.qr_hits = result.qr_hits;
				record.regular_hits = result.regular_hits;
			} else {

				if (record.total_hits || record.qr_hits || record.regular_hits) {
					record.total_hits = 0;
					record.qr_hits = 0;
					record.regular_hits = 0;
				} else {
					do_save = false;
				}
			}

			if (do_save) {
				await record.save();
			}

			next();
		});
	}

	await Function.parallel(4, tasks);

	// Now get the totals, which will be stored in ths record itself
	let pipeline = [
		{
			$match: {
				shortlink_id: this._id,
			}
		},
		{
			$project: {
				total_hits   : 1,
				qr_hits      : 1,
				regular_hits : 1,
			}
		},
		{
			$group: {
				_id: "$shortlink_id",
				total_hits: {
					$sum: '$total_hits'
				},
				qr_hits: {
					$sum: '$qr_hits'
				},
				regular_hits: {
					$sum: '$regular_hits'
				}
			},
		}
	];

	let result = await SDS.executeMongoPipeline(pipeline);

	if (result?.length) {
		result = result[0];

		this.total_hits = result.total_hits;
		this.qr_hits = result.qr_hits;
		this.regular_hits = result.regular_hits;
	}

	let last_hit_crit = Hits.find();
	last_hit_crit.where('shortlink_id').equals(this._id);
	last_hit_crit.sort({_id: -1});
	let last_hit = await Hits.find('first', last_hit_crit);

	if (last_hit) {
		this.last_hit = last_hit.created;
	}

	// Make sure this doesn't accidentally get set in the future
	if (last_date > now) {
		last_date = now;
	}

	this.last_statistics_generated = last_date;
	await this.save();
});