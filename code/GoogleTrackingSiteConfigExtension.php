<?php

/**
 * Extend site config with the properties that can be used while interacting with Google API services. The
 * values here are consumed by GoogleAPI::get_all_config(), which merges it with configuration in the config
 * system, so this is not the only source of configuration for Google API.
 */
class GoogleTrackingSiteConfigExtension extends DataExtension
{
	private static $db = array(
		'GoogleTrackingID' => 'Varchar(255)',
	);

	public function updateCMSFields(FieldList $fields)
	{
		// Get values from the config system, to act as placeholders for site config properties.
		$config = Config::inst();

		$fields->addFieldToTab('Root.GoogleAPI', $fld = new TextField(
			'GoogleTrackingID',
			'Google Tracking ID (looks like UA-nnnnnnnn-n)'
		));

		return $fields;
	}
}