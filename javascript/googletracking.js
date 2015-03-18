function Tracker(devMode) {
	var tracker = this;

	// registered events to handle when tracker is initialised via init
	this.eventDefs = {};

	// if in dev mode events are not sent to google but logged to console instead
	this.devMode = devMode;

	// set these before init call to have them sent with Tracker Initialised event
	this.initVars = {};

	/**
	 * Call the underlying ga method, unless in dev mode when it is not called.
	 */
	this.ga = function() {
		this.log("GA TRACKING EVENT");
		if (arguments.length > 2) {
			this.log("...", arguments[2]);
		}

		if (!devMode) {
			ga.apply(null, arguments);
		}
	}
	/**
	 * Tests for existance of console, console.log and defines a dummy if required. If in dev mode then logs arguments to console.
	 * @param _ - placeholder indicator, arguments is used here instead.
	 */
	this.log = function (_) {
		if (!window.console || !window.console.log) {
			window.console = {};
			window.console.log = function() {};
		}
		if (devMode) {
			for (i in arguments) {
				console.log(arguments[i]);
			}
		}
	}
	/**
	 * At event handling time we need to resolve possible functions defined on ga data to method calls with this as the element so we can get e.g. attr('href')
	 *
	 * @param ga copy of ga data with action and label resolved to called functions if a function
	 */
	var realiseGAData = function(element, ga) {
		var copy = $.extend({}, ga);

		// in call through to label, action, value methods, arguments[1] is the returned copy of ga event date, followed by other arguments to event, eg from trigger
		if (typeof ga.eventLabel == 'function') {
			copy.eventLabel = ga.eventLabel.call(element, copy, arguments[2], arguments[3], arguments[4]);
		}
		if (typeof ga.eventAction == 'function') {
			copy.eventAction = ga.eventAction.call(element, copy, arguments[2], arguments[3], arguments[4]);
		}
		if (typeof ga.eventValue == 'function') {
			copy.eventValue = ga.eventValue.call(element, copy, arguments[2], arguments[3], arguments[4]);
		}
		return copy;
	}
	/**
	 * Add and event to be bound via bindEvents.
	 *
	 * @param id
	 * @param names
	 * @param bodyClasses
	 * @param selector
	 * @param delegate
	 * @param delayMS
	 * @param terminateEvent
	 * @param googleEventData
	 */
	this.addEventDef = function(id, names, bodyClasses, selector, delegate, delayMS, terminateEvent, googleEventData) {
		this.eventDefs[id] = {
			names:              names,
			selector:           bodyClasses ? (bodyClasses + ' ' + selector) : selector,
			delegate:           delegate,
			delayMS:            delayMS,
			terminateEvent:     terminateEvent,
			ga:                 googleEventData,
			namespacedNames:    names.trim().split(' ').join('.tracker ') + '.tracker',
			bound:              false
		};
	}

	/**
	 * Bind all registered events.
	 */
	this.bindEvents = function() {
		var i,
			self = this;

		// First, bind events that have been added via the js API
		for (i in this.eventDefs) {
			this.bindEvent(this.eventDefs[i]);
			this.eventDefs[i].bound = true;
		}

		// Now bind events that have been added using ga attributes in DOM
		$('*[data-ga-event="click"]').click(function(event) {
			self.handleEvent(event, $(this));
		});

		// Handle onsubmit (to be applied to a form).
		$('*[data-ga-event="submit"]').click(function(event) {
			self.handleEvent(event, $(this));
		});

		// Handle pageload. handleEvent is called immediately
		$('*[data-ga-event="pageload"]').each(function() {
			self.handleEvent(null, $(this));
		});
	}

		// this will handle an event called eventName on element. This will use attributes defined
	// on element to construct the GA request package.
	this.handleEvent = function(event, $element) {
		var self = this,
			category = $element.attr('data-ga-category'),
			action = $element.attr('data-ga-action'),
			label = $element.attr('data-ga-label'),
			value = $element.attr('data-ga-value'),
			nonInteractive = $element.attr('data-ga-noninteractive'),
			terminate = $element.attr('data-ga-terminate'),
			delay = $element.attr('data-ga-delay');
			cond = $element.attr('data-ga-cond');

		if (cond) {
			cond = this.interpretValue(cond, $element);
			if (!this.isCondTrue(cond)) {
				// don't send GA event if the condition is present and does not resolve to true.
				return;
			}
		}

		// apply value interpretation to the fields we'll send
		if (category) {
			category = this.interpretValue(category, $element);
		}
		if (action) {
			action = this.interpretValue(action, $element);
		}
		if (label) {
			label = this.interpretValue(label, $element);
		}
		if (value) {
			value = this.interpretValue(value, $element);
		}

		var eventRequest = {
			// type: 'event',
			eventCategory: category,
			eventAction: action
		};

		if (label) {
			eventRequest.eventLabel = label;
		};

		if (value) {
			eventRequest.eventValue = value;
		}

		if (nonInteractive && (nonInteractive == 'true' || nonInteractive == '1')) {
			eventRequest.nonInteraction = nonInteractive;
		}

		if (terminate && (terminate == 'true' || terminate == '1')) {
			event.preventDefault();
			event.stopPropagation();
		}

		if (delay) {
			setTimeout(function() {
				self.ga("send", "event", eventRequest);
			}, delay);

		} else {
			this.ga("send", "event", eventRequest);
		}
	}

	this.isCondTrue = function(cond) {
		if (typeof cond === 'undefined' || !cond || cond === null || cond === 0 || cond === false || cond === '') {
			return false;
		}

		if (($.isArray(cond) || cond instanceof jQuery) && cond.length === 0) {
			return false;
		}

		return true;
	},

	// Interpret a string attribute value in the context of $el.
	this.interpretValue = function(s, $el) {
		var i = s.indexOf('@');
		if (i != 0) {
			return s
		}

		var parts = s.split(",@");
		if (parts[0][0] == '@') {
			parts[0] = parts[0].substring(1);
		}

		var $target = $el,
			attrName = '',
			fnName = '',
			selector = '',
			text = false,
			selThis = false;

		for (var i = 0; i < parts.length; i++) {
			var p = parts[i].split(':');
			var token = p.shift();
			var val = p.join(':');
			switch (token) {
				case 'attr':
					attrName = val;
					break;
				case 'sel':
					selector = val;
					break;
				case 'text':
					text = val;
					break;
				case 'this':
					if (val != 'false' && val != '0') {
						selThis = true;
					}
					break;
				case 'call':
					fnName = val;
					break;
			}
		}

		if (selector != '') {
			if (selThis) {
				$target = $(selector, $el);
			} else {
				$target = $(selector);
			}
		}

		if (attrName) {
			return $target.attr(attrName);
		}

		if (text) {
			return $target.text();
		}

		if (fnName) {
			var parts = rest.split('.');
			var o = window;
			while (parts.length > 1) {
				o = o[parts.shift()];
			}
			var f = parts[0]
			return o[f]($target);
		}

		// if we haven't asked for an attribute or text of the target, we might just
		// be interested in knowing if there are elements, as can be the case with
		// "cond".
		return $target;
	}

	/**
	 * Simulate an event e.g. after delayed. jquery.simulate seems pretty useless here so firing the events manually via .click, .submit which means at the end of
	 * the day we only handle these events.
	 *
	 * @param element
	 * @param eventDef
	 */
	var simulateEvent = function(element, eventDef) {
		tracker.unbindEvent(eventDef);

		switch (eventDef.names) {
			case 'click':
				element.click();
				break;
			case 'submit':
				element.submit();
				break;
			default:
				$(element).simulate(eventDef.names, eventDef.data);
		}

		tracker.bindEvent(eventDef);
	}

	/**
	 * Return an event handler function which:
	 *  -   Stops default and immediatePropagation if event is to be delayed or TerminateEvent is set
	 *  -   Sends data to google analytics from eventDef.ga object
	 *  -   Reschedules event firing in delayMS if set via simulateEvent
	 *
	 * @param eventDef
	 * @returns {Function}
	 */
	var makeHandler = function(eventDef) {
		return function(event) {
			var element = this;

			var isMiddleClick = (event.which == 2);

			// this is the element which the event fires on
			// if we are delaying or terminating this event then stop default/immediatePropagation etc
			if (eventDef.delayMS || eventDef.terminateEvent) {
				//don't prevent default if middle mouse click (as this opens a new tab on most browsers)
				if (!isMiddleClick) {
					event.preventDefault();
					event.stopPropagation();
				}
			}

			tracker.sendEventObject(realiseGAData(element, eventDef.ga, arguments[1], arguments[2], arguments[3]));

			if (eventDef.delayMS) {
				//don't simulate click if middle click, as this causes the link to be followed in the current page
				if (!isMiddleClick) {
					setTimeout(function() {
						simulateEvent(element, eventDef)
					}, eventDef.delayMS);
				}
			}
		}
	}

	/**
	 * use JQuery.on to bind event to elements using namespacedNames and delegate if present.
	 * @param eventDef
	 */
	this.bindEvent = function(eventDef) {
		if (eventDef.delegate != undefined) {
			$(eventDef.delegate).on(eventDef.namespacedNames, eventDef.selector, makeHandler(eventDef))
		} else {
			$(eventDef.selector).on(eventDef.namespacedNames, makeHandler(eventDef))
		}
	}
	/**
	 * use jQuery.off to unbind an event using namespaceNames and delegate if present.
	 * @param eventDef
	 */
	this.unbindEvent = function(eventDef) {
		if (eventDef.delegate) {
			$(eventDef.delegate).off(eventDef.namespacedNames, eventDef.selector);
		} else {
			$(eventDef.selector).off(eventDef.namespacedNames);
		}
	}
	/**
	 * Fire an event manually on an element by id (e.g. 'event-10')
	 * @param element - to fire event on
	 * @param id - e.g. 'event-10'
	 * @param _ arguments placeholder
	 */
	this.fireEvent = function(element, id, _) {
		if (typeof this.eventDefs[id] == 'object') {
			tracker.sendEventObject(realiseGAData(element, this.eventDefs[id].ga, arguments[2], arguments[3], arguments[4]));
			simulateEvent(element, this.eventDefs[id]);
		}
	}
	/**
	 * Waits for ga to be an object if required then creates the ga object then:
	 *  -   Sets registered initVars and sends the pageview event.
	 *  -   Binds events registered by addEventDef
	 *  -   if DevMode send 'Tracker Initialised' event which will just log
	 *
	 * @param wait
	 */
	this.init = function (wait) {
		var self = this;

		// Get the web property to track to. This should have been rendered into the page by
		// GoogleTrackingControllerExtension, into a custom <meta> tag.
		var webPropertyID = $('meta[name=ga-tracking-config]').attr('data-tracking-id');
		if (!webPropertyID) {
			this.log('Google tracking not initiated as profile ID is missing');
			return;
		}

		if (typeof ga !== 'function') {
			this.log('Google tracking delaying initialisation for ' + wait + 'ms');
			setTimeout(self.init, wait);
		} else {
			this.ga('create', webPropertyID);

			for (name in this.initVars) {
				this.setVariable(name, this.initVars[name]);
			}
			this.ga('send', 'pageview');

			// bind page events added via addEventDef calls when page loads
			this.bindEvents();

			if (devMode) {
				this.sendEvent(true, 'Tracker', 'Initialised');
			}
		}
	}
	/**
	 * set a dimension or metric, this is not sent until an event is sent, so call this before sending associated event.
	 *
	 * Unlike ga.js setCustomVar scope is defined in the google analytics admin interface not specified here.
	 */
	this.setVariable = function (name, value) {
		this.ga('set', name, value);
	}
	/**
	 * Return args packaged as an object GA can handle with type 'event'.
	 * @param nonInteractive
	 * @param category
	 * @param action
	 * @param label
	 * @param value
	 * @returns {{type: string, eventCategory: *, eventAction: *, eventLabel: *, eventValue: *, nonInteraction: *}}
	 */
	this.makeGAEvent = function(nonInteractive, category, action, label, value) {
		return {
			type: 'event',                                      // required
			eventCategory: category,                            // required
			eventAction: action,                                // required
			eventLabel: label,
			eventValue: value,
			nonInteraction: nonInteractive
		};
	}

	/**
	 * Send event to google passing parameters.
	 *
	 * @param nonInteractive
	 * @param category
	 * @param action
	 * @param label
	 * @param value
	 */
	this.sendEvent = function (nonInteractive, category, action, label, value) {
		var data = this.makeGAEvent(nonInteractive, category, action, label, value);
		this.sendEventObject(data);
	}
	/**
	 * Send event to google as an object with eventLabel etc.
	 * @param data
	 */
	this.sendEventObject = function(data) {
		this.log(data)
		this.ga('send', 'event', data);
	}
}

var tracker = $.tracker = new Tracker(0);

(function($) {

	// add a custom "reading" event to window
	// This script was originally written by Justin Cutroni, see http://cutroni.com/blog/2012/02/21/advanced-content-tracking-with-google-analytics-part-1/
	var contentElement = $('#main').first(),
		eventElement = $(window).first();

	if (contentElement && eventElement) {

		var readerTime = 60; // Seconds after scroll to bottom of content before visitor is classified as "Reader"
		var readerLocation = 120; // # px before tracking a reader
		var updateDelayMS = 100; // Default time delay before checking location
		// Set some flags for tracking & execution
		var timer = 0;
		var contentLength = 0; // Content Length -> Length of content area
		var scrolling = false;
		var endContent = false;
		var didComplete = false;
		// Set some time variables to calculate reading time etc.
		var pageTimeLoad = 0;
		var scrollTimeStart = 0;
		var timeToScroll = 0;
		var contentTime = 0;
		var endTime = 0;
		var documentHeight = $(document).height();

		// Check if content has to be scrolled
		if ($(window).height() < contentElement.height()) { // Replace contentArea with the name (class or ID) of your content wrappers name
			pageTimeLoad = new Date().getTime();
			contentLength = contentElement.height();
			eventElement.trigger('reading', 'Scrollable', contentLength);
		}
		// Check the location and track user
		function trackLocation() {
			var bottom = $(window).height() + $(window).scrollTop();
			var totalTime;

			// If user has scrolled beyond threshold send an event
			if (bottom > readerLocation && !scrolling) {
				scrolling = true;
				scrollTimeStart = new Date().getTime();
				if (pageTimeLoad > 0) {
					timeToScroll = Math.round((scrollTimeStart - pageTimeLoad) / 1000);
				} else {
					timeToScroll = ""
				}
				// Article scroll started
				eventElement.trigger('reading', 'StartScroll', timeToScroll);
			}
			// If user has hit the bottom of the content send an event
			if (bottom >= contentElement.scrollTop() + contentElement.innerHeight() && !endContent) {
				timeToScroll = new Date().getTime();

				contentTime = Math.round((timeToScroll - scrollTimeStart) / 1000);

				if (contentTime < readerTime) {
					eventElement.trigger('reading','ContentBottom-Scan',contentTime);
				} else {
					eventElement.trigger('reading','ContentBottom-Read',contentTime);
				}
				endContent = true;
			}
			// If user has hit the bottom send an event
			if (bottom >= documentHeight && !didComplete) {
				endTime = new Date().getTime();
				totalTime = Math.round((endTime - scrollTimeStart) / 1000);
				eventElement.trigger('reading', 'PageBottom', totalTime);
				didComplete = true;
			}
		}
		// Track the scrolling and track location
		$(window).scroll(function() {
			if (timer) {
				clearTimeout(timer);
			}
			// don't set timer if we're all done
			if (!didComplete) {
				// Use a buffer so we don't call trackLocation too often.
				timer = setTimeout(trackLocation, updateDelayMS);
			}
		});
	}
})(jQuery);
