
const createCorrelationId = (type = '') => `${type}_${Date.now()}_${~~(Math.random() * 99999)}`;
const correlations = {};
export const send = (type, data, correlationId = null) => window.parent.postMessage({type, data, correlationId}, '*');
export const request = (type, data) => new Promise((resolve, reject) => {
	const correlationId = createCorrelationId(type);
	const timer = setTimeout(reject, 5000);
	correlations[correlationId] = res => {
		clearTimeout(timer);
		resolve(res);
		delete correlations[correlationId];
	};
	send(type, data, correlationId);
});

window.addEventListener('message', msgEvt => {
	const {data} = msgEvt;
	if (typeof correlations[data.correlationId] === 'function') {
		correlations[data.correlationId](data.data);
	}
})
