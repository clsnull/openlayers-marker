import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { OSM, Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import { Style, Icon, Fill, Text } from 'ol/style'
import { Translate, Draw } from 'ol/interaction'

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource({ wrapX: false });

const vector = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
  }),
});
const styles = {
  Point: {
    'circle-radius': 5,
    'circle-fill-color': 'red',
  },
  LineString: {
    'circle-radius': 5,
    'circle-fill-color': 'red',
    'stroke-color': 'yellow',
    'stroke-width': 2,
  },
  Polygon: {
    'circle-radius': 5,
    'circle-fill-color': 'red',
    'stroke-color': 'yellow',
    'stroke-width': 2,
    'fill-color': 'blue',
  },
  Circle: {
    'circle-radius': 5,
    'circle-fill-color': 'red',
    'stroke-color': 'blue',
    'stroke-width': 2,
    'fill-color': 'yellow',
  },
};

const typeSelect = document.getElementById('type');

let draw; // global so we can remove it later
function addInteraction() {
  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: source,
      type: typeSelect.value,
      style: styles[value],
    });
    map.addInteraction(draw);
  }
}

const labelFeatureCreater = (coordinate) => {
  const labelFeature = new Feature({
    geometry: new Point(fromLonLat(coordinate)),
  })

  labelFeature.setStyle(
    new Style({
      text: new Text({
        text: "测试点",
        textAlign: 'center',
        textBaseline: 'middle',
        font: 'bold 14px YaHei',
        fill: new Fill({ color: '#fff' }),
        backgroundFill: new Fill({ color: 'rgba(44, 45, 46, 0.6)' }),
        padding: [5, 5, 2, 5],
        offsetX: 0,
        offsetY: -55,
      }),
    }),
  )
  return labelFeature
}

const layer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 10,
})
layer.set('id', "shipStageTrajectory")

const pointFeatures = [labelFeatureCreater([103.32323,23.233])]

layer.getSource().addFeatures([...pointFeatures])
map.addLayer(layer)
map.addInteraction(new Translate())
// /**
//  * Handle change event.
//  */
// typeSelect.onchange = function () {
//   map.removeInteraction(draw);
//   addInteraction();
// };
// addInteraction();
