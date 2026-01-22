import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './components/App';

if (typeof window !== 'undefined') {
	hydrate(<App />, document.getElementById('app'));
}

export async function prerender(data) {
	return await ssr(<App {...data} />);
}
