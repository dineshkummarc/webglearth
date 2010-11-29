
/**
 * @fileoverview Contains abstract class describing object providing tiles.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.texturing.TileProvider');

goog.require('goog.debug.Logger');

goog.require('we.texturing.Tile');



/**
 * Abstract class describing object providing tiles
 * @constructor
 */
we.texturing.TileProvider = function() {};


/**
 * @return {number} Minimum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMinZoomLevel = function() {return 0;};


/**
 * @return {number} Maximum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMaxZoomLevel = goog.abstractMethod;


/**
 * @return {number} Size of one side of the tile in pixels.
 */
we.texturing.TileProvider.prototype.getTileSize = goog.abstractMethod;


/**
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {string} URL of the tile.
 */
we.texturing.TileProvider.prototype.getTileURL = goog.abstractMethod;


/**
 * @type {!function(we.texturing.Tile)}
 */
we.texturing.TileProvider.prototype.tileLoadedHandler = goog.nullFunction;


/**
 * Determines URL for given tile and starts loading it.
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 */
we.texturing.TileProvider.prototype.loadTile = function(zoom, x, y) {
  var tile = new we.texturing.Tile();
  tile.zoom = zoom;
  tile.x = x;
  tile.y = y;
  tile.image = new Image();
  var onload = function(tileprovider) {return (function() {
    //if (goog.DEBUG)
    //  we.texturing.TileProvider.logger.info('Loaded tile ' + tile.getKey());
    tileprovider.tileLoadedHandler(tile);
  })};
  tile.image.onload = onload(this);
  tile.image.src = this.getTileURL(zoom, x, y);
  //if (goog.DEBUG)
  //  we.texturing.TileProvider.logger.info('Loading tile ' + tile.getKey());
};


/**
 * Fills given Element with copyright info.
 * @param {!Element} element Element where the copyright info
 * should be appended to.
 */
we.texturing.TileProvider.prototype.appendCopyrightContent =
    function(element) {};


/**
 * Returns URL of the logo that should be displayed somewhere.
 * @return {?string} Url of the logo or null if not required.
 */
we.texturing.TileProvider.prototype.getLogoUrl = function() {return null;};


/**
 * @type {!function(we.texturing.TileProvider)}
 */
we.texturing.TileProvider.prototype.copyrightInfoChangedHandler =
    goog.nullFunction;

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.texturing.TileProvider.logger =
      goog.debug.Logger.getLogger('we.texturing.TileProvider');
}
