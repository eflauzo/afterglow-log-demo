/*

The way it should work

App may have one or more data sources registered.

Example:
   Current dataset (Dataset_Current) and let say yesterdays dataset (Dataset_Previous)
   Either of datasets may be shifted, to superimpose one dataset over another (less likely but also possible to shit individual curves of dataset)

To consumer (log plot engine for example), there should be no difference

However when data is requested from worker thread each dataset offset is specifiied:


SubscribeForRange {

  start: 1000.0,
  end: 1200.0

   'OPC1:channelA': {
        offset: 0.0;
  },

   'OPC2:channelB': {
        offset: 10.0;
    }

    'OPC3:channelC': {
         offset: -3.0;
     }
}

indexed are never altered in dataloader













//In general one will want
//When log object is created DataMonitor is created, in normal circumstances


//whenever log is scrolled message is passed









*/


/*
export class ChannelRef {
  datasource:DataCache
  channel:string
}
*/

import {
  CurveCache
} from "./data_buffer"

export class DataCache {
  //multilayer store

  db: CurveCache;

  constructor(name:string){
    this.db = new CurveCache(name);
  }

  add_realtime(time:number, value:number) {
    //cc.add_value(index, value);
    //console.log(' got data ', array_data[0], ' ::: ', array_data[1], "latency:", (now - array_data[0][0]));
    //onsole.log(' >>>> got data ', time, ', ', value);
    this.db.add_value(time, value)
  }


}

/*
interface DataHandler {
  //callback interface
  on_data(channels:Array<ChannelRef>,
  start:number,
  end:number,
  data_buf:any)
}
*/

export class DataMonitor {
  // data monitor is named instance that "remembers" range and channels
  // that somebody (logplot / gauge) is interested
  // channels are stored in shared place, but monitors are

  _channels: Set<string>;

  _start: number;
  _end: number;
  _max_points: number;

  //data_handler: DataHandler;
  _time_data_arrived: number;
  _time_range_updated: number;
  _time_data_produced: number;

  // unix timestamp when value was updated last
  // will only be updated if any of channels in the
  // range was updated
  //
  _data_manager: DataManager;

  constructor(data_manager:DataManager) {
    this._channels = new Set<string>()
    this._data_manager = data_manager;
  }

  monitorChannel(channel:string) {
    if (!this._channels.has(channel)) {
      this._channels.add(channel);
      this._data_manager._subscribe(channel);
    }
  }

  stopMonitorChannel(channel:string) {
    if (!this._channels.has(channel)) {
      this._channels.add(channel);
      this._data_manager._unsubscribe(channel);
    }
  }


}



export abstract class DataManager {

  //monitors: Map<DataMonitor>;

  // set of named monitors that "remember" what channels are used for which
  // data interval
  _monitors: Map<string, DataMonitor> = new Map<string, DataMonitor>()

  // dictionary for channel to its relevant store
  _channels_cache: Map<string, DataCache> = new Map<string, DataCache>()

  _subscriptions: Map<string, number> = new Map<string, number>()

  constructor(){

  }


  getMonitor(name:string):DataMonitor {
    if (this._monitors.has(name)) {
      return this._monitors.get(name)
    }

    let new_monitor = new DataMonitor(this);
    this._monitors.set(name, new_monitor);
    return new_monitor;
  }

  getChannelCache(name:string): DataCache {
    if (this._channels_cache.has(name)) {
      return this._channels_cache.get(name)
    }

    let new_channel_cache = new DataCache(name);
    this._channels_cache.set(name, new_channel_cache);
    return new_channel_cache;
  }

  _subscribe(channel:string) {
    // subscribe counts subscribtions and only if there was
    // 0 subscribtions to channel new subscribtion will
    // start, otherwise we only increment counter
    if (!this._subscriptions.has(channel)) {
      this._subscriptions.set(channel, 0);
    }

    let number_of_subscriptions = this._subscriptions.get(channel);

    let need_to_subscribe = number_of_subscriptions == 0;


    number_of_subscriptions += 1;
    this._subscriptions.set(channel, number_of_subscriptions);

    if (need_to_subscribe) {
      this.subscribe_to_channel(channel);
    }
  }

  _unsubscribe(channel:string) {
    // unsubscribe decremenets counter
    if (!this._subscriptions.has(channel)) {
      this._subscriptions.set(channel, 0);
    }
    let number_of_subscriptions = this._subscriptions.get(channel);
    number_of_subscriptions -= 1;
    this._subscriptions.set(channel, number_of_subscriptions);

    if (number_of_subscriptions == 0) {
        this.unsubscribe_from_channel(channel);
    }
  }

  abstract subscribe_to_channel(channel:string): void;
  abstract unsubscribe_from_channel(channel:string): void;

  //store(resolution, )
  //putData(string, channel, )

}
