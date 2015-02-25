#!/bin/bash
#
# This script will retrieve the universal_analytics script from Google servers and copy it into this
# repo in the javascript folder. This can be used if the content policy prohibits scripts from third party
# servers.
# The script should be run with current working diretory being the scripts directory.
wget --output-file=../javascript/universal_analytics.js http://www.google-analytics.com/universal_analytics.js