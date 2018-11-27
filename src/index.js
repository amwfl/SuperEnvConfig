import {storeSet, storeGet} from './util/store';
import {send, request} from './util/pipe';
import processBuildConfig from './util/processBuildConfigData';
import React from "react";
import ReactDOM from "react-dom";
import unfetch from "unfetch/dist/unfetch";
import TextField from "@material-ui/core/TextField";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from '@material-ui/core/Tooltip';
import Button from "@material-ui/core/Button";
import RemoveCircleOutline from "@material-ui/icons/RemoveCircleOutline";

import "./styles.css";

const objToArr = (obj, group) => (Object.keys(obj)
	.reduce((acc, k, i, a) => acc.concat({
		name: k,
		val: obj[k],
		group,
		origVal: obj[k]
	}), [])
);

const styles = {
	buttonAction: {
		position: "fixed",
		right: "1rem",
		bottom: "1rem",
		color: "#fff",
		backgroundColor: "#999"
	}
};

class App extends React.Component {
	state = { assetTypes: [], tabValue: "buildConfig", unsavedChanges: false };
	removeUnsavedChanges = () => {
		[...this.state.assetTypes, 'buildConfig']
			.reduce((acc, type) => acc.concat(this.state[type]), [])
			.forEach(v => delete v.newVal);
		this.forceUpdate();
	};
	hasUnsavedChanges = () => [...this.state.assetTypes, 'buildConfig']
		.reduce((acc, type) => acc.concat(this.state[type]), [])
		.some(v => v.newVal !== undefined);
	handleChange = item => event => {
		item.newVal = event.target.value;
		if (item.newVal === item.val) {
			delete item.newVal;
		}
		this.setState({unsavedChanges: this.hasUnsavedChanges()})
	};
	handleTabChange = (event, tabValue) => {
		this.setState({ tabValue });
	};
	handleResetValue = item => () => {
		if (item.val !== item.origVal) {
			item.newVal = item.origVal;
		} else {
			delete item.newVal;
		}
		this.setState({unsavedChanges: this.hasUnsavedChanges()})
	};
	handleCancel = () => {
		this.removeUnsavedChanges();
		this.setState({unsavedChanges: false});
		send('removeEnvConfig');
	};
	handleSave = () => {
		const {assetTypes, buildConfig} = this.state;
		assetTypes // SAVE ASSET OVERRIDES
			.reduce((acc, type) => acc.concat(this.state[type]), [])
			.filter(v => v.newVal !== undefined)
			.forEach(v => storeSet(`assets.${v.group}.${v.name}`, v.newVal));

		buildConfig // SAVE BUILD CONFIG OVERRIDES
			.filter(v => v.newVal !== undefined)
			.forEach(v => storeSet(`${v.group}.${v.name}`, v.newVal));

		this.removeUnsavedChanges();
		this.setState({unsavedChanges: false});
		send('reloadPage');
	};

	componentWillMount() {
		request('baseUrl')
		  .then(baseUrl => unfetch(`${baseUrl}/asset-manifest.json`))
		  .then(res => Promise.all([res.json(), request('buildConfigData')]))
		  .then(([assets, {buildConfig, buildConfigOrig}]) => {
			const assetTypes = Object.keys(assets);
			this.setState({assetTypes});
			const baseObj = assetTypes.reduce((acc, type) => Object.assign(acc, {[type]: objToArr(assets[type], type)}), {});
			baseObj.buildConfig = processBuildConfig(buildConfig, buildConfigOrig);
			const allAssetOverrides = assetTypes.reduce((acc, type) => acc.concat(
				Object.keys(assets[type]).map(name => storeGet(`assets.${type}.${name}`))
			), []);
			return Promise.all(allAssetOverrides).then(res => res
				.filter(o => o.value != null)
				.reduce((base, override) => {
					const [, group, name] = override.key.split('.');
					const obj = base[group].find(cfg => cfg.name === name);
					obj.val = override.value;
					return base;
				}, baseObj)
			);
		})
		.then(newState => this.setState(newState));
	}

	render() {
		const { tabValue, assetTypes, unsavedChanges } = this.state;
		const tabData = this.state[tabValue];
		return <div>
			<Tabs value={tabValue} onChange={this.handleTabChange}>
				<Tab value="buildConfig" label="Build Config" />
			{assetTypes.map(at => (
				<Tab key={at} value={at} label={at.replace(/([a-z])([A-Z])/g, '$1 $2')} />
			))}
			</Tabs>
			{tabData && (
				<form noValidate autoComplete="off">
				{tabData.map(v => (
					<TextField
						label={v.name}
						fullWidth
						key={v.name}
						value={v.newVal || v.val}
						onChange={this.handleChange(v)}
						margin="normal"
						InputProps={{
							endAdornment: ((v.newVal || v.val) !== v.origVal ? (
								<InputAdornment position="end">
									<Tooltip title="Remove Override">
										<IconButton onClick={this.handleResetValue(v)}><RemoveCircleOutline /></IconButton>
									</Tooltip>
								</InputAdornment>
							) : "")
						}}
					/>
				))}
				</form>
			)}
			{unsavedChanges && (
			<Button onClick={this.handleSave}
				style={Object.assign({}, styles.buttonAction, {
					right: "7rem",
					backgroundColor: "#357a38"
				})}
			>Save & Reload</Button>
			)}
			<Button onClick={this.handleCancel}
				style={styles.buttonAction}
			>Cancel</Button>
		</div>;
	}
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
