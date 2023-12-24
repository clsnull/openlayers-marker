import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import DragPan from 'ol/interaction/DragPan';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';

var pos = fromLonLat([103.3725, 24.208889]);
var layer = new TileLayer({
  source: new OSM()
});
var map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: pos,
    zoom: 2
  })
});
var markerDom = document.getElementById('marker');
var markerOverlay = new Overlay({
  position: pos,
  positioning: 'center-center',
  element: markerDom,
  stopEvent: false,
  dragging: false
});
map.addOverlay(markerOverlay);

// overlayDom是overlay的dom
// overlay是overlay
// 绑定属性框移动事件
var dragPan;
// 获取拖动对象
map.getInteractions().forEach(function(interaction){
    if (interaction instanceof DragPan) {
        dragPan = interaction;  
    }
});
// 监听鼠标点击事件
let offsetXY=[0,0];
markerDom.addEventListener('mousedown', function(evt) {
    dragPan.setActive(false);
    markerOverlay.set('dragging', true);
    // 获取事件点击的坐标值
    let evtCoord=map.getEventCoordinate(evt);
    let domCoord=markerOverlay.get("coordinate");
    // 计算鼠标点击位置和基点坐标(可能是div的左上角)之间的偏移量
    offsetXY=[evtCoord[0]-domCoord[0],evtCoord[1]-domCoord[1]];
});

// 监听鼠标释放事件
map.on('pointerup', function() {
    if (markerOverlay.get('dragging') === true) {
        dragPan.setActive(true);
        markerOverlay.set('dragging', false);
    }
});


// 添加连线图层
let vectorSource = new VectorSource({
  name:"overlayLineLayer_source",
});
let overlayLineLayer = new VectorLayer({
  source: vectorSource,
  name:"overlayLineLayer_layer",
  zIndex:15
});
const feature = new Feature({
  geometry: new Point(pos),
  label: 0,
})

overlayLineLayer.getSource().addFeature(feature)
map.addLayer(overlayLineLayer);

let stationGeom=feature.getGeometry();
let stationCoordinate=stationGeom.getCoordinates(); // 站点坐标
markerOverlay.set("stationCoordinate",stationCoordinate); // 保存站点坐标
// 监听地图分辨率改变事件，重新计算指向线的起点位置
let mapview=map.getView();
mapview.on("change:resolution",function(){
    // 计算图标顶点的坐标，也就是绘制的连线，应该指向图标的顶点
    // 计算方法，也就是获取图标的旋转角度，获取站点原始坐标，图标的宽高为30x46
    // 根据三角函数，已知斜边，求两个直角标的宽高，就可以使用sin和cos三角函数关系
    // 其中36是图标的不含外边框的高度
    let label=feature.get("label");
    let radian = 0; // 角度转弧度
    let picOffsetX=parseInt(36*Math.sin(radian));
    let picOffsetY=parseInt(36*Math.cos(radian));
    switch(label){
        case 0:
            picOffsetX=0;
            picOffsetY=36;
            break;
        case 90:
            picOffsetX=36;
            picOffsetY=0;
            break;
        case 180:
            picOffsetX=0;
            picOffsetY=-36;
            break;
        case 270:
            picOffsetX=-36;
            picOffsetY=0;
            break;
        default:
            radian = label * (Math.PI/180); // 角度转弧度
            picOffsetX=parseInt(36*Math.sin(radian));
            picOffsetY=parseInt(36*Math.cos(radian));
            break;
    }
    // 获取站点坐标的屏幕像素值,
    // 这里有一个问题，就是当地图第一次加载的时候，会出现stationPixel计算不正确的问题，通过设置地图渲染完成监听事件进行解决
    let stationPixel=map.getPixelFromCoordinate(stationCoordinate);
    // 计算屏幕像素偏移量
    stationPixel=[stationPixel[0]+picOffsetX,stationPixel[1]-picOffsetY];
    // if(feature.get("id")==26){
    //     console.log(stationPixel);
    // }
    let offsetCoordinate=map.getCoordinateFromPixel(stationPixel);
    markerOverlay.set("offsetCoordinate",offsetCoordinate); // 也就是偏移点坐标

    // 删除已有的连线
    let lineFeature=markerOverlay.get("line");
    let source=overlayLineLayer.getSource();
    if(lineFeature){
        source.removeFeature(lineFeature);
    }
    // 获取最新坐标
    let coor=markerOverlay.get("coordinate");
    if(coor){
        let tempOffset=map.getPixelFromCoordinate(coor);
        tempOffset=[tempOffset[0]+offset[0],tempOffset[1]+offset[1]]
        coor=map.getCoordinateFromPixel(tempOffset);
        // 绘制虚线,从overlay的基点位置，到图标的末点位置
        lineFeature = new Feature({
            geometry: new LineString([coor,offsetCoordinate])
        });
        markerOverlay.set("line",lineFeature);
        source.addFeature(lineFeature);
    }
});
let offset = [0, 0]
// 地图渲染完成之后，绘制第一条连线
map.once("rendercomplete",function(){
    // 计算图标顶点的坐标，也就是绘制的连线，应该指向图标的顶点
    // 计算方法，也就是获取图标的旋转角度，获取站点原始坐标，图标的宽高为30x46
    // 根据三角函数，已知斜边，求两个直角标的宽高，就可以使用sin和cos三角函数关系
    let label=feature.get("label");
    let radian = 0; // 角度转弧度
    let picOffsetX=parseInt(36*Math.sin(radian));
    let picOffsetY=parseInt(36*Math.cos(radian));
    switch(label){
        case 0:
            picOffsetX=0;
            picOffsetY=36;
            break;
        case 90:
            picOffsetX=36;
            picOffsetY=0;
            break;
        case 180:
            picOffsetX=0;
            picOffsetY=-36;
            break;
        case 270:
            picOffsetX=-36;
            picOffsetY=0;
            break;
        default:
            radian = label * (Math.PI/180); // 角度转弧度
            picOffsetX=parseInt(36*Math.sin(radian));
            picOffsetY=parseInt(36*Math.cos(radian));
            break;
    }
    // 获取站点坐标的屏幕像素值,
    // 这里有一个问题，就是当地图第一次加载的时候，会出现stationPixel计算不正确的问题
    let stationPixel=map.getPixelFromCoordinate(stationCoordinate);
    // 计算屏幕像素偏移量
    stationPixel=[stationPixel[0],stationPixel[1]];
    let offsetCoordinate=map.getCoordinateFromPixel(stationPixel);
    markerOverlay.set("offsetCoordinate",offsetCoordinate); // 也就是偏移点坐标

    // 删除已有的连线
    let lineFeature=markerOverlay.get("line");
    let source=overlayLineLayer.getSource();
    if(lineFeature){
        source.removeFeature(lineFeature);
    }
    // 获取最新坐标
    let coor=markerOverlay.get("coordinate");

    if(coor){
        let tempOffset=map.getPixelFromCoordinate(coor);
        tempOffset=[tempOffset[0]+offset[0],tempOffset[1]+offset[1]]
        coor=map.getCoordinateFromPixel(tempOffset);
        // 绘制虚线,从overlay的基点位置，到图标的末点位置
        lineFeature = new Feature({
            geometry: new LineString([coor,offsetCoordinate])
        });
        markerOverlay.set("line",lineFeature);
        source.addFeature(lineFeature);
    }
});

// 监听地图鼠标移动事件
map.on('pointermove', function(evt) {
  if (markerOverlay.get('dragging') === true) {
      // 将当前的鼠标位置减去偏移量,得到基点应该所处的位置
      // 基点位置，即overlay停靠到图标的位置
      let coor=[evt.coordinate[0]-offsetXY[0],evt.coordinate[1]-offsetXY[1]];
      markerOverlay.setPosition(coor);
      // 保存最新坐标，因为使用getPostion()方法无法获取overlay的坐标
      markerOverlay.set("coordinate",coor);


      // 删除已有的连线
      let lineFeature=markerOverlay.get("line");
      let source=overlayLineLayer.getSource();
      if(lineFeature){
          source.removeFeature(lineFeature);
      }
      // 计算偏移量,从基点位置，反求停靠点位置
      let tempOffset=map.getPixelFromCoordinate(coor);
      tempOffset=[tempOffset[0]+offset[0],tempOffset[1]+offset[1]]
      coor=map.getCoordinateFromPixel(tempOffset);
      // 绘制虚线,从overlay的基点位置，到图标的末点位置
      let offsetCoordinate=markerOverlay.get("offsetCoordinate");
      
      console.log(coor, offsetCoordinate)
      if(offsetCoordinate){
          lineFeature = new Feature({
              geometry: new LineString([coor,offsetCoordinate])
          });
          markerOverlay.set("line",lineFeature);
          source.addFeature(lineFeature);
      }
  }
});