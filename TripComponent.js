import React, { Component } from 'react';
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';

// Set your mapbox token here
const MAPBOX_TOKEN = `pk.eyJ1Ijoic3BlYXI1MzA2IiwiYSI6ImNremN5Z2FrOTI0ZGgycm45Mzh3dDV6OWQifQ.kXGWHPRjnVAEHgVgLzXn2g`; // eslint-disable-line

const DATA_URL = {
  TRIPS:
    'https://raw.githubusercontent.com/jihoyeo/mobilty-for-disabled/a7fe772f36fd19f37968511759305b79f4d36e7d/src/trips.json',
  EMPTY:
    'https://raw.githubusercontent.com/jihoyeo/mobilty-for-disabled/a7fe772f36fd19f37968511759305b79f4d36e7d/src/empty.json',
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000],
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70],
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect],
};

const INITIAL_VIEW_STATE = {
  longitude: 126.9779692,
  latitude: 37.566535,
  zoom: 9.5,
  pitch: 30,
  bearing: 0,
};

const landCover = [
  [
    [-74.0, 40.7],
    [-74.02, 40.7],
    [-74.02, 40.72],
    [-74.0, 40.72],
  ],
];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
    };
  }

  componentDidMount() {
    fetch(DATA_URL.EMPTY)
      .then((response) => response.json())
      .then((findresponse) => {
        const dict = {};
        let idx = 0;
        findresponse.map((item) => {
          var path = item.path;
          var timestamp = item.timestamps;
          dict[idx] = { path: path, timestamp: timestamp };
          idx += 1;
        });
        this.setState({
          empty: dict,
        });
      });
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const {
      loopLength = 1020, // unit corresponds to the timestamp in source data; 07~24시까지 총 17시간(1020분)을 시뮬레이션 시간으로 설정
      animationSpeed = 10, // unit time per minutes
    } = this.props;
    const timestamp = Date.now() / 1000;
    const loopTime = loopLength / animationSpeed;
    this.setState({
      time: ((timestamp % loopTime) / loopTime) * loopLength + 420, // 몇시부터 에니메이션 시작할지 설정 - 오전 7시부터 시작
    });
    this._animationFrame = window.requestAnimationFrame(
      this._animate.bind(this)
    );
  }
  _renderLayers() {
    const {
      //buildings = DATA_URL.BUILDINGS,
      trips = DATA_URL.TRIPS,
      empty = DATA_URL.EMPTY,
      //points = DATA_URL.POINTS,
      //trailLength = 10,
      theme = DEFAULT_THEME,
    } = this.props;

    const arr = [];
    if (typeof empty === 'object') {
      Object.keys(empty).map((k) => {
        var item = empty[k];
        var loc = item.path;
        if (Object.keys(item).length === 2) {
          var start = item.timestamp[0];
          var end = item.timestamp[1];
        } else {
          var start = item.timestamp[0];
          var end = item.timestamp[0];
        }

        if ((this.state.time >= start) & (this.state.time <= end)) {
          arr.push(loc);
        }
      });
    }

    return [
      // This is only needed when using shadow effects
      new PolygonLayer({
        id: 'ground',
        data: landCover,
        getPolygon: (f) => f,
        stroked: false,
        getFillColor: [0, 0, 0, 0],
      }),
      new TripsLayer({
        id: 'trips',
        data: trips,
        getPath: (d) => d.path,
        getTimestamps: (d) => d.timestamps,
        getColor: (d) =>
          d.vendor === 0 ? theme.trailColor0 : theme.trailColor1,
        opacity: 0.3,
        widthMinPixels: 5,
        rounded: true,
        trailLength: 2,
        currentTime: this.state.time,
        shadowEnabled: false,
      }),
      ,
      new ScatterplotLayer({
        id: 'scatterplot',
        data: arr, // load data from server
        getPosition: (d) => [d[0], d[1]], // get lng,lat from each point
        getColor: (d) => [255, 255, 255],
        getRadius: (d) => 25,
        opacity: 0.9,
        pickable: false,
        radiusMinPixels: 3,
        radiusMaxPixels: 30,
      }),
    ];
  }

  render() {
    const {
      viewState,
      mapStyle = 'mapbox://styles/spear5306/ckzcz5m8w002814o2coz02sjc',
      theme = DEFAULT_THEME,
    } = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={theme.effects}
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        controller={true}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={MAPBOX_TOKEN}
        />
        <h1 style={{ color: 'red' }}>
          TIME : {parseInt(Math.round(this.state.time) / 60) % 24} :{' '}
          {Math.round(this.state.time) % 60}
        </h1>
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
