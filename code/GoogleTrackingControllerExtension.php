<?php

/**
 * This class hooks into a Controller class to ensure that Google tracking requirements are loaded on every
 * Page load via onAfterInit extension call.
 */
class GoogleTrackingControllerExtension extends Extension {

	public function onAfterInit() {
		// inject requirements into page
		$this->requirements();
	}

	public function requirements() {
		$self_hosting = Config::inst()->get('GoogleTracking', 'self_hosted_tracking_js');

		// Require the universal analytics script. Either self-hosted or from google.
		if ($self_hosting) {
			// Require the copy of universal analytics script
			Requirements::javascript('googletracking/javascript/universal_analytics.js');
		} else {
			// Require a link to universal analytics from Google.
			Requirements::customScript("(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');");
		}

		// And get module specific and simulate, which it depends on.
		Requirements::javascript('googletracking/javascript/jquery.simulate.js');
		Requirements::javascript('googletracking/javascript/googletracking.js');
	}

	// Generate an HTML element that can be inserted into the head that will contain
	// the configuration propertised used by the javascript. This technique is used
	// instead of the more usual custom javascript (or hard-coding the config data into
	// template) so it will still work if custom javascript is not allowed by content
	// policy.
	public function GoogleTrackingConfiguration() {
		$siteConfig = SiteConfig::current_site_config();
		$tracking_id = $siteConfig->GoogleTrackingID;
		if (!$tracking_id) {
			$tracking_id = Config::inst()->get('GoogleTracking', 'tracking_id');
		}

		$tag = '<meta name="ga-tracking-config" ';
		$tag .= 'data-tracking-id="' . $tracking_id . '"';
		$tag .= '/>';

		return $tag;
	}
}
