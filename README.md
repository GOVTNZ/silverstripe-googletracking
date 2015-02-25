# Introduction

The Google Tracking module makes adding tracking to your site easier. It provides two basic mechanisms:

 *  Page level tracking that is automatically hooked into your pages
 *  event level tracking for attaching tracking actions on DOM events.

# Configuration

Ensure that the <head> section of your site contains the following:

	<head>
		...
		$GoogleTrackingConfig
		...
	</head>

This will include a <meta> tag for configuration information for the Google API.

Configuration properties that are only settable in config.yml of your site include:

 *	self_hosted_tracking_js - if 1, it will serve the module's copy of the
	Google universal_analytics.js script. This is for sites where the content
	policy prohibits inclusion of cross-domain scripts.

# Page Level Tracking

The module will automatically add itself to ContentController, thereby including page tracking for all pages on the site. However, if you have a custom controller that does not extend ContentController, but you want tracking behaviour added, simple add the extension to your controller as well:

	MyCustomController:
	  extensions:
		- GoogleTrackingControllerExtension


# Event Tracking

## Using DOM classes

The module supports registering tracking events directly against DOM elements by decorating your markup with attributes. For example, to track clicks on the header icon of a page, you might have markup that looks like this:

	<div class="logo">
		<a href="$HomePageLink"
			data-ga-event="click"
			data-ga-category="navigation"
			data-ga-action="header-logo"
			data-ga-label="@attr:href"></a>
	</div>

This will send tracking data to Google on click of the <a> element. The category and action are sent as the literal values provided. The label sent is the value of the href attribute of the clicked tab, in this case the URL that is linked to.

The full list of supported atributes is:

	data-ga-event
			name of event to listen to. Can be 'click' or 'submit'.
	data-ga-category
			category sent in tracking event
	data-ga-action
			action sent in tracking event
	data-ga-label
			label sent in tracking event
	data-ga-value
			value sent in tracking event
	data-ga-noninteractive
			if "true" or "1" then event is sent as non-interactive
	data-ga-terminate
			if "true" or "1" then event stopPropagation and preventDefault
			are called.
	data-ga-delay
			if specified, it's value needs to be the number of milliseconds
			to delay before triggering.

data-ga-category, data-ga-action, data-ga-label and data-ga-value attributes all use the same syntax for specifying values. If the attribute value is a JSON object, which will start with '{', the object specifies an expression for getting the value. Otherwise the value is interpreted as a literal. If a JSON object is provided, it can be of one of the following forms:

	@attr:name 
			get attribute value of this element
			e.g. data-ga-label="@attr:href"

	@attr:name,@sel:selector
			get attribute value of another element
			e.g. data-ga-label="@attr:value,@sel:#myfield"

	@attr:name,@sel:someSelector,@this
			get attribute value of another element, but within the current element i.e uses $(someSelector, $el)
			e.g. data-ga-label="@attr:value,@sel:span,@this"
	


	@call:functionName
			call a named function to evaluate the value. This may be prohibited
			by content policy. The function is called with the matching
			element as a parameter. The function name is evaluated in the
			global name space.
			e.g. data-ga-label="@call:someobject.myMethod"

Note you can also inject template variables, which allows server-side determination of :

	<div class="logo">
		<a href="$HomePageLink"
			data-ga-event="click"
			data-ga-category="$NavigationCategory"
			data-ga-action="header-logo"
			data-ga-label="@attr:href"></a>
	</div>


## Using JavaScript events

If you prefer using JavaScript to initiate event tracking, or have requirements that are not met by the simplified DOM class mechanism, the module also supports registering DOM listeners by jQuery selector.

An advantage this has over using DOM classes is that you can programmatically control the properties sent to Google. The disadvantage is that you cannot inject property values easily.

	tracker.addEventDef(
		'myEvent',
		'click',
		'',
		'.ga-content-container a[rel!="external"]',
		null,
		100,
		0,
		{
			"eventCategory": "navigation",
			"eventAction": function() { return 'linked-content' },
			"eventLabel": function() { return $(this).attr('href') },
			"eventValue": function() { return null },
			"nonInteraction": false
		}
	);

This works by registering a listener against DOM elements that match the selector. The parameters are:

	id (string)
			a unique name you give to each rule
	names
			event name, such as "click" or "submit"
	bodyClasses (string)	
			if present, rule only applies if body matches these classes.
	selector (string)
			selector to match against. Event listener is attached to this
			element.
	delegate
			if set, it is a selector that the listener is attached to instead
			of the selector, and the selector is used to filter components.
			Correlates to $(delegate).on(names, selector)
	delayMS
			if set, specifies a number of milliseconds to wait before triggering the event using jQuery.simulate. Also terminates
			the originating event.
	terminateEvent
			if true, causes event.preventDefault and event.stopPropagation.
	googleEventData (object)
			an object to pass to GA tracking. The object can have properties:
					eventCategory
					eventAction
					eventLabel
					eventValue
					nonInteraction
			The first 4 parameters can be a literal string, or can be a
			function that returns a string.


# Notes

May need to include jquery simulate
Relies on framework jquery
