interface Window {
	_ENV_: {
		PROXY_URL: string;
		FLOW_PLAYER_TOKEN: string;
		FLOW_PLAYER_ID: string;
		ZENDESK_KEY: string;
		LDAP_DASHBOARD_PEOPLE_URL: string;
		SSUM_ACCOUNT_EDIT_URL: string;
		SSUM_PASSWORD_EDIT_URL: string;
		GOOGLE_ANALYTICS_ID: string;
		PORT: string;
		NODE_ENV: string;
		ENV: 'local' | 'qas' | 'production';
	};
	APP_INFO: {
		version: string;
		mode: 'development' | 'production' | 'test';
	};
	zE: Function;
}
