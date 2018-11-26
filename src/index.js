import {storeSet, storeGet} from './util/store';
import {request} from './util/pipe';
import React from "react";
import ReactDOM from "react-dom";
import unfetch from "unfetch/dist/unfetch";
import TextField from "@material-ui/core/TextField";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import RemoveCircleOutline from "@material-ui/icons/RemoveCircleOutline";
import Save from "@material-ui/icons/Save";

import "./styles.css";

const objToArr = (obj, group) =>
  Object.keys(obj).reduce(
    (acc, k, i, a) =>
      acc.concat({
        name: k,
        url: obj[k],
        group,
        origUrl: obj[k]
      }),
    []
  );

const styles = {
  saveButton: {
    position: "absolute",
    right: "1rem",
    bottom: "1rem",
    backgroundColor: "#357a38",
    color: "#fff"
  }
};

class App extends React.Component {
  state = { assetTypes: [], tabValue: "uiModules", unsavedChanges: false };
  handleChange = item => event => {
    item.url = event.target.value;
    this.forceUpdate();
  };
  handleTabChange = (event, tabValue) => {
    this.setState({ tabValue });
  };
  handleResetValue = item => () => {
    item.url = item.origUrl;
    this.setState({unsavedChanges: true});
    this.forceUpdate();
  };
  handleSave = () => {
    const {assetTypes} = this.state;
    assetTypes
        .reduce((acc, type) => acc.concat(this.state[type]), [])
        .forEach(v => {
            const storePath = `assets.${v.group}.${v.name}`;
            storeSet(storePath, (v.url !== v.origUrl ? v.url : null));
        // this.forceUpdate();
        });
  };

  componentWillMount() {
    request('baseUrl')
      .then(baseUrl => unfetch(`${baseUrl}/asset-manifest.json`))
      .then(res => res.json())
      .then(assets => {
        const assetTypes = Object.keys(assets);
        this.setState({assetTypes});
        const baseObj = assetTypes.reduce((acc, type) => Object.assign(acc, {[type]: objToArr(assets[type], type)}), {});
        const allAssetOverrides = assetTypes.reduce((acc, type) => acc.concat(
            Object.keys(assets[type]).map(name => storeGet(`assets.${type}.${name}`))
        ), []);
        return Promise.all(allAssetOverrides).then(res => res
            .filter(o => o.value != null)
            .reduce((base, override) => {
                const [, group, name] = override.key.split('.');
                window.console.log('base[group]', base[group], base, group);
                const obj = base[group].find(cfg => cfg.name === name);
                obj.url = override.value;
                return base;
            }, baseObj)
        );
      })
      .then(newState => this.setState(newState));
  }

  render() {
    const { tabValue, assetTypes } = this.state;
    const tabData = this.state[tabValue];
    return (
      <div>
        <Tabs value={tabValue} onChange={this.handleTabChange}>
          {assetTypes.map(at => <Tab key={at} value={at} label={at} />)}
        </Tabs>
        {tabData && (
            <form noValidate autoComplete="off">
            {tabData.map(v => (
              <TextField
                label={v.name}
                fullWidth
                key={v.name}
                value={v.url}
                onChange={this.handleChange(v)}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {v.url !== v.origUrl ? (
                        <IconButton
                          aria-label="Toggle password visibility"
                          onClick={this.handleResetValue(v)}
                        >
                          <RemoveCircleOutline />
                        </IconButton>
                      ) : (
                        ""
                      )}
                    </InputAdornment>
                  )
                }}
              />
            ))}
            </form>
        )}
        <Button
          variant="fab"
          onClick={this.handleSave}
          style={styles.saveButton}
        >
          <Save />
        </Button>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
