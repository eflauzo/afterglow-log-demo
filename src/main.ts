// import {CxDisplay} from "../../../src/cathode/display"
// import {CxNode} from "../../../src/cathode/node"
// import {CxVisualizerColorArray} from "../../../src/cathode/visualizer_color_array"
// import {CxGeometry} from "../../../src/cathode/geometry"
// import {CxNodePayloadViewport} from "../../../src/cathode/node_payload_viewport"
// import {CxNodePayloadPerspective} from "../../../src/cathode/node_payload_perspective"
// import {CxNodePayloadTransform} from "../../../src/cathode/node_payload_transform"
// import {CxNodePayloadInteractive} from "../../../src/cathode/node_payload_interactive"
// import {CxNodePayloadName} from "../../../src/cathode/node_payload_name"
// import {CxNameManager} from "../../../src/cathode/name_manager"
// import {CxScene} from "../../../src/cathode/scene"
// import {CxRenderingContext} from "../../../src/cathode/rendering_context"
// import {
//   CxGrid,
//   CxSplitDirection
// } from "../../../src/cathode/ui_grid"
// import {
//   CxLogPlot,
//   CxLogDataProvider,
//   CxCurveData
// } from "../../../src/cathode/ui_log_plot"





import {
  CxDisplay,
  CxNode,
  CxVisualizerColorArray,
  CxGeometry,
  CxNodePayloadViewport,
  CxNodePayloadPerspective,
  CxNodePayloadTransform,
  CxNodePayloadInteractive,
  CxNodePayloadName,
  CxNameManager,
  CxScene,
  CxRenderingContext,
  CxGrid,
  CxSplitDirection,
  CxLogPlot,
  CxLogDataProvider,
  CxCurveData
} from "cathode"

import {
  DataManager
} from "./data_manager"

import {
  MSG_SUBSCRIBE,
  MSG_UNSUBSCRIBE,
  MSG_SET_RANGE_OF_INTEREST,
  MSG_REALTIME_DATA,
  MSG_HISTORICAL_DATA
}from "./common"

//let manager = new DataManager()

//let mon = manager.getMonitor("XXX");

//console.log("mon", mon)


//import {CxDisplay} from "cathode/cathode"

//console.log("1")

/*
import {CxDisplay} from "../../../src/cathode/display"
import {CxNode} from "../../../src/cathode/node"
import {CxVisualizerColorArray} from "../../../src/cathode/visualizer_color_array"
import {CxGeometry} from "../../../src/cathode/geometry"
import {CxNodePayloadViewport} from "../../../src/cathode/node_payload_viewport"
import {CxNodePayloadPerspective} from "../../../src/cathode/node_payload_perspective"
import {CxNodePayloadTransform} from "../../../src/cathode/node_payload_transform"
import {CxNodePayloadInteractive} from "../../../src/cathode/node_payload_interactive"
import {CxNodePayloadName} from "../../../src/cathode/node_payload_name"
import {CxNameManager} from "../../../src/cathode/name_manager"
import {CxScene} from "../../../src/cathode/scene"
import {CxRenderingContext} from "../../../src/cathode/rendering_context"
import {
  CxGrid,
  CxSplitDirection
} from "../../../src/cathode/ui_grid"
import {
  CxLogPlot,
  CxLogDataProvider,
  CxCurveData
} from "../../../src/cathode/ui_log_plot"
*/

/*
class CxDummyDataProvider implements CxLogDataProvider {
  subscribe_to_channel(channel_uri:string): void {

  }

  unsubscribe_from_channel(channel_uri: string): void {

  }

  set_range(start:number, end:number, max_points:number): void {
    console.log("Subscribing to ", start, " - ", end, " (max:",max_points)
  }

  get_data(channel_uri: string, start:number, end:number, max_points:number): CxCurveData {
    if (channel_uri == 'A'){
      let index:Array<number> = [];
      let values:Array<number> = [];
      for (let i=0; i<=1000; i++) {
        index.push(i + 550.0);
        values.push(Math.sin((i/1000)*3.14*10.0));
      }
      return <CxCurveData>[index, values]
    }
    else if (channel_uri == 'B'){
      let index:Array<number> = [];
      let values:Array<number> = [];
      for (let i=0; i<=1200; i++) {
        index.push(i + 600.02);
        values.push(Math.sin((i/1000)*3.14*30.0)*0.3);
      }
      return <CxCurveData>[index, values]
    } if (channel_uri == 'C'){
      let index:Array<number> = [];
      let values:Array<number> = [];
      for (let i=0; i<=900; i++) {
        index.push(i + 752.5);
        values.push(Math.sin((i/1000)*3.14*20.0));
      }
      return <CxCurveData>[index, values]
    }
    else {
      return <CxCurveData>[[],[]]
    }
  }
}
*/





class CxDataProvider implements CxLogDataProvider {
  my_id:number;
  manager: CxDataProviderManager;
  //data: CxCurveData;
  _channel_data: Map<string, CxCurveData> = new Map<string, CxCurveData>()
  fix:number = 3000.0;
  fv:number = 0.0;

  constructor(manager: CxDataProviderManager, provider_id:number){
    this.manager = manager;
    this.my_id = provider_id;
    //this.data = <CxCurveData>[[],[]]
  }

  subscribe_to_channel(channel_uri:string): void {
    this.manager.worker.postMessage([MSG_SUBSCRIBE, this.my_id, channel_uri]);
  }

  unsubscribe_from_channel(channel_uri: string): void {
    this.manager.worker.postMessage([MSG_UNSUBSCRIBE, this.my_id, channel_uri]);
  }

  set_range(start:number, end:number, max_points:number): void {
    let screen_width = 1024; //todo this is wrong
    console.log("Subscribing to ", start, "..", end, " (max: ",max_points*screen_width,' points')
    this.manager.worker.postMessage([MSG_SET_RANGE_OF_INTEREST, this.my_id, start, end, max_points*screen_width]);
  }

  get_data(channel_uri: string, start:number, end:number, max_points:number): CxCurveData {
    //return this.data
    //console.log("!!!!!@@@@@@@@@@@@@",channel_uri)

    if (!this._channel_data.has(channel_uri)){
      //console.log("?", channel_uri)
      return <CxCurveData>[[],[]];
    }
    //console.log("=>", channel_uri)
    return this._channel_data.get(channel_uri);
  }

  update_realtime(channel_uri:string, data:any) {
    console.log("realtime")
    if (!this._channel_data.has(channel_uri)){
      let new_data = <CxCurveData>[[],[]];
      this._channel_data.set(channel_uri, new_data)
    }
    let channel_data = this._channel_data.get(channel_uri);
    channel_data[0].push(data[0][0]);
    channel_data[1].push(data[1][0]);
  }

  update_historical(channel_uri:string, data:any) {
    console.log("historical")
    if (!this._channel_data.has(channel_uri)){
      let new_data = <CxCurveData>[[],[]];
      this._channel_data.set(channel_uri, new_data)
    }
    let channel_data = this._channel_data.get(channel_uri);
    channel_data[0] = data[0];
    channel_data[1] = data[1];
  }
}

class CxDataProviderManager {

  /*
  subscribe_to_channel(dataset_name, channel_uri:string): void {
    worker.postMessage([MSG_SUBSCRIBE, this.dataset_name, channel_uri]);
  }

  unsubscribe_from_channel(dataset_name, channel_uri: string): void {
    worker.postMessage([MSG_UNSUBSCRIBE, this.dataset_name, channel_uri]);
  }

  set_range_of_interest(dataset_name, start:number, end:number, max_points:number): void {
    //console.log("Subscribing to ", start, " - ", end, " (max:",max_points)
    worker.postMessage([MSG_UNSUBSCRIBE, this.dataset_name, channel_uri]);
  }

  get_data(dataset_name, channel_uri: string, start:number, end:number, max_points:number): CxCurveData {
    return <CxCurveData>[[],[]]
  }
  */
  worker:Worker; //TODO what type webworker is

  _provider_id_counter: number = 0;
  _providers: Map<number, CxDataProvider> = new Map<number, CxDataProvider>()

  need_range:boolean;

  constructor() {
     this.worker = new Worker("worker_dataloader.js")
     this.need_range = true;
  }

  start() {
    this.worker.onmessage  = (e) => {
       //console.log('Message received from worker:', e.data);
       //if
       let msg_id = e.data[0];
       let data_set = e.data[1];
       let curve = e.data[2];
       let data = e.data[3]
       if (this._providers.has(data_set)) {

          if (msg_id == MSG_REALTIME_DATA) {
              let provider = this._providers.get(data_set);
              provider.update_realtime(curve, data)
          }

          if (msg_id == MSG_HISTORICAL_DATA) {
              let provider = this._providers.get(data_set);
              provider.update_historical(curve, data)
          }



       }

       if (this.need_range){
         //plot.start_index = 3000.0 + (1489708739.821938/3600.0); //
         plot.start_index = data[0][0];
         this.need_range = false;
       }
     }
  }

  new_provider():CxDataProvider {
      this._provider_id_counter += 1;
      let result = new CxDataProvider(this, this._provider_id_counter)
      this._providers.set(this._provider_id_counter, result)
      return result
  }
}



//
// class HelloWorldTriangle implements CxGeometry{
//
//   preorder(context: CxRenderingContext): void {
//
//   }
//   vertices(context: CxRenderingContext): Float32Array {
//     //console.log('(((())))')
//     return new Float32Array([
//     0.0,  1.0, 0.0,
//    -1.0, -1.0, 0.0,
//     1.0, -1.0, 0.0,
//     ]);
//   }
//   colors(context: CxRenderingContext): Float32Array {
//     return new Float32Array([
//     1.0, 0.0, 0.0, 1.0,
//     0.0, 1.0, 0.0, 1.0,
//     0.0, 0.0, 1.0, 1.0,
//     ])
//   }
//   texture(context: CxRenderingContext): Float32Array {
//     return null;
//   }
//   normals(context: CxRenderingContext): Float32Array {
//     return null;
//   }
// }
//
//


//
//     root
//       |
//       - interactive
//       \    |
//        \---- Viewport
//               |
//               - perspective projection node
//                   |
//                   |
//                   ----- translate
//                             |
//                             - Name
//                                  |
//                                - Visualizer - HelloWorldTriangle
//
//




let data_provider = new CxDataProviderManager();

let scene = new CxScene();

var display = new CxDisplay("screen01");

let canva = document.getElementById("screen01");

var interactive_payload = new CxNodePayloadInteractive(<HTMLCanvasElement>canva, scene);

var interactive_node = new CxNode([interactive_payload])

var viewport1 = new CxNodePayloadViewport();
viewport1.viewport = [0.1,0.1,0.5,0.5]
viewport1.clear_color = [1.0, 0.0, 0.0, 1.0]

var viewport2 = new CxNodePayloadViewport();
viewport2.viewport = [0.8,0.8,0.1,0.1]
viewport2.clear_color = [1.0, 0.0, 1.0, 1.0]

var viewport_node1 = new CxNode([viewport1])
var viewport_node2 = new CxNode([viewport2])

var perspective_node = new CxNode([new CxNodePayloadPerspective()])

var name_node = new CxNode([new CxNodePayloadName(4)])

var transform = new CxNodePayloadTransform()
transform.translate = [ 0.0, 0.0 , -5.0]

var transform_node = new CxNode([transform])

// var visualizer_node = new CxNode([
//     new CxVisualizerColorArray(new HelloWorldTriangle())
//   ]
// )

var root = new CxNode([]);



var grid = new CxGrid(scene);
grid.split.volume = 0.40;
grid.split.direction = CxSplitDirection.CxHorizontalSplit;
//grid.split.subsplitA = hSplit;
//grid.split.subsplitB = vSplit;

//var x = new CxDummyDataProvider("dataset1")
//

let x = data_provider.new_provider()
x.subscribe_to_channel("A");
x.subscribe_to_channel("B");
x.subscribe_to_channel("C");
//x.unsubscribe_from_channel("channelA");
x.set_range(1000.0, 1500.0, 1024.0)

let plot = new CxLogPlot(scene, x);
grid.split.sceneB = plot;

plot.template.index_resolution = 60.0 * 15.0
plot.template.index_divisions = 60.0


root.items.push(interactive_node)

let grid_node = new CxNode([grid])

root.items.push(grid_node)

interactive_node.items.push(grid_node)

perspective_node.items.push(transform_node)
transform_node.items.push(name_node)
//name_node.items.push(visualizer_node)

scene.root = root;

data_provider.start()

display.start(scene)
