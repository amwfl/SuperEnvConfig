
export default function (buildConfig, buildConfigOrig) {
	window.console.log(buildConfig, buildConfigOrig);
	const buildConfigFlat = flatten(buildConfig);
	const buildConfigOrigFlat = flatten(buildConfigOrig);
	return Object.keys(buildConfigFlat).map(k => Object.assign(
		buildConfigFlat[k],
		{
			origVal: buildConfigOrigFlat[k].val
		}
	));
	// return buildConfigFlat;
}

const isOfType = (val, type) => (
	Object.prototype.toString.apply(val).split(' ')[1].slice(0, -1).toLowerCase() === type.toLowerCase()
);

function flatten(obj, path = '') {
	const valsInObj = Object.keys(obj)
		.filter(k => !isOfType(obj[k], 'object'))
		.reduce((acc, k) => Object.assign(acc, {
			[`${path}${!!path ? '.' : ''}${k}`]: {
				name: `${path}${!!path ? '.' : ''}${k}`,
				val: obj[k],
				group: 'buildConfig',
				origVal: obj[k]
		}}), {});
	const objsInObj = Object.keys(obj)
		.filter(k => isOfType(obj[k], 'object'))
		.reduce((acc, k) => Object.assign(
			acc, flatten(obj[k], `${path}${!!path ? '.' : ''}${k}`)
		), {});
	return Object.assign(valsInObj, objsInObj);
}
