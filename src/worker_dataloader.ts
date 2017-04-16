import {
    MSG_SUBSCRIBE,
    MSG_UNSUBSCRIBE,
    MSG_SET_RANGE_OF_INTEREST,
    MSG_REALTIME_DATA,
    MSG_HISTORICAL_DATA
}from "./common"

import {
    DataManager
}from "./data_manager"

import Wampy from "wampy";

//var postMessage:any = thispostMessage

//console.log("postMessage", postMessage)
function unixtime(): number{
  let now = Date.now() / 1000.0
  return now;
}

class RemoteDataManager extends DataManager {

    ws: Wampy

    constructor() {
        super()
        let z = setInterval(this.time_to_feed, 1000);
        this.start_comm()

    }

    time_to_feed = () => {
      console.log("time to feed a dog")

      for (let monitor_name of this._monitors.keys()) {
        //console.log("***");
        let monitor = this._monitors.get(monitor_name);

        //console.log("mon",monitor_name, "ch", monitor._channels)

        for (let channel_name of monitor._data_manager._channels_cache.keys()) {
          //if (channel_name != channel) {
          //  continue;
          //}

          //let chan_obj = monitor._channels.get(channel_name)
          let channel_data_cache =  monitor._data_manager._channels_cache.get(channel_name);

          //todo move this shit away so data cache would decide whether to pull  more data
          channel_data_cache.db.db.values.where("index").between(monitor._start, monitor._end).toArray(got_data => {

            let index_array:Array<number> = []
            let data_array:Array<number> = []

            for (let v=0; v<got_data.length; v++) {
              //console.log(">",got_data[v].index, " : ", got_data[v].value)
              index_array.push(got_data[v].index);
              data_array.push(got_data[v].value);
            }

            //console.log("data:", got_data)

            postMessage([
                MSG_HISTORICAL_DATA,
                monitor_name ,
                channel_name,
                [index_array,data_array]
                ]
              )

              //

          })

          //console.log("postMessage!");

        }
      }

    }


    subscribe_realtime_channel(channel: string) {
        let subscription_base = 'realtime.data_';
        let subscription = subscription_base.concat(channel)
        console.log("subscribing to:", subscription)
        this.ws.subscribe(subscription, {

            onSuccess: function() {
                console.log("successfuly subscribed to",subscription);
            },
            onError: function(err:any, details:any) {
                console.log("error", err, " = ", details);
            },
            onEvent: (array_data:any, object_data:any) => {

                let index:number = array_data[0][0];
                let value:number = array_data[0][1];

                let now = Date.now() / 1000.0
                //todo check that this monitor is interested in
                //realtime channel
                this.getChannelCache(channel).add_realtime(index, value)
                //console.log(this._monitors);
                //console.log("!!!");
                for (let monitor_name of this._monitors.keys()) {
                  //console.log("***");
                  let monitor = this._monitors.get(monitor_name);

                  //console.log("mon",monitor_name, "ch", monitor._channels)

                  for (let channel_name of monitor._channels) {
                    if (channel_name != channel) {
                      continue;
                    }
                    //console.log("postMessage!");
                    postMessage([
                        MSG_REALTIME_DATA,
                        monitor_name ,
                        channel,
                        [[index],[value]]
                        ]
                      )
                  }
                }
            }
        }

        );
    }

    start_comm() {

        this.ws = new Wampy(
            'ws://127.0.0.1:8080/ws', {
                realm: 'realm1',
                ws: WebSocket,
                onConnect: () => {
                    console.log('Connected to Router!');
                    for (let channel in this._subscriptions) {
                        this.subscribe_realtime_channel(channel)
                    }
                }
            }
        )
  }

subscribe_to_channel(channel:string): void {
    console.log("Wamp subscribe")
    this.subscribe_realtime_channel(channel);
}

unsubscribe_from_channel(channel:string): void {

}
}

let remote_data_manager = new RemoteDataManager()


function subscribe(msg: any) {
    let dataset_id = msg.data[1];
    let channel = msg.data[2];
    console.log("worker_dataloader subscribing dataset:", dataset_id, ' channel:', channel)
    //postMessage([MSG_DATA, msg.data[1] , [[1,2,3],[4,5,6]], ])
    remote_data_manager.getMonitor(dataset_id).monitorChannel(channel)
}

function unsubscribe(msg: any) {
    let dataset_id = msg.data[1];
    let channel = msg.data[2];
    console.log("worker_dataloader unsubscribing from dataset:", dataset_id, ' channel:', channel)
    remote_data_manager.getMonitor(dataset_id).stopMonitorChannel(channel)
}

function set_range_of_interest(msg: any) {
    let dataset_id = msg.data[1];
    let start = msg.data[2];
    let end = msg.data[3];
    let max_points = msg.data[4];
    console.log("worker_dataloader dataset:", dataset_id, ' range:', start, '..', end, ' cnt:', max_points)
    remote_data_manager.getMonitor(dataset_id)._start = start;
    remote_data_manager.getMonitor(dataset_id)._end = end;
    remote_data_manager.getMonitor(dataset_id)._max_points = max_points;
    remote_data_manager.getMonitor(dataset_id)._time_range_updated = unixtime()
}

self.onmessage = function(msg) {
    switch (msg.data[0]) {
        case MSG_SUBSCRIBE:
            subscribe(msg)
            break;

        case MSG_UNSUBSCRIBE:
            unsubscribe(msg)
            break;

        case MSG_SET_RANGE_OF_INTEREST:
            set_range_of_interest(msg);
            break;

        default:
            console.log('Unknown message received', msg);
    }
}
