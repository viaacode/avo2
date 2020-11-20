import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

async function updateSitemap(): Promise<void> {
	if (!process.env.PROXY_URL) {
		throw 'Required environment variable is not set: PROXY_URL';
	}
	const response = await fetch(`${process.env.PROXY_URL}/sitemap.xml`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const sitemapXml = await response.text();
	fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemapXml);
}

console.info('Updating sitemap...');
// deepcode ignore UsageOfUndefinedReturnValue: False positive
updateSitemap()
	.then(() => console.info('Updating sitemap... done'))
	.catch(err => console.error('Failed to update sitemap: ', err));
