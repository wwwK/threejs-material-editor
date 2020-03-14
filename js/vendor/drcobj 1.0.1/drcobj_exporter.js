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

THREE.DrcobjExporter = (function () {

  function DrcobjExporter() { }

  DrcobjExporter.prototype.parse = function (json, options) {

    var outputDataBuffer, sumGeometryBuffersByteLength = 0;

    if (options === undefined) { options = {}; }

    var drcGeometries = this.drcParse(json, options);

    for (var i = 0; i < json.geometries.length; i++) {

      var geometryBufferByteLength = drcGeometries[i].byteLength;

      json.geometries[i].data = {
        offset: sumGeometryBuffersByteLength,
        byteLength: geometryBufferByteLength
      };

      sumGeometryBuffersByteLength += geometryBufferByteLength;

    }

    var jsonBuffer = stringToByteArray(JSON.stringify(json));

    outputDataBuffer = new ArrayBuffer(4 + jsonBuffer.byteLength + sumGeometryBuffersByteLength);

    var modelDataSize = new Uint32Array(outputDataBuffer, 0, 1);
    var modelData = new Uint8Array(outputDataBuffer, 4, jsonBuffer.byteLength);
    var modelGeometries = new Int8Array(outputDataBuffer, 4 + jsonBuffer.byteLength, sumGeometryBuffersByteLength);

    modelDataSize[0] = jsonBuffer.byteLength;

    modelData.set(new Uint8Array(jsonBuffer));

    for (var j = 0, offset = 0; j < drcGeometries.length; j++) {

      modelGeometries.set(drcGeometries[j], offset);

      offset += drcGeometries[j].byteLength;

    }

    if (options.isDeflate) {

      var ui8OutputDataBuffer = new Uint8Array(outputDataBuffer);
      var deflate = new Zlib.Deflate(ui8OutputDataBuffer);

      outputDataBuffer = deflate.compress();

    }

    return outputDataBuffer;

  };

  DrcobjExporter.prototype.drcParse = function (json, options) {

    var drcGeometries = [];
    var dracoExporter = new THREE.DRACOExporter();
    var bufferGeometryLoader = new THREE.BufferGeometryLoader();

    if (options.decodeSpeed === undefined) { options.decodeSpeed = 5; }
    if (options.encodeSpeed === undefined) { options.encodeSpeed = 5; }
    if (options.encoderMethod === undefined) { options.encoderMethod = THREE.DRACOExporter.MESH_EDGEBREAKER_ENCODING; }
    if (options.quantization === undefined) { options.quantization = [16, 10, 8, 10, 8]; }
    if (options.exportUvs === undefined) { options.exportUvs = true; }
    if (options.exportNormals === undefined) { options.exportNormals = true; }
    if (options.exportColor === undefined) { options.exportColor = false; }

    for (var i = 0; i < json.geometries.length; i++) {

      var geometry = bufferGeometryLoader.parse(json.geometries[i]);
      var drcGeometry = dracoExporter.parse(geometry, options);

      drcGeometries.push(drcGeometry);

    }

    return drcGeometries;

  };

  function stringToByteArray(str) {

    var buffer = new ArrayBuffer(str.length);
    var bufferView = new Uint8Array(buffer);

    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufferView[i] = str.charCodeAt(i);
    }

    return buffer;

  }

  return DrcobjExporter;

})();

