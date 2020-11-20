// tslint:disable:no-console
/**
 * This script runs over all files that match *.gql.ts and extracts the gql queries and whitelists them into the graphql database
 */
import axios, { AxiosResponse } from 'axios';
import glob from 'glob';
import _ from 'lodash';
import * as path from 'path';

const fs = require('fs-extra');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const NOT_FOUND_WHITELIST_COLLECTION_ERROR = 'not-exists';

if (!process.env.GRAPHQL_URL) {
	console.error(
		'Failed to whitelist graphql queries because environment variable GRAPHQL_URL is not set'
	);
}
if (!process.env.GRAPHQL_SECRET) {
	console.error(
		'Failed to whitelist graphql queries because environment variable GRAPHQL_SECRET is not set'
	);
}

async function fetchPost(body: any) {
	const url = (process.env.GRAPHQL_URL as string).replace('/v1/graphql', '/v1/query');
	const response: AxiosResponse<any> = await axios(url, {
		method: 'post',
		headers: {
			'x-hasura-admin-secret': process.env.GRAPHQL_SECRET as string,
		},
		data: body,
	});
	const errors = _.get(response, 'data.errors');
	if (errors) {
		throw new Error(`Failed to add whitelist to the database: ${JSON.stringify(errors)}`);
	}
	return response.data;
}

function whitelistQueries(collectionName: string, collectionDescription: string, gqlRegex: RegExp) {
	const options = {
		cwd: path.join(__dirname, '../src'),
	};

	glob('**/*.gql.ts', options, async (err, files) => {
		const queries: { [queryName: string]: string } = {};

		try {
			if (err) {
				console.error('Failed to find files using **/*.gql.ts', err);
				return;
			}

			// Find and extract queries
			files.forEach((relativeFilePath: string) => {
				try {
					const absoluteFilePath = `${options.cwd}/${relativeFilePath}`;
					const content: string = fs.readFileSync(absoluteFilePath).toString();

					let matches: RegExpExecArray | null;
					do {
						matches = gqlRegex.exec(content);
						if (matches) {
							const name = matches[1];
							const query = matches[2];
							if (query.includes('${')) {
								console.warn(
									`Extracting graphql queries with javascript template parameters isn't supported: ${name}`
								);
							}
							// Remove new lines and tabs
							// Trim whitespace
							queries[name] = query.replace(/[\t\r\n]+/gm, ' ').trim();
						}
					} while (matches);
				} catch (err) {
					console.error(`Failed to find queries in file: ${relativeFilePath}`, err);
				}
			});

			// Remove the query collection from the whitelist in graphsl
			try {
				await fetchPost({
					type: 'drop_collection_from_allowlist',
					args: {
						collection: collectionName,
					},
				});
			} catch (err) {
				// Ignore error if query collection doesn't exist
				if (_.get(err, 'response.data.code') !== NOT_FOUND_WHITELIST_COLLECTION_ERROR) {
					throw err;
				}
			}
			console.log('[QUERY WHITELISTING]: Removed from whitelist');

			// Delete the client whitelist collection in graphql
			try {
				await fetchPost({
					type: 'drop_query_collection',
					args: {
						collection: collectionName,
						cascade: false,
					},
				});
			} catch (err) {
				// Ignore error if query collection doesn't exist
				if (_.get(err, 'response.data.code') !== NOT_FOUND_WHITELIST_COLLECTION_ERROR) {
					throw err;
				}
			}
			console.log('[QUERY WHITELISTING]: Deleted collection');

			// Recreate the client whitelist collection in graphql
			await fetchPost({
				type: 'create_query_collection',
				args: {
					name: collectionName,
					comment: collectionDescription,
					definition: {
						queries: _.map(queries, (query: string, name: string) => ({
							name,
							// Remove query name
							query: query.replace(/^(query|mutation)\s?[^({]+([({])/gm, '$1 $2'),
						})),
					},
				},
			});
			console.log('[QUERY WHITELISTING]: Recreated collection');

			// Add query collection to whitelist
			await fetchPost({
				type: 'add_collection_to_allowlist',
				args: {
					collection: collectionName,
				},
			});
			console.log('[QUERY WHITELISTING]: Re-added collection to whitelist');

			const outputFile = path.join(__dirname, 'client-whitelist.json');
			await fs.writeFile(outputFile, JSON.stringify(queries, null, 2));

			console.log(
				`[QUERY WHITELISTING]: Whitelisted ${
					Object.keys(queries).length
				} queries in the graphql database. Full list: ${outputFile}`
			);
		} catch (err) {
			console.error(
				'Failed to extract and upload graphql query whitelist',
				JSON.stringify(err)
			);
		}
	});
}

// https://github.com/hasura/graphql-engine/issues/4138
whitelistQueries(
	'allowed-queries',
	'All queries the avo2 client is allowed to execute',
	/const ([^\s]+) = gql`([^`]+?)`/gm
);
// tslint:enable:no-console
