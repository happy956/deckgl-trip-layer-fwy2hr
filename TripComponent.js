import React, { useState, useEffect } from 'react';
import { Map } from 'react-map-gl';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import Slider from '@mui/material/Slider';


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


function renderLayers(props) {
  const trips = DATA_URL.TRIPS;
  const theme = DEFAULT_THEME;
  const empty = props.empty;
  const time = props.time;

  const arr = [];
  if (typeof empty === 'object') {
    Object.keys(empty).forEach(k => {
      let item = empty[k];
      let loc = item[0];
      let start = 0
      let end = 0
      if (Object.keys(item).length === 2) {
        start = item[1][0];
        end = item[1][1];
      } else {
        start = item[1][0];
        end = item[1][0];
      }
  
      if ((time >= start) & (time <= end)) {
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
      lineJointRounded: false,
      trailLength: 2,
      currentTime: time,
      shadowEnabled: false,
    }),
    new ScatterplotLayer({
      id: 'scatterplot',
      data: arr, // load data from server
      getPosition: (d) => [d[0], d[1]], // get lng,lat from each point
      getFillColor: (d) => [255, 255, 255],
      getRadius: (d) => 25,
      opacity: 0.9,
      pickable: false,
      radiusMinPixels: 3,
      radiusMaxPixels: 30,
    }),
  ];
}

export default function Main() {
  const minTime = 420;
  const maxTime = 1440;
  const animationSpeed = 10;
  const [time, setTime] = useState(minTime);
  const [empty, setEmpty] = useState({});
  const [animationFrame, setAnimationFrame] = useState('');
  const viewState = undefined;
  const mapStyle = 'mapbox://styles/spear5306/ckzcz5m8w002814o2coz02sjc';

  function animate() {
    setTime(time => {
      if (time > maxTime) {
        return minTime
      } else {
        return time + (0.01) * animationSpeed
      }
    })
    const af = window.requestAnimationFrame(animate);
    setAnimationFrame(af)
  }

  // useEffect(() => {
  //   fetch(mapStyle)
  //     .then(res => res.json())
  //     .then(data => console.log(data))
  // }, [])

  useEffect(() => {
    fetch(DATA_URL.EMPTY)
      .then(res => res.json())
      .then(data => {
        const dict = {};
        let idx = 0;
        data.forEach(item => {
          let path = item.path;
          let timestamp = item.timestamp;
          dict[idx] = [path, timestamp]
          idx += 1;
        })
        setEmpty({...dict})
      })
  }, []);

  useEffect(() => {
    animate()
    return () => window.cancelAnimationFrame(animationFrame);
  }, [])

  function SliderChange(value) {
    setTime(value.target.value)
  }

  return (
    <div>
      <DeckGL
        layers={renderLayers({'empty':empty, 'time':time})}
        effects={DEFAULT_THEME.effects}
        viewState={viewState}
        controller={true}
        initialViewState={INITIAL_VIEW_STATE}
        >
        <Map
          reuseMaps
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
        />
        <h1 style={{ color: 'red' }}>
          TIME : {(String(parseInt(Math.round(time) / 60) % 24).length === 2) ? parseInt(Math.round(time) / 60) % 24 : '0'+String(parseInt(Math.round(time) / 60) % 24)} : {(String(Math.round(time) % 60).length === 2) ? Math.round(time) % 60 : '0'+String(Math.round(time) % 60)}
        </h1>
      </DeckGL>
      <Slider id="slider" value={time} min={minTime} max={maxTime} onChange={SliderChange} track="inverted" aria-label="Default" valueLabelDisplay="auto" />
    </div>
  );
}