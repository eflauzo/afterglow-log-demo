
import Dexie from 'dexie';

export interface IDataValue {
    index: number;
    value: number;
}


export class CurveDatabase extends Dexie {
    values: Dexie.Table<IDataValue, number>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({
            values: '&index, value'
        });
    }
}

export class CurveCache {
  db: CurveDatabase;
  constructor(name: string) {
    this.db = new CurveDatabase(name)
  }

  add_value(index: number, value: number){
    this.db.values.add({index:index, value:value}).catch(e => {
      console.log("error:", e)
    })
  }
}





export interface IDataInterval {
    start: number;
    end: number;
}

export class IntervalDatabase extends Dexie {
    intervals: Dexie.Table<IDataInterval, number>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({
            values: '&start, end'
        });
    }
}

export class IntervalCache {
  db: IntervalDatabase;
  constructor(name: string) {
    this.db = new IntervalDatabase(name.concat('_intervals'))
  }

  /*
  add_value(index: number, value: number){
    this.db.values.add({index:index, value:value}).catch(e => {
      console.log("error:", e)
    })
  }
  */

 /*


  X---X     X------X             X-----X              X-----X     X---X

                 |----------------------------------------|
               start                                     end
 */



  mark_interval_as_loaded(start: number, end:number) {
    //this.db.intervals.where("start").between(monitor._start, monitor._end).toArray(got_data => {

    // within one transaction
    // find all interval that end is greater (or equal?) to provided start
    // and start is less then provided end
    // for each found element:
    //     if found interval start is less then provided start new interval start to be set to found interval start
    //     if found interval end is greater then provided end then new interval end to be set to found interval end
    //     delete interval
    // add new interva;

    //this.db

     //transaction is really not necessary we can communicate that interval
     //is being update by other means also if we read and there tranaction
     // probably not that big of a deal. probably over time we will serialize
     // all stuff that goes into database to make sure nothing fishy is going
     // on
      let mark_start = start;
      let mark_end = end;

      this.db.transaction('rw', this.db.intervals, () => {

              //
              // Transaction Scope
              //

              //this.db.intervals.where("end").above(start).and(this.db.intervals.where("start").below(end)).toArray(got_intervals => {
              this.db.intervals.where("end").above(start).and( interval => interval.start < end).toArray(got_intervals => {
                //this.db.intervals.where("end").above(start).toArray(got_intervals => {

                // probably most efficient way to do it is to query fist and last instead

                for (let v=0; v<got_intervals.length; v++) {
                  //console.log(">",got_data[v].index, " : ", got_data[v].value)
                  if (got_intervals[v].start < mark_start) {
                    mark_start = got_intervals[v].start;
                  }

                  if (got_intervals[v].end > mark_end) {
                    mark_end = got_intervals[v].end;
                  }
                }

              })

              // can we do something better, reuse query
              this.db.intervals.where("end").above(start).and( interval => interval.start < end).delete()
              //this.db.intervals.where("end").above(start).below(end).delete()
              //this.db.intervals.where("end").above(start).delete()

              this.db.intervals.add({start:mark_start, end:mark_end}).catch(e => {
                console.log("can not add interval error:", e)
              })

      }).then(function(result) {

          //
          // Transaction Committed
          //

      }).catch(function(error) {

          //
          // Transaction Failed
          //

      });


  }

  get_unloaded_range(start: number, end: number):Array<[number, number]> {
    // same as maesk interval (move to function?)
    // if found 0:
    //     return [start, end]
    // else:
    //     tail = None
    //     iterate over intervals:
    //     if tail is None:
    //         tail = end
    //     else:
    //         add_interval = [tail, i.start]
    //         tail = end;
    //     after loop
    //     if tail < end:
    //       add_interval = [tail, end]


    let range_start = start;
    let range_end = end;

    let result:Array<[number, number]> = []

    let unloaded:Array<[number, number]> = []


    this.db.transaction('rw', this.db.intervals, () => {

            //
            // Transaction Scope
            //

            //this.db.intervals.where("end").above(start).and(this.db.intervals.where("start").below(end)).toArray(got_intervals => {
            this.db.intervals.where("end").above(start).and( interval => interval.start < end).toArray(got_intervals => {
              //this.db.intervals.where("end").above(start).toArray(got_intervals => {

              // probably most efficient way to do it is to query fist and last instead
              for (let v=0; v<got_intervals.length; v++) {

                // if interval starts before range_start
                if (got_intervals[v].start <= range_start) {
                  if (got_intervals[v].end >= range_end) {
                    return [];
                  }

                  if (got_intervals[v].end > range_start) {
                    range_start = got_intervals[v].end;
                    continue;
                  }

                }

                // if interval ends after range_end
                if (got_intervals[v].end >= range_end) {
                  if (got_intervals[v].start <= range_start) {
                    return []
                  }

                  if (got_intervals[v].start <= range_end) {
                    range_end = got_intervals[v].start;
                    continue;
                  }
                }


                result.push([got_intervals[v].start, got_intervals[v].end])



              }
              /*
              for (let v=0; v<got_intervals.length; v++) {
                //console.log(">",got_data[v].index, " : ", got_data[v].value)
                if (got_intervals[v].start < mark_start) {
                  mark_start = got_intervals[v].start;
                }

                if (got_intervals[v].end > mark_end) {
                  mark_end = got_intervals[v].end;
                }
              }
              */

            })

            /*
            if (resut.Length) {

            }
            */
            let i_start = range_start;
            for (let loaded_interval of result) {
              let i_end = loaded_interval[0]
              unloaded.push([i_start, i_end])
              i_start = loaded_interval[1]
            }

            //last fragment will be missing
            unloaded.push([i_start, range_end])


            /*
            // can we do something better, reuse query
            this.db.intervals.where("end").above(start).and( interval => interval.start < end).delete()
            //this.db.intervals.where("end").above(start).below(end).delete()
            //this.db.intervals.where("end").above(start).delete()

            this.db.intervals.add({start:mark_start, end:mark_end}).catch(e => {
              console.log("can not add interval error:", e)
            })
            */

    }).then(function(result) {

        //
        // Transaction Committed
        //

    }).catch(function(error) {

        //
        // Transaction Failed
        //

    });



    return unloaded;
  }


}
