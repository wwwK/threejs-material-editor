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


var MaterialEditor = function (editor) {

  var self = this;

  var currentObject, objectList = {}, objectNameList = [], boxHelper;
  var currentMaterial, materialList = {}, materialNameList = [];
  var currentTexture, textureList = {}, textureNameList = ["空"]; self.optionControllers = [];

  var materialEditorGUI, sceneFolder, objectListFolder, materialListFolder, meshMaterialFolder, textureFolder;
  var meshBasicMaterialFolder, meshLambertMaterialFolder, meshPhongMaterialFolder, meshStandardMaterialFolder, meshPhysicalMaterialFolder;
  var objectController, materialNameController, materialTypeController;

  self.init = function () {

    createMenu();

    editor.signals.createMaterialEditor = new signals.Signal();
    editor.signals.addMaterialAttributes = new signals.Signal();

    addMaterialEditorToSignals();
    addMaterialAttributesToSignals();

  };

  function addMaterialEditorToSignals() {
    editor.signals.createMaterialEditor.add(createMaterialEditor);
    editor.signals.createMaterialEditor.add(createBasicMaterialEditor);
    editor.signals.createMaterialEditor.add(createLambertMaterialEditor);
    editor.signals.createMaterialEditor.add(createPhongMaterialEditor);
    editor.signals.createMaterialEditor.add(createStandardMaterialEditor);
    editor.signals.createMaterialEditor.add(createPhysicalMaterialEditor);
  }

  function addMaterialAttributesToSignals() {
    editor.signals.addMaterialAttributes.add(materialAddColor);
    editor.signals.addMaterialAttributes.add(materialAddEmissive);
    editor.signals.addMaterialAttributes.add(materialAddEmissiveMap);
    editor.signals.addMaterialAttributes.add(materialAddEmissiveIntensity);
    editor.signals.addMaterialAttributes.add(materialAddMap);
    editor.signals.addMaterialAttributes.add(materialAddAlphaMap);
    editor.signals.addMaterialAttributes.add(materialAddSpecular);
    editor.signals.addMaterialAttributes.add(materialAddSpecularMap);
    editor.signals.addMaterialAttributes.add(materialAddShininess);
    editor.signals.addMaterialAttributes.add(materialAddNormalMap);
    editor.signals.addMaterialAttributes.add(materialAddBumpMap);
    editor.signals.addMaterialAttributes.add(materialAddMetalness);
    editor.signals.addMaterialAttributes.add(materialAddMetalnessMap);
    editor.signals.addMaterialAttributes.add(materialAddRoughness);
    editor.signals.addMaterialAttributes.add(materialAddRoughnessMap);
    editor.signals.addMaterialAttributes.add(materialAddClearcoat);
    editor.signals.addMaterialAttributes.add(materialAddClearcoatRoughness);
    editor.signals.addMaterialAttributes.add(materialAddEnvMap);
    editor.signals.addMaterialAttributes.add(materialAddEnvMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddReflectivity);
    editor.signals.addMaterialAttributes.add(materialAddCombine);
    editor.signals.addMaterialAttributes.add(materialAddAoMap);
    editor.signals.addMaterialAttributes.add(materialAddAoMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddLightMap);
    editor.signals.addMaterialAttributes.add(materialAddLightMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddRefractionRatio);
  }

  function createMenu() {

    materialEditorGUI = self.materialEditorGUI = new dat.GUI();
    materialEditorGUI.width = 320;

    sceneFolder = materialEditorGUI.addFolder("场景属性"); createSceneOption();

    objectListFolder = materialEditorGUI.addFolder("对象列表");
    materialListFolder = materialEditorGUI.addFolder("材质列表");
    // textureFolder = materialEditorGUI.addFolder("纹理列表");

  }

  function createSceneOption() {

    // sceneFolder.add(sceneAttributes, "skyBox", textureNameList).name("天空盒背景").onChange(function (value) {
    // });

    sceneFolder.addColor(sceneAttributes, "lightColor").name("主光源颜色").onChange(function (value) {
      editor.threeCore.light.color.setHex(value);
    });

    sceneFolder.add(sceneAttributes, "lightIntensity", 0.0, 5.0, 0.01).name("主光源强度").onChange(function (value) {
      editor.threeCore.light.intensity = value;
    });

    sceneFolder.addColor(sceneAttributes, "ambientLightColor").name("环境光颜色").onChange(function (value) {
      editor.threeCore.ambientLight.color.setHex(value);
    });

    sceneFolder.add(sceneAttributes, "ambientLightIntensity", 0.0, 5.0, 0.01).name("环境光强度").onChange(function (value) {
      editor.threeCore.ambientLight.intensity = value;
    });

    sceneFolder.addColor(sceneAttributes, "backgroundColor").name("背景色").onChange(function (value) {
      editor.threeCore.renderer.setClearColor(value);
    });

  }


  self.importObject = function (object) {

    if (currentObject !== undefined) { alert("模型对象已存在，更换模型请新建后重新导入。"); return; }

    currentObject = object;

    object.traverse(function (child) {

      if (!child.isMesh) { return; }

      objectList[child.name] = child; objectNameList.push(child.name);
      materialList[child.material.name] = child.material; materialNameList.push(child.material.name);

    });

    createObjectController(); createMaterialController();

    materialEditorGUI.open();

    autoCameraDistance(currentObject);

    editor.threeCore.scene.add(object);

  };

  self.importTexture = function (texture) {

    textureList[texture.name] = texture;
    textureNameList.push(texture.name);

    // self.optionControllers.forEach(function (optionController) {
    //   optionController.options(textureNameList);
    // });

    editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: materialAttributes.type });

  };


  function createObjectController() {

    if (objectController !== undefined) {
      objectListFolder.remove(objectController);
      objectController = undefined;
    }

    objectController = objectListFolder.add(objectAttributes, "object", objectNameList);
    objectController.name("对象").onChange(function (value) {

      currentMaterial = materialList[objectList[value].material.name];

      materialAttributes.name = currentMaterial.name;
      materialNameController.updateDisplay();

      materialAttributes.type = currentMaterial.type;
      materialTypeController.updateDisplay();

      updateCurrentMaterial2Attributes();

      var objectBox3 = new THREE.Box3().setFromObject(objectList[value]);
      if (boxHelper === undefined) { boxHelper = new THREE.Box3Helper(objectBox3, 0xFFFF00); editor.threeCore.scene.add(boxHelper); }
      boxHelper.box = objectBox3;

      editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: materialAttributes.type });

    });

  }

  function createMaterialController() {

    if (materialNameController !== undefined) {
      materialListFolder.remove(materialNameController);
      materialNameController = undefined;
    }

    materialNameController = materialListFolder.add(materialAttributes, "name", materialNameList);

    materialNameController.name("材质").onChange(function (value) {

      currentMaterial = materialList[value];
      materialAttributes.type = currentMaterial.type;
      materialTypeController.updateDisplay();

      updateCurrentMaterial2Attributes();
      editor.signals.createMaterialEditor.dispatch({ name: value, type: materialAttributes.type });

    });

    if (materialTypeController !== undefined) {
      materialListFolder.remove(materialTypeController);
      materialTypeController = undefined;
    }

    var materialType = ["MeshBasicMaterial", "MeshLambertMaterial", "MeshPhongMaterial", "MeshStandardMaterial", "MeshPhysicalMaterial"];

    materialTypeController = materialListFolder.add(materialAttributes, "type", materialType);

    materialTypeController.name("类型").onChange(function (value) {

      switch (value) {
        case "MeshBasicMaterial": currentMaterial = new THREE.MeshBasicMaterial(); break;
        case "MeshLambertMaterial": currentMaterial = new THREE.MeshLambertMaterial(); break;
        case "MeshPhongMaterial": currentMaterial = new THREE.MeshPhongMaterial(); break;
        case "MeshStandardMaterial": currentMaterial = new THREE.MeshStandardMaterial(); break;
        case "MeshPhysicalMaterial": currentMaterial = new THREE.MeshPhysicalMaterial(); break;
      }

      currentMaterial.name = materialAttributes.name;
      materialList[materialAttributes.name] = currentMaterial;

      currentObject.traverse(function (child) {
        if (child.isMesh && child.material.name !== materialAttributes.name) { return; }
        child.material = currentMaterial;
      });

      updateCurrentMaterial2Attributes();
      editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: value });

    });

  }


  function createMaterialEditor() {

    if (meshMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshMaterialFolder);
      meshMaterialFolder = undefined;
    }

    meshMaterialFolder = materialEditorGUI.addFolder("通用材质属性");

    meshMaterialFolder.add(materialAttributes, "visible").name("可视").onChange(function (value) {
      currentMaterial.visible = value;
    });

    meshMaterialFolder.add(materialAttributes, "transparent").name("透明").onChange(function (value) {
      currentMaterial.transparent = value;
    });

    meshMaterialFolder.add(materialAttributes, "opacity", 0.0, 1.0, 0.01).name("透明度").onChange(function (value) {
      currentMaterial.opacity = value;
    });

    meshMaterialFolder.add(materialAttributes, "alphaTest", 0.0, 0.99, 0.01).name("透明测试").onChange(function (value) {
      currentMaterial.alphaTest = value;
      currentMaterial.needsUpdate = true;
    });

    meshMaterialFolder.add(materialAttributes, "side", ["正面", "反面", "双面"]).name("渲染面").onChange(function (value) {
      switch (value) {
        case "正面": currentMaterial.side = THREE.FrontSide; break;
        case "反面": currentMaterial.side = THREE.BackSide; break;
        case "双面": currentMaterial.side = THREE.DoubleSide; break;
      }
    });

    meshMaterialFolder.add(materialAttributes, "depthTest").name("深度测试").onChange(function (value) {
      currentMaterial.depthTest = value;
    });

    meshMaterialFolder.add(materialAttributes, "depthWrite").name("深度写入").onChange(function (value) {
      currentMaterial.depthWrite = value;
    });

    self.optionControllers = [];

  }

  function createBasicMaterialEditor(data) {

    if (meshBasicMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshBasicMaterialFolder);
      meshBasicMaterialFolder = undefined;
    }

    if (data.type !== "MeshBasicMaterial") { return; }

    meshBasicMaterialFolder = materialEditorGUI.addFolder("基础材质属性");

    editor.signals.addMaterialAttributes.dispatch(meshBasicMaterialFolder);

    meshBasicMaterialFolder.open();

  }

  function createLambertMaterialEditor(data) {

    if (meshLambertMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshLambertMaterialFolder);
      meshLambertMaterialFolder = undefined;
    }

    if (data.type !== "MeshLambertMaterial") { return; }

    meshLambertMaterialFolder = materialEditorGUI.addFolder("兰伯特材质属性");

    editor.signals.addMaterialAttributes.dispatch(meshLambertMaterialFolder);

    meshLambertMaterialFolder.open();

  }

  function createPhongMaterialEditor(data) {

    if (meshPhongMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshPhongMaterialFolder);
      meshPhongMaterialFolder = undefined;
    }

    if (data.type !== "MeshPhongMaterial") { return; }

    meshPhongMaterialFolder = materialEditorGUI.addFolder("冯氏材质属性");

    editor.signals.addMaterialAttributes.dispatch(meshPhongMaterialFolder);

    meshPhongMaterialFolder.open();

  }

  function createStandardMaterialEditor(data) {

    if (meshStandardMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshStandardMaterialFolder);
      meshStandardMaterialFolder = undefined;
    }

    if (data.type !== "MeshStandardMaterial") { return; }

    meshStandardMaterialFolder = materialEditorGUI.addFolder("标准材质属性");

    editor.signals.addMaterialAttributes.dispatch(meshStandardMaterialFolder);

    meshStandardMaterialFolder.open();

  }

  function createPhysicalMaterialEditor(data) {

    if (meshPhysicalMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshPhysicalMaterialFolder);
      meshPhysicalMaterialFolder = undefined;
    }

    if (data.type !== "MeshPhysicalMaterial") { return; }

    meshPhysicalMaterialFolder = materialEditorGUI.addFolder("物理材质属性");

    editor.signals.addMaterialAttributes.dispatch(meshPhysicalMaterialFolder);

    meshPhysicalMaterialFolder.open();

  }


  function materialAddColor(folder) {

    folder.addColor(materialAttributes, "color").name("颜色").onChange(function (value) {
      currentMaterial.color.setHex(value);
    });

  }

  function materialAddEmissive(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.addColor(materialAttributes, "emissive").name("自发光颜色").onChange(function (value) {
      currentMaterial.emissive.setHex(value);
    });

  }

  function materialAddEmissiveMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    var optionController = folder.add(materialAttributes, "emissiveMap", textureNameList).name("自发光贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.emissiveMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.emissiveMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddEmissiveIntensity(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.add(materialAttributes, "emissiveIntensity", 0.0, 1.0, 0.01).name("自发光强度").onChange(function (value) {
      currentMaterial.emissiveIntensity = value;
    });

  }

  function materialAddMap(folder) {

    var optionController = folder.add(materialAttributes, "map", textureNameList).name("漫反射贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.map = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.map = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddAlphaMap(folder) {

    var optionController = folder.add(materialAttributes, "alphaMap", textureNameList).name("透明贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.alphaMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.alphaMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddSpecular(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.addColor(materialAttributes, "specular").name("高光颜色").onChange(function (value) {
      currentMaterial.specular.setHex(value);
    });

  }

  function materialAddSpecularMap(folder) {

    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    var optionController = folder.add(materialAttributes, "specularMap", textureNameList).name("高光贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.specularMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.specularMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddShininess(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.add(materialAttributes, "shininess", 0.0, 100.0, 0.1).name("光泽度").onChange(function (value) {
      currentMaterial.shininess = value;
    });

  }

  function materialAddNormalMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    var optionController = folder.add(materialAttributes, "normalMap", textureNameList).name("法线贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.normalMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.normalMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddBumpMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    var optionController = folder.add(materialAttributes, "bumpMap", textureNameList).name("凹凸贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.bumpMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.bumpMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddRoughness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "roughness", 0.0, 1.0, 0.01).name("粗糙度").onChange(function (value) {
      currentMaterial.roughness = value;
    });

  }

  function materialAddRoughnessMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    var optionController = folder.add(materialAttributes, "roughnessMap", textureNameList).name("粗糙度贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.roughnessMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.roughnessMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddMetalness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "metalness", 0.0, 1.0, 0.01).name("金属度").onChange(function (value) {
      currentMaterial.metalness = value;
    });

  }

  function materialAddMetalnessMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    var optionController = folder.add(materialAttributes, "metalnessMap", textureNameList).name("金属贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.metalnessMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.metalnessMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddClearcoat(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "clearcoat", 0.0, 1.0, 0.01).name("清漆涂层").onChange(function (value) {
      currentMaterial.clearcoat = value;
    });

  }

  function materialAddClearcoatRoughness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "clearcoatRoughness", 0.0, 1.0, 0.01).name("清漆涂层粗糙度").onChange(function (value) {
      currentMaterial.clearcoatRoughness = value;
    });

  }

  function materialAddEnvMap(folder) {

    var optionController = folder.add(materialAttributes, "envMap", textureNameList).name("环境贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.envMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.envMap = textureList[value];
      currentMaterial.envMap.mapping = THREE.EquirectangularReflectionMapping;
      currentMaterial.envMap.needsUpdate = true;
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddEnvMapIntensity(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "envMapIntensity", 0.0, 2.0, 0.01).name("环境贴图强度").onChange(function (value) {
      currentMaterial.envMapIntensity = value;
    });

  }

  function materialAddReflectivity(folder) {

    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "reflectivity", 0.0, 1.0, 0.01).name("反射率").onChange(function (value) {
      currentMaterial.reflectivity = value;
    });

  }

  function materialAddCombine(folder) {

    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.add(materialAttributes, "combine", ["相乘", "混合", "相加"]).name("环境贴图合并方式").onChange(function (value) {

      switch (value) {
        case "相乘": currentMaterial.combine = THREE.Multiply; break;
        case "混合": currentMaterial.combine = THREE.MixOperation; break;
        case "相加": currentMaterial.combine = THREE.AddOperation; break;
      }

      currentMaterial.needsUpdate = true;

    });

  }

  function materialAddAoMap(folder) {

    var optionController = folder.add(materialAttributes, "aoMap", textureNameList).name("环境光遮蔽贴图").onChange(function (value) {

      if (value === "空") { currentMaterial.aoMap = undefined; currentMaterial.needsUpdate = true; return; }

      alert("模型不存在UV2，环境光遮蔽贴图无效。");

      currentMaterial.aoMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

    self.optionControllers.push(optionController);

  }

  function materialAddAoMapIntensity(folder) {

    folder.add(materialAttributes, "aoMapIntensity", 0.0, 2.0, 0.01).name("环境光遮蔽贴图强度").onChange(function (value) {
      currentMaterial.aoMapIntensity = value;
    });

  }

  function materialAddLightMap(folder) {

    var optionController = folder.add(materialAttributes, "lightMap", textureNameList).name("光照贴图").onChange(function (value) {
      if (value === "空") { currentMaterial.lightMap = undefined; currentMaterial.needsUpdate = true; return; }
      currentMaterial.lightMap = textureList[value];
      currentMaterial.needsUpdate = true;
    });

    self.optionControllers.push(optionController);

  }

  function materialAddLightMapIntensity(folder) {

    folder.add(materialAttributes, "lightMapIntensity", 0.0, 2.0, 0.01).name("光照贴图强度").onChange(function (value) {
      currentMaterial.lightMapIntensity = value;
    });

  }

  function materialAddRefractionRatio(folder) {

    folder.add(materialAttributes, "refractionRatio", 0.0, 1.0, 0.01).name("折射率").onChange(function (value) {
      currentMaterial.refractionRatio = value;
    });

  }


  function updateCurrentMaterial2Attributes() {

    materialAttributes.visible = currentMaterial.visible;
    materialAttributes.transparent = currentMaterial.transparent;
    materialAttributes.opacity = currentMaterial.opacity;
    materialAttributes.alphaTest = currentMaterial.alphaTest;

    switch (currentMaterial.side) {
      case THREE.FrontSide: materialAttributes.side = "正面"; break;
      case THREE.BackSide: materialAttributes.side = "反面"; break;
      case THREE.DoubleSide: materialAttributes.side = "双面"; break;
    }

    materialAttributes.depthTest = currentMaterial.depthTest;
    materialAttributes.depthTest = currentMaterial.depthWrite;

    materialAttributes.color = currentMaterial.color.getHex();

    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissive = currentMaterial.emissive.getHex();
    }

    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissiveMap = "空";
      if (currentMaterial.emissiveMap) { materialAttributes.emissiveMap = currentMaterial.emissiveMap.name; }
    }

    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissiveIntensity = currentMaterial.emissiveIntensity;
    }

    materialAttributes.map = "空";
    if (currentMaterial.map) { materialAttributes.map = currentMaterial.map.name; }

    materialAttributes.alphaMap = "空";
    if (currentMaterial.alphaMap) { materialAttributes.alphaMap = currentMaterial.alphaMap.name; }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.specular = currentMaterial.specular.getHex();
    }

    if (currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.specularMap = "空";
      if (currentMaterial.specularMap) { materialAttributes.specularMap = currentMaterial.specularMap.name; }
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.shininess = currentMaterial.shininess;
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial") {
      materialAttributes.normalMap = "空";
      if (currentMaterial.normalMap) { materialAttributes.normalMap = currentMaterial.normalMap.name; }
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial") {
      materialAttributes.bumpMap = "空";
      if (currentMaterial.bumpMap) { materialAttributes.bumpMap = currentMaterial.bumpMap.name; }
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.roughness = currentMaterial.roughness;
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.metalness = currentMaterial.metalness;
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.metalnessMap = "空";
      if (currentMaterial.metalnessMap) { materialAttributes.metalnessMap = currentMaterial.metalnessMap.name; }
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.clearcoat = currentMaterial.clearcoat;
    }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.clearcoatRoughness = currentMaterial.clearcoatRoughness;
    }

    materialAttributes.envMap = "空";
    if (currentMaterial.envMap) { materialAttributes.envMap = currentMaterial.envMap.name; }

    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.envMapIntensity = currentMaterial.envMapIntensity;
    }

    if (currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.reflectivity = currentMaterial.reflectivity;
    }

    if (currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      switch (currentMaterial.combine) {
        case THREE.Multiply: materialAttributes.side = "相乘"; break;
        case THREE.MixOperation: materialAttributes.side = "混合"; break;
        case THREE.AddOperation: materialAttributes.side = "相加"; break;
      }
    }

    materialAttributes.aoMap = "空";
    if (currentMaterial.aoMap) { materialAttributes.aoMap = currentMaterial.aoMap.name; }

    materialAttributes.aoMapIntensity = currentMaterial.aoMapIntensity;

    materialAttributes.lightMap = "空";
    if (currentMaterial.lightMap) { materialAttributes.lightMap = currentMaterial.lightMap.name; }

    materialAttributes.lightMapIntensity = currentMaterial.lightMapIntensity;

    materialAttributes.refractionRatio = currentMaterial.refractionRatio;

  }


  function autoCameraDistance(object) {

    var objectBox3 = new THREE.Box3().setFromObject(object);

    var minPointDis = objectBox3.min.distanceTo(new THREE.Vector3(0, 0, 0));
    var maxPointDis = objectBox3.max.distanceTo(new THREE.Vector3(0, 0, 0));
    var maxDis = Math.max(minPointDis, maxPointDis);

    editor.threeCore.cameraController.minDistance = maxDis * 0.5;
    editor.threeCore.cameraController.maxDistance = maxDis * 5;

    editor.threeCore.camera.far = editor.threeCore.cameraController.maxDistance + 10;
    editor.threeCore.camera.updateProjectionMatrix();

    editor.threeCore.camera.position.set(maxDis * 2, maxDis * 2, -(maxDis * 2));

  }

  self.functionOptions = {

    reload: function () { if (confirm("确认新建？")) { location.reload(); } },

    export: function (options) {

      if (currentObject === undefined) { alert("未找到可导出对象。"); return; }

      var NUMBER_PRECISION = 6;

      function parseNumber(key, value) {
        return typeof value === 'number' ? parseFloat(value.toFixed(NUMBER_PRECISION)) : value;
      }

      function externalImgHandler(jsonData) {
        for (var index = 0; index < jsonData.textures.length; index++) {
          jsonData.images[index].url = "./textures/" + jsonData.textures[index].name;
        }
      }

      function save_json(jsonData) {
        saveString(JSON.stringify(jsonData, parseNumber), "model.json");
      }

      function save_drcobj(jsonData) {
        var save_buffer = (new THREE.DrcobjExporter()).parse(jsonData, { quantization: [16, 8, 10, 8, 8] });
        saveArrayBuffer(save_buffer, "model.drcobj");
      }

      var currentObjectJSONData = currentObject.toJSON();

      if (options === undefined) { options = {}; }
      if (options.includeImg === undefined) { options.includeImg = true; }
      if (options.includeImg === true) { externalImgHandler(currentObjectJSONData); }

      save_json(currentObjectJSONData); save_drcobj(currentObjectJSONData);

    }

  };

};
