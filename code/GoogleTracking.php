<?php

// A class for google tracking, mostly a placeholder for module configuration.
class GoogleTracking {
	
	/**
	 * Use this flag if you have a restricted content policy that prevents in-line javascript or
	 * retrieval of javascript from other domains (such as directly sourcing the
	 * universal tracking code from Google).
	 * When used, the module will require it's own copy of the universal analytics tracking JavaScript.
	 * 
	 * @config
	 * @var bool $self_hosted_tracking_js
	 */
	private static $self_hosted_tracking_js;

	/**
	 * This is the Google tracking ID that is passed to the google tracking JavaScript. This typically looks like
	 * UA-XXXXXXXX-X.
	 *
	 * @config
	 * @var string $tracking_id
	 */
	private static $tracking_id;
}