import React, { Component } from 'react';
import {Table, TableData} from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      // CHANGED schema to track ratio of 2 stock prices rather than individual stock price
      // also added upper and lower bounds of the ratio to helo users determine trading opportunity
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float'
      // stock: 'string',
      // top_ask_price: 'float',
      // top_bid_price: 'float',
      // timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      // CHANGED: removed column pivots because we care abour ratio not individual stock
      // aggregates consolidates duplicate data into 1 data point
      // a data point is unique if it has a timestamp so if it is not unique,
      // we average the values of the other non-unique fiels
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      // elem.setAttribute('column-pivots', '["stock"]');
      elem.setAttribute('row-pivots', '["timestamp"]');
      // elem.setAttribute('columns', '["top_ask_price"]');
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      // elem.setAttribute('aggregates', JSON.stringify({
      //   stock: 'distinctcount',
      //   top_ask_price: 'avg',
      //   top_bid_price: 'avg',
      //   timestamp: 'distinct count',
      // }));
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg'
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
        // CHANGED argument of this.table.update
      ] as unknown as TableData);
    }
  }
}

export default Graph;
