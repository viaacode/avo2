export interface EventLogEntry {
	activity: string; // play media, add collection, add item
	agent: 'avo-logger';
	category_id: 1;
	component: 'client' | 'admin';
	// created_at: string; // generated by db
	environment: 'local' | 'int' | 'qas' | 'prd';
	is_system: number; // if done by system eg: sent email (-1 => false)
	message: {
		body?: string;
		object?: {
			identifier: string;
			type: 'user' | 'collection';
		};
		subject?: {
			identifier: string;
			type?: string;
		};
		form_fields?: { [key: string]: any };
	};
	namespace: string; // avo
	parent_id?: string; // link event together (trace id)
	timestamp: string; // create
	trace_id: any; // x-viaa-trace-id-header => x-hasura-trace-id
	// uuid: string; // generated by db
}
