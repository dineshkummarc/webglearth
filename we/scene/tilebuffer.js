
/**
 * @fileoverview Object managing level 1 (buffer) and encapsulating
 *               level 2 cache for given TileProvider.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.TileBuffer');
goog.provide('we.scene.TileBuffer.Slot');

goog.require('goog.array');
goog.require('goog.debug.Logger');

goog.require('we.texturing.Tile');
goog.require('we.texturing.TileCache');
goog.require('we.texturing.TileProvider');



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of the buffer in tiles.
 * @param {number} height Height of the buffer in tiles.
 * @constructor
 */
we.scene.TileBuffer = function(tileprovider, context, width, height) {
  this.tileProvider_ = tileprovider;
  this.tileSize_ = this.tileProvider_.getTileSize();
  this.tileCache_ = new we.texturing.TileCache(tileprovider);
  //this.tileCache.delayedLoadHandler = goog.bing(this.bufferTile, this);

  this.gl_ = context.gl;

  var gl = this.gl_;

  this.bufferTexture = gl.createTexture();
  this.metaBuffer = new Float32Array(width * height * 3);

  this.bufferWidth_ = width;
  this.bufferHeight_ = height;

  if (goog.DEBUG)
    we.scene.TileBuffer.logger.info('Creating buffer ' +
        this.bufferWidth_ * this.tileSize_ + 'x' +
        this.bufferHeight_ * this.tileSize_);

  gl.bindTexture(gl.TEXTURE_2D, this.bufferTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.bufferWidth_ * this.tileSize_, this.bufferHeight_ * this.tileSize_,
      0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);


  /*gl.bindTexture(gl.TEXTURE_2D, this.metaBufferTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
      this.tileSize_ * 2, this.tileSize_, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);*/



  this.slotList_ = [];
  for (var x = 0; x < width; ++x) {
    for (var y = 0; y < width; ++y) {
      this.slotList_.push(new we.scene.TileBuffer.Slot(x, y));
    }
  }
};


/**
 * @type {WebGLRenderingContext}
 * @private
 */
we.scene.TileBuffer.prototype.gl_ = null;


/**
 * @type {WebGLTexture}
 */
we.scene.TileBuffer.prototype.bufferTexture = null;


/**
 * @type {Float32Array}
 */
we.scene.TileBuffer.prototype.metaBuffer = null;


/**
 * @type {number}
 * @private
 */
we.scene.TileBuffer.prototype.bufferWidth_ = 0;


/**
 * @type {number}
 * @private
 */
we.scene.TileBuffer.prototype.bufferHeight_ = 0;


/**
 * @type {we.texturing.TileProvider}
 * @private
 */
we.scene.TileBuffer.prototype.tileProvider_ = null;


/**
 * @type {number}
 * @private
 */
we.scene.TileBuffer.prototype.tileSize_ = 0;


/**
 * @type {we.texturing.TileCache}
 * @private
 */
we.scene.TileBuffer.prototype.tileCache_ = null;


/**
 * @type {Array.<we.scene.TileBuffer.Slot>}
 * @private
 */
we.scene.TileBuffer.prototype.slotList_ = null;


/**
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 */
we.scene.TileBuffer.prototype.tileNeeded = function(zoom, x, y) {
  var key = we.texturing.Tile.createKey(zoom, x, y);
  var slot = goog.array.findRight(this.slotList_,
      function(slot, index, array) {
        return (!goog.isNull(slot.tile)) && (slot.tile.getKey() == key);
      });

  if (!goog.isNull(slot)) {
    slot.lastUse = goog.now();
  } else {
    this.bufferTileFromCache(zoom, x, y);
  }
};


/**
 * Finds the best match in L2 cache and puts it into buffer.
 * @param {number} zoom Zoom.
 * @param {number} x X.
 * @param {number} y Y.
 */
we.scene.TileBuffer.prototype.bufferTileFromCache = function(zoom, x, y) {
  var tile = this.tileCache_.retrieveTile(zoom, x, y);
  if (!goog.isNull(tile)) {
    this.bufferTile(tile);
  }
};


/**
 * Puts the tile into buffer
 * @param {!we.texturing.Tile} tile Tile to be buffered.
 */
we.scene.TileBuffer.prototype.bufferTile = function(tile) {
  //if (goog.DEBUG)
  //  we.scene.TileBuffer.logger.info('Buffering tile ' + tile.getKey());

  var gl = this.gl_;

  goog.array.sort(this.slotList_,
      function(slot1, slot2) {
        return slot1.lastUse - slot2.lastUse;
      });

  var slot = this.slotList_[0];

  gl.bindTexture(gl.TEXTURE_2D, this.bufferTexture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, slot.x * this.tileSize_,
      slot.y * this.tileSize_, gl.RGBA,
      gl.UNSIGNED_BYTE, tile.image);


  var slotId = (slot.y * this.bufferWidth_ + slot.x) * 3;

  this.metaBuffer[slotId] = tile.x;
  this.metaBuffer[slotId + 1] = tile.y;
  this.metaBuffer[slotId + 2] = tile.zoom;

  slot.tile = tile;
  slot.lastUse = goog.now();
};



/**
 * Object serving as level 2 cache for the TileProvider.
 * @param {number} x X.
 * @param {number} y Y.
 * @constructor
 */
we.scene.TileBuffer.Slot = function(x, y) {
  this.x = x;
  this.y = y;
};


/**
 * Last use of this tile
 * @type {number}
 */
we.scene.TileBuffer.Slot.prototype.lastUse = 0;


/**
 * Last use of this tile
 * @type {we.texturing.Tile}
 */
we.scene.TileBuffer.Slot.prototype.tile = null;

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.scene.TileBuffer.logger =
      goog.debug.Logger.getLogger('we.scene.TileBuffer');
}