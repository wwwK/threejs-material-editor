var Editor = function () {

  var self = this; self.isDebug = true; self.signals = {};

  var threeCore, stats;

  /*********************************************/
  /* 初始化                                     */
  /*********************************************/

  self.init = function () {

    // 3D初始化
    threeCore = self.threeCore = new ThreeCore();
    threeCore.init();

    materialEditor = self.materialEditor = new MaterialEditor(self);

    signalsInit();

    self.signals.inited.dispatch();

    // 性能监视器
    // stats = new Stats();
    // document.body.appendChild(stats.dom);

    // 监听文件拖放
    threeCore.container.addEventListener('drop', dropHandler);
    threeCore.container.addEventListener('dragover', dragoverHandler);

    // 监听窗口调整
    window.addEventListener("resize", threeCore.resizeRenderArea, false);

  };

  signalsInit = function signalsInit() {

    self.signals.inited = new signals.Signal();
    self.signals.inited.addOnce(materialEditor.init);
    self.signals.inited.addOnce(threeCore.setUpdate, { update: update });

    self.signals.objectImport = new signals.Signal();
    self.signals.objectImport.add(materialEditor.importObject);

    self.signals.textureImport = new signals.Signal();
    self.signals.textureImport.add(materialEditor.importTexture);

  };

  // 帧更新 
  function update() {

    threeCore.cameraController.update(); // 相机相关更新

    threeCore.renderer.render(threeCore.scene, threeCore.camera); // 渲染更新

    // stats.update(); // 性能监视器更新

  }

  /*********************************************/
  /* 拖放导入                                   */
  /*********************************************/

  function dragoverHandler(event) { event.preventDefault(); }

  function dropHandler(event) {

    event.preventDefault();

    loadFiles(event.dataTransfer.files);

  }

  // 加载文件
  function loadFiles(files) {

    if (files.length === 0) { return; }

    for (var i = 0; i < files.length; i++) { loadFile(files[i]); }

  }

  // 加载文件识别并处理
  function loadFile(file) {

    var filename = file.name;
    var extension = filename.split(".").pop().toLowerCase();

    var reader = new FileReader();

    // JSON文件（模型）
    if (extension === "json") {

      reader.addEventListener("load", function (event) {
        importObjectHandler(file, event.target.result);
      }, false);

      reader.readAsText(file);

      return;

    }

    // FBX文件（模型）
    if (extension === "fbx") {

      reader.addEventListener("load", function (event) {
        importFBXObjectHandler(file, event.target.result);
      }, false);

      reader.readAsArrayBuffer(file);

      return;

    }

    // DRCOBJ文件（模型）
    if (extension === "drcobj") {

      reader.addEventListener("load", function (event) {
        importDrcobjHandler(file, event.target.result);
      }, false);

      reader.readAsArrayBuffer(file);

      return;

    }

    // JPG/PNG（图片文件）
    if (extension === 'jpg' || extension === 'png') {

      reader.addEventListener("load", function (event) {
        importTextureHandler(file, event.target.result);
      }, false);

      reader.readAsDataURL(file);

      return;

    }

  }

  // 处理JSON对象文件
  function importObjectHandler(file, data) {

    var objectJson = JSON.parse(data);

    var object = threeCore.objectLoader.parse(objectJson);

    self.signals.objectImport.dispatch(object);

  }

  // 处理FBX对象文件
  function importFBXObjectHandler(file, data) {

    var object = threeCore.fbxLoader.parse(data);

    self.signals.objectImport.dispatch(object);

  }

  // 处理DRCOBJ对象文件
  function importDrcobjHandler(file, data) {

    threeCore.drcobjLoader.parse(data, function (object) {

      self.signals.objectImport.dispatch(object);

    });

  }

  // 处理纹理文件
  function importTextureHandler(file, data) {

    var image = document.createElement('img');

    image.addEventListener('load', function (event) {

      var texture = new THREE.Texture(this);
      texture.name = file.name;
      texture.format = file.type === 'image/jpeg' ? THREE.RGBFormat : THREE.RGBAFormat;
      texture.needsUpdate = true;

      self.signals.textureImport.dispatch(texture);

    }, false);

    image.src = data;

  }

};
