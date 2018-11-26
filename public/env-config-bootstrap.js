
(function() {
	const frameElId = 'env-config-iframe';
	const frameStyle = `
		position: fixed; left: 5vw; top: 5vh;
		border-width: 0;
		opacity: 0;
		box-shadow: 0 0 500px 20px #000;
		background-color: #fff;
		z-index: 9999999999;
		height: 90vh; width: 90vw;
		transition: all 500ms;
	`;
	const frameEl = document.createElement('iframe');
	const frameSrc = window.ss.env.tools['env-config'];
	frameEl.setAttribute('id', frameElId);
	frameEl.setAttribute('style', frameStyle);
	frameEl.setAttribute('src', frameSrc);
	frameEl.onload = () => frameEl.style.opacity = '1';
	document.body.appendChild(frameEl);

	const handleType = {
		baseUrl: () => {
			const {protocol, host} = window.location;
			return `${protocol}//${host}`;
		},
		storeSet: ({key, value}) => {
			if (key == null) { return; }
			if (value === null) {
				sessionStorage.removeItem(key);
			} else if (value) {
				sessionStorage.setItem(key, value);
			}
		},
		storeGet: ({key}) => ({key, value: window.sessionStorage.getItem(key)})
	};
	window.addEventListener('message', msgEvt => {
		if (msgEvt.origin !== frameSrc) { return; }
		const {type, correlationId, data} = msgEvt.data;
		if (type == null) { return; }
		const res = handleType[type](data);
		if (correlationId != null) {
			frameEl.contentWindow.postMessage({
				type, correlationId, data: res
			}, '*');
		}
	});
}())
