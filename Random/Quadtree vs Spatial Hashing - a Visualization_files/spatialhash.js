(function(w) {
  'use strict';
  
  var DEFAULT_POWER_OF_TWO = 5;
  
  function makeKeysFn(shift) {
    return function(obj) {
      var sx = obj.x >> shift,
        sy = obj.y >> shift,
        ex = (obj.x + obj.width) >> shift,
        ey = (obj.y + obj.height) >> shift,
        x, y, keys = [];
      for(y=sy;y<=ey;y++) {
        for(x=sx;x<=ex;x++) {
          keys.push("" + x + ":" + y);
        }
      }
      return keys;
    };
  }  
  
  /**
  * @param {number} power_of_two - how many times the rects should be shifted
  *                                when hashing
  */
  function SpatialHash(power_of_two) {
    if (!power_of_two) {
      power_of_two = DEFAULT_POWER_OF_TWO;
    }
    this.getKeys = makeKeysFn(power_of_two);
    this.hash = {};
    this.list = [];
    this._lastTotalCleared = 0;
  }
  
  SpatialHash.prototype.clear = function() {
    var key;
    for (key in this.hash) {
      if (this.hash[key].length === 0) {
        delete this.hash[key];
      } else {
        this.hash[key].length = 0;
      }
    }
    this.list.length = 0;
  };
  
  SpatialHash.prototype.getNumBuckets = function() {
    var key, count = 0;
    for (key in this.hash) {
      if (this.hash.hasOwnProperty(key)) {
        if (this.hash[key].length > 0) {
          count++;
        }
      }
    }
    return count;
    
  };
  
  SpatialHash.prototype.insert = function(obj, rect) {
    var keys = this.getKeys(rect || obj), key, i;
    this.list.push(obj);
    for (i=0;i<keys.length;i++) {
      key = keys[i];
      if (this.hash[key]) {
        this.hash[key].push(obj);
      } else {
        this.hash[key] = [obj];
      }
    }
  };
  
  SpatialHash.prototype.retrieve = function(obj, rect) {
    var ret = [], keys, i, key;
    if (!obj && !rect) {
      return this.list;
    }
    keys = this.getKeys(rect || obj);
    for (i=0;i<keys.length;i++) {
      key = keys[i];
      if (this.hash[key]) {
        ret = ret.concat(this.hash[key]);
      }
    }
    return ret;
  };
  
  w.SpatialHash = SpatialHash;
})(this);