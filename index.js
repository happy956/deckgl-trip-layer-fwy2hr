import React, { Component } from 'react';
import { render } from 'react-dom';
import TripComponent from './TripComponent';
import './style.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: 'React'
    };
  }

  render() {
    return (
      <div>
        <TripComponent name={this.state.name} />
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
