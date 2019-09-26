/**
 * @author Blinking / https://blinking.fun/
 * 
 * MIT License
 * 
 * Copyright (c) 2019 Blinking
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

THREE.DrcobjLoader = function (manager) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

THREE.DrcobjLoader.prototype = {
  constructor: THREE.DrcobjLoader,
  setPath: function (value) { this.path = value; },
  setResourcePath: function (value) { this.resourcePath = value; }
};

THREE.DrcobjLoader.prototype.load = function (url, onLoad, onProgress, onDecodeProgress, onError) {

  var self = this;

  var extractUrlBase = function (url) {
    var index = url.lastIndexOf("/");
    if (index === - 1) return "./";
    return url.substr(0, index + 1);
  };

  var path = (this.path === undefined) ? extractUrlBase(url) : this.path;
  this.resourcePath = this.resourcePath || path;

  var fileLoader = new THREE.FileLoader(self.manager);
  fileLoader.setPath(self.path);
  fileLoader.setResponseType("arraybuffer");
  fileLoader.load(url, function (buffer) { self.parse(buffer, onLoad, onDecodeProgress); }, onProgress, onError);

};

THREE.DrcobjLoader.prototype.parse = function (buffer, onLoad, onDecodeProgress, isInflate) {

  if (self.objectLoader === undefined) { self.objectLoader = new THREE.ObjectLoader(); }
  self.objectLoader.setResourcePath(this.resourcePath);

  if (self.dracoLoader === undefined) {
    self.dracoLoader = new THREE.DRACOLoader();
    self.dracoLoader.setDecoderPath("./js/vendor/");
    self.dracoLoader.setDecoderConfig({ type: "wasm" });
  }

  if (isInflate === undefined) { isInflate = false; }

  if (isInflate) {
    var ui8Buffer = new Uint8Array(buffer);
    var inflate = new Zlib.Inflate(ui8Buffer);
    buffer = inflate.decompress().buffer;
  }

  var modelDataSize = (new Uint32Array(buffer, 0, 1))[0];
  var modelData = new Uint8Array(buffer, 4, modelDataSize);
  var jsonData = JSON.parse(THREE.LoaderUtils.decodeText(modelData));

  var geometriesDataOffset = 4 + modelDataSize;
  var finishCount = 0;

  function dec(i) {

    var geometryBufferStart = geometriesDataOffset + jsonData.geometries[i].data.offset;
    var geometryBufferEnd = geometryBufferStart + jsonData.geometries[i].data.byteLength;
    var geometryBuffer = buffer.slice(geometryBufferStart, geometryBufferEnd);

    self.dracoLoader.decodeDracoFile(geometryBuffer, function (geometry) {

      jsonData.geometries[i].data = geometry.toJSON().data;
      ++finishCount;

      if (onDecodeProgress !== undefined) { onDecodeProgress(finishCount / jsonData.geometries.length * 100); }
      if (finishCount === jsonData.geometries.length) { onLoad(self.objectLoader.parse(jsonData)); }

    });

  }

  for (var i = 0; i < jsonData.geometries.length; i++) { dec(i); }


};

THREE.DrcobjLoader.prototype.dispose = function () { self.dracoLoader.dispose(); };
