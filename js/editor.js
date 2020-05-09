var Editor = function () {

  var self = this, threeCore, materialEditor; self.signals = {};

  self.init = function () {

    threeCore = self.threeCore = new ThreeCore(); threeCore.init();

    materialEditor = self.materialEditor = new MaterialEditor(self);

    threeCore.container.addEventListener("drop", dropHandler);
    threeCore.container.addEventListener("dragover", dragoverHandler);

    window.addEventListener("resize", threeCore.resizeRenderArea, false);

    signalsInit();
    self.signals.inited.dispatch();

  };

  function signalsInit() {

    self.signals.inited = new signals.Signal();
    self.signals.inited.addOnce(threeCore.setUpdate, { update: update });
    self.signals.inited.addOnce(materialEditor.init);

    self.signals.objectImport = new signals.Signal();
    self.signals.objectImport.add(materialEditor.importObject);

    self.signals.textureImport = new signals.Signal();
    self.signals.textureImport.add(materialEditor.importTexture);

  }

  function dragoverHandler(event) { event.preventDefault(); }

  function dropHandler(event) {
    event.preventDefault();
    loadFiles(event.dataTransfer.files);
  }

  function loadFiles(files) {
    if (files.length === 0) { return; }
    for (var i = 0; i < files.length; i++) { loadFile(files[i]); }
  }

  function loadFile(file) {

    var filename = file.name;
    var extension = filename.split(".").pop().toLowerCase();

    var reader = new FileReader();

    var readObject = function () {
      reader.addEventListener("load", function (event) {
        importObjectHandler(file, event.target.result);
      }, false); reader.readAsText(file);
    };

    var readObjectTF = function () {
      reader.addEventListener("load", function (event) {
        if (extension === "fbx") { importFBXObjectHandler(file, event.target.result); }
        else if (extension === "drcobj") { importDrcobjHandler(file, event.target.result); }
      }, false); reader.readAsArrayBuffer(file);
    };

    var readTexture = function () {
      reader.addEventListener("load", function (event) {
        importTextureHandler(file, event.target.result);
      }, false); reader.readAsDataURL(file);
    };

    switch (extension) {
      case "json": readObject(); break;
      case "fbx": case "drcobj": readObjectTF(); break;
      case "jpg": case "png": readTexture(); break;
      default: break;
    }

  }

  function importObjectHandler(file, data) {

    var objectJson = JSON.parse(data);

    if (threeCore.objectLoader === undefined) { threeCore.objectLoader = new THREE.ObjectLoader(); }

    var object = threeCore.objectLoader.parse(objectJson);
    self.signals.objectImport.dispatch(object);

  }

  function importFBXObjectHandler(file, data) {
    var object = threeCore.fbxLoader.parse(data);
    self.signals.objectImport.dispatch(object);
  }

  function importDrcobjHandler(file, data) {
    threeCore.drcobjLoader.parse(data, function (object) {
      self.signals.objectImport.dispatch(object);
    });
  }

  function importTextureHandler(file, data) {

    var image = document.createElement("img");

    image.addEventListener("load", function (event) {

      var texture = new THREE.Texture(this);
      texture.name = file.name;
      texture.format = file.type === "image/jpeg" ? THREE.RGBFormat : THREE.RGBAFormat;
      texture.needsUpdate = true;

      self.signals.textureImport.dispatch(texture);

    }, false); image.src = data;

  }

  function update() {
    threeCore.cameraController.update();
    threeCore.renderer.render(threeCore.scene, threeCore.camera);
  }

};
