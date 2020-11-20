#!/bin/bash

# Recreate config file
rm -rf ./env-config.js
touch ./env-config.js

# Add assignment
echo "window._ENV_ = {" >> ./env-config.js

# TODO get a list of env variables from the global .env file, so we don't need to maintain these in both locations
echo "  ENV: \"$ENV\"," >> ./env-config.js
echo "  PROXY_URL: \"$PROXY_URL\"," >> ./env-config.js
echo "  FLOW_PLAYER_TOKEN: \"$FLOW_PLAYER_TOKEN\"," >> ./env-config.js
echo "  FLOW_PLAYER_ID: \"$FLOW_PLAYER_ID\"," >> ./env-config.js
echo "  ZENDESK_KEY: \"$ZENDESK_KEY\"," >> ./env-config.js
echo "  LDAP_DASHBOARD_PEOPLE_URL: \"$LDAP_DASHBOARD_PEOPLE_URL\"," >> ./env-config.js
echo "  SSUM_ACCOUNT_EDIT_URL: \"$SSUM_ACCOUNT_EDIT_URL\"," >> ./env-config.js
echo "  SSUM_PASSWORD_EDIT_URL: \"$SSUM_PASSWORD_EDIT_URL\"," >> ./env-config.js
echo "  GOOGLE_ANALYTICS_ID: \"$GOOGLE_ANALYTICS_ID\"," >> ./env-config.js

echo "};" >> ./env-config.js
