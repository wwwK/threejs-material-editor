var MaterialEditor = function (editor) {

  var self = this;
  var currentObject, objectList = {}, objectNameList = [];
  var currentMaterial, materialList = {}, materialNameList = [];
  var currentTexture, textureList = {}, textureNameList = ["none"];

  var materialEditorGUI, sceneFolder, objectListFolder, materialListFolder, meshMaterialFolder, textureFolder;
  var meshBasicMaterialFolder, meshLambertMaterialFolder, meshPhongMaterialFolder, meshStandardMaterialFolder, meshPhysicalMaterialFolder;
  var objectController, materialNameController, materialTypeController;

  self.functionOptions = {

    reload: function () {
      location.reload();
    },

    save: function () {
      saveString(JSON.stringify(currentObject.toJSON()), "model.json");
    },

    save_drcobj: function () {
      saveArrayBuffer((new THREE.DrcobjExporter()).parse(currentObject.toJSON(), { quantization: [16, 16, 16, 16, 16] }), "model.drcobj");
    },

  };

  // 初始化
  self.init = function () {

    createMenu();

    editor.signals.createMaterialEditor = new signals.Signal();
    editor.signals.addMaterialAttributes = new signals.Signal();

    addMaterialEditorToSignals();
    addMaterialAttributesToSignals();

  };

  // 创建菜单
  function createMenu() {

    materialEditorGUI = self.materialEditorGUI = new dat.GUI();
    materialEditorGUI.width = 320;

    sceneFolder = materialEditorGUI.addFolder("场景属性");
    createSceneOption();

    objectListFolder = materialEditorGUI.addFolder("对象列表");
    materialListFolder = materialEditorGUI.addFolder("材质列表");
    // textureFolder = materialEditorGUI.addFolder("纹理列表");

    // materialEditorGUI.close();

  }

  function createSceneOption() {

    // 天空盒背景
    // sceneFolder.add(sceneAttributes, "skyBox", textureNameList).name("天空盒背景").onChange(function (value) {
    // });

    // 主光源颜色
    sceneFolder.addColor(sceneAttributes, "lightColor").name("主光源颜色").onChange(function (value) {
      editor.threeCore.light.color.setHex(value);
    });

    // 主光源强度
    sceneFolder.add(sceneAttributes, "lightIntensity", 0.0, 5.0, 0.01).name("主光源强度").onChange(function (value) {
      editor.threeCore.light.intensity = value;
    });

    // 环境光颜色
    sceneFolder.addColor(sceneAttributes, "ambientLightColor").name("环境光颜色").onChange(function (value) {
      editor.threeCore.ambientLight.color.setHex(value);
    });

    // 环境光强度
    sceneFolder.add(sceneAttributes, "ambientLightIntensity", 0.0, 5.0, 0.01).name("环境光强度").onChange(function (value) {
      editor.threeCore.ambientLight.intensity = value;
    });

    // 背景色
    sceneFolder.addColor(sceneAttributes, "backgroundColor").name("背景色").onChange(function (value) {
      editor.threeCore.renderer.setClearColor(value);
    });

  }

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
    editor.signals.addMaterialAttributes.add(materialAddRoughness);
    editor.signals.addMaterialAttributes.add(materialAddRoughnessMap);
    editor.signals.addMaterialAttributes.add(materialAddMetalness);
    editor.signals.addMaterialAttributes.add(materialAddMetalnessMap);
    editor.signals.addMaterialAttributes.add(materialAddClearCoat);
    editor.signals.addMaterialAttributes.add(materialAddClearCoatRoughness);
    editor.signals.addMaterialAttributes.add(materialAddMap);
    editor.signals.addMaterialAttributes.add(materialAddAlphaMap);
    editor.signals.addMaterialAttributes.add(materialAddSpecular);
    editor.signals.addMaterialAttributes.add(materialAddShininess);
    editor.signals.addMaterialAttributes.add(materialAddSpecularMap);
    editor.signals.addMaterialAttributes.add(materialAddNormalMap);
    editor.signals.addMaterialAttributes.add(materialAddBumpMap);
    editor.signals.addMaterialAttributes.add(materialAddEnvMap);
    editor.signals.addMaterialAttributes.add(materialAddEnvMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddCombine);
    editor.signals.addMaterialAttributes.add(materialAddReflectivity);
    editor.signals.addMaterialAttributes.add(materialAddAoMap);
    editor.signals.addMaterialAttributes.add(materialAddAoMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddLightMap);
    editor.signals.addMaterialAttributes.add(materialAddLightMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddRefractionRatio);

  }

  /*********************************************/
  /* 导入处理                                   */
  /*********************************************/

  // 导入对象
  self.importObject = function (object) {

    currentObject = object;

    // 写入数据
    object.traverse(function (child) {

      if (!child.isMesh) { return; }

      objectList[child.name] = child;
      objectNameList.push(child.name);

      materialList[child.material.name] = child.material;
      materialNameList.push(child.material.name);

    });

    editor.threeCore.scene.add(object);

    // 创建对象和材质菜单
    createObjectController();
    createMaterialController();

    materialEditorGUI.open();

  };

  // 导入纹理
  self.importTexture = function (texture) {

    textureList[texture.name] = texture;
    textureNameList.push(texture.name);

    // 导入纹理时刷新编辑器各项纹理列表
    editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: materialAttributes.type });

  };

  /*********************************************/
  /* 对象和材质选择控制器                        */
  /*********************************************/

  // 刷新对象
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

      editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: materialAttributes.type });

    });

  }

  // 刷新材质
  function createMaterialController() {

    // 刷新材质名称控件
    if (materialNameController !== undefined) {
      materialListFolder.remove(materialNameController);
      materialNameController = undefined;
    }

    // 添加名称
    materialNameController = materialListFolder.add(materialAttributes, "name", materialNameList);
    materialNameController.name("材质").onChange(function (value) {

      currentMaterial = materialList[value];

      materialAttributes.type = currentMaterial.type;
      materialTypeController.updateDisplay();

      updateCurrentMaterial2Attributes();

      editor.signals.createMaterialEditor.dispatch({ name: value, type: materialAttributes.type });

    });

    // 刷新材质类型控件
    if (materialTypeController !== undefined) {
      materialListFolder.remove(materialTypeController);
      materialTypeController = undefined;
    }

    var materialType = ["MeshBasicMaterial", "MeshLambertMaterial", "MeshPhongMaterial", "MeshStandardMaterial", "MeshPhysicalMaterial"];

    // 添加类型
    materialTypeController = materialListFolder.add(materialAttributes, "type", materialType);
    materialTypeController.name("类型").onChange(function (value) {

      // 创建新材质
      switch (value) {
        case "MeshBasicMaterial": currentMaterial = new THREE.MeshBasicMaterial(); break;
        case "MeshLambertMaterial": currentMaterial = new THREE.MeshLambertMaterial(); break;
        case "MeshPhongMaterial": currentMaterial = new THREE.MeshPhongMaterial(); break;
        case "MeshStandardMaterial": currentMaterial = new THREE.MeshStandardMaterial(); break;
        case "MeshPhysicalMaterial": currentMaterial = new THREE.MeshPhysicalMaterial(); break;
      }

      currentMaterial.name = materialAttributes.name;
      materialList[materialAttributes.name] = currentMaterial;

      // 刷新材质到对象
      currentObject.traverse(function (child) {
        if (child.isMesh && child.material.name !== materialAttributes.name) { return; }
        child.material = currentMaterial;
      });

      updateCurrentMaterial2Attributes();

      editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: value });

    });

  }

  // 更新当前材质属性到编辑器
  function updateCurrentMaterial2Attributes() {

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
    materialAttributes.visible = currentMaterial.visible;

    // 颜色
    materialAttributes.color = currentMaterial.color.getHex();

    // 自发光颜色
    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissive = currentMaterial.emissive.getHex();
    }

    // 自发光贴图
    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissiveMap = "none";
      if (currentMaterial.emissiveMap) { materialAttributes.emissiveMap = currentMaterial.emissiveMap.name; }
    }

    // 自发光强度
    if (currentMaterial.type !== "MeshBasicMaterial") {
      materialAttributes.emissiveIntensity = currentMaterial.emissiveIntensity;
    }

    // 粗糙度
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.roughness = currentMaterial.roughness;
    }

    // 金属度
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.metalness = currentMaterial.metalness;
    }

    // 金属贴图
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.metalnessMap = "none";
      if (currentMaterial.metalnessMap) { materialAttributes.metalnessMap = currentMaterial.metalnessMap.name; }
    }

    // 透明涂层
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.clearCoat = currentMaterial.clearCoat;
    }

    // 透明涂层粗糙度
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.clearCoatRoughness = currentMaterial.clearCoatRoughness;
    }

    // 贴图
    materialAttributes.map = "none";
    if (currentMaterial.map) { materialAttributes.map = currentMaterial.map.name; }

    // 透明贴图
    materialAttributes.alphaMap = "none";
    if (currentMaterial.alphaMap) { materialAttributes.alphaMap = currentMaterial.alphaMap.name; }

    // 高光颜色
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.specular = currentMaterial.specular.getHex();
    }

    // 高光强度
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.shininess = currentMaterial.shininess;
    }

    // 高光贴图
    if (currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      materialAttributes.specularMap = "none";
      if (currentMaterial.specularMap) { materialAttributes.specularMap = currentMaterial.specularMap.name; }
    }

    // 法线贴图
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial") {
      materialAttributes.normalMap = "none";
      if (currentMaterial.normalMap) { materialAttributes.normalMap = currentMaterial.normalMap.name; }
    }

    // 凹凸贴图
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial") {
      materialAttributes.bumpMap = "none";
      if (currentMaterial.bumpMap) { materialAttributes.bumpMap = currentMaterial.bumpMap.name; }
    }

    // 环境贴图
    materialAttributes.envMap = "none";
    if (currentMaterial.envMap) { materialAttributes.envMap = currentMaterial.envMap.name; }

    // 环境贴图强度
    if (currentMaterial.type !== "MeshBasicMaterial" &&
      currentMaterial.type !== "MeshLambertMaterial" &&
      currentMaterial.type !== "MeshPhongMaterial") {
      materialAttributes.envMapIntensity = currentMaterial.envMapIntensity;
    }

    // 环境贴图结合方式
    if (currentMaterial.type !== "MeshStandardMaterial" &&
      currentMaterial.type !== "MeshPhysicalMaterial") {
      switch (currentMaterial.combine) {
        case THREE.Multiply: materialAttributes.side = "相乘"; break;
        case THREE.MixOperation: materialAttributes.side = "混合"; break;
        case THREE.AddOperation: materialAttributes.side = "相加"; break;
      }
    }

    // 反射率
    if (currentMaterial.type !== "MeshStandardMaterial") {
      materialAttributes.reflectivity = currentMaterial.reflectivity;
    }

    // 环境遮挡贴图
    materialAttributes.aoMapIntensity = "none";
    if (currentMaterial.aoMapIntensity) { materialAttributes.aoMapIntensity = currentMaterial.aoMapIntensity.name; }

    // 环境遮挡强度
    materialAttributes.aoMapIntensity = currentMaterial.aoMapIntensity;

    // 光照贴图
    materialAttributes.lightMap = "none";
    if (currentMaterial.lightMap) { materialAttributes.lightMap = currentMaterial.lightMap.name; }

    // 光照贴图强度
    materialAttributes.lightMapIntensity = currentMaterial.lightMapIntensity;

    // 折射率
    materialAttributes.refractionRatio = currentMaterial.refractionRatio;

  }

  /*********************************************/
  /* 初始化                                     */
  /*********************************************/

  // 创建材质基类属性编辑器
  function createMaterialEditor() {

    if (meshMaterialFolder !== undefined) {
      materialEditorGUI.removeFolder(meshMaterialFolder);
      meshMaterialFolder = undefined;
    }

    meshMaterialFolder = materialEditorGUI.addFolder("通用材质属性");

    // 材质属性 透明
    meshMaterialFolder.add(materialAttributes, "transparent").name("透明").onChange(function (value) {
      currentMaterial.transparent = value;
    });

    // 材质属性 透明度
    meshMaterialFolder.add(materialAttributes, "opacity", 0.0, 1.0, 0.01).name("透明度").onChange(function (value) {
      currentMaterial.opacity = value;
    });

    // 材质属性 透明测试
    meshMaterialFolder.add(materialAttributes, "alphaTest", 0.0, 0.99, 0.01).name("透明测试").onChange(function (value) {
      currentMaterial.alphaTest = value;
      currentMaterial.needsUpdate = true;
    });

    // 材质属性 渲染面
    meshMaterialFolder.add(materialAttributes, "side", ["正面", "反面", "双面"]).name("渲染面").onChange(function (value) {
      switch (value) {
        case "正面": currentMaterial.side = THREE.FrontSide; break;
        case "反面": currentMaterial.side = THREE.BackSide; break;
        case "双面": currentMaterial.side = THREE.DoubleSide; break;
      }
    });

    // 材质属性 深度测试
    meshMaterialFolder.add(materialAttributes, "depthTest").name("深度测试").onChange(function (value) {
      currentMaterial.depthTest = value;
    });

    // 材质属性 深度写入
    meshMaterialFolder.add(materialAttributes, "depthWrite").name("深度写入").onChange(function (value) {
      currentMaterial.depthWrite = value;
    });

    // 材质属性 可视
    meshMaterialFolder.add(materialAttributes, "visible").name("可视").onChange(function (value) {
      currentMaterial.visible = value;
    });

  }

  /*********************************************/
  /* 创建对应类型的材质属性编辑器                 */
  /*********************************************/

  // 创建基础材质属性编辑器
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

  // 创建兰伯特材质属性编辑器
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

  // 创建冯氏材质属性编辑器
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

  // 创建标准材质属性编辑器
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

  // 创建物理材质属性编辑器
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

  /*********************************************/
  /* 向材质编辑器添加属性操作控件                 */
  /*********************************************/

  // 添加 颜色
  function materialAddColor(folder) {

    folder.addColor(materialAttributes, "color").name("颜色").onChange(function (value) {
      currentMaterial.color.setHex(value);
    });

  }

  // 添加 自发光颜色
  function materialAddEmissive(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.addColor(materialAttributes, "emissive").name("自发光颜色").onChange(function (value) {
      currentMaterial.emissive.setHex(value);
    });

  }

  // 添加 自发光贴图
  function materialAddEmissiveMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.add(materialAttributes, "emissiveMap", textureNameList).name("自发光贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.emissiveMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.emissiveMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 自发光强度
  function materialAddEmissiveIntensity(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.add(materialAttributes, "emissiveIntensity", 0.0, 1.0, 0.01).name("自发光强度").onChange(function (value) {
      currentMaterial.emissiveIntensity = value;
    });

  }

  // 添加 粗糙度
  function materialAddRoughness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "roughness", 0.0, 1.0, 0.01).name("粗糙度").onChange(function (value) {
      currentMaterial.roughness = value;
    });

  }

  // 添加 粗糙度贴图
  function materialAddRoughnessMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "roughnessMap", textureNameList).name("粗糙度贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.roughnessMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.roughnessMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 金属度
  function materialAddMetalness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "metalness", 0.0, 1.0, 0.01).name("金属度").onChange(function (value) {
      currentMaterial.metalness = value;
    });

  }

  // 添加 金属度贴图
  function materialAddMetalnessMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "metalnessMap", textureNameList).name("金属贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.metalnessMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.metalnessMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 清漆涂层
  function materialAddClearCoat(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "clearCoat", 0.0, 1.0, 0.01).name("清漆涂层").onChange(function (value) {
      currentMaterial.clearCoat = value;
    });

  }

  // 添加 清漆涂层粗糙度
  function materialAddClearCoatRoughness(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "clearCoatRoughness", 0.0, 1.0, 0.01).name("清漆涂层粗糙度").onChange(function (value) {
      currentMaterial.clearCoatRoughness = value;
    });

  }

  // 添加 贴图
  function materialAddMap(folder) {

    folder.add(materialAttributes, "map", textureNameList).name("贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.map = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.map = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 透明贴图
  function materialAddAlphaMap(folder) {

    folder.add(materialAttributes, "alphaMap", textureNameList).name("透明贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.alphaMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.alphaMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 高光颜色
  function materialAddSpecular(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.addColor(materialAttributes, "specular").name("高光颜色").onChange(function (value) {
      currentMaterial.specular.setHex(value);
    });

  }

  // 添加 高光贴图
  function materialAddSpecularMap(folder) {

    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.add(materialAttributes, "specularMap", textureNameList).name("高光贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.specularMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.specularMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 光泽度
  function materialAddShininess(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshStandardMaterial") { return; }
    if (materialAttributes.type === "MeshPhysicalMaterial") { return; }

    folder.add(materialAttributes, "shininess", 0.0, 100.0, 0.1).name("光泽度").onChange(function (value) {
      currentMaterial.shininess = value;
    });

  }

  // 添加 法线贴图
  function materialAddNormalMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.add(materialAttributes, "normalMap", textureNameList).name("法线贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.normalMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.normalMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 凹凸贴图
  function materialAddBumpMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.add(materialAttributes, "bumpMap", textureNameList).name("凹凸贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.bumpMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.bumpMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境贴图
  function materialAddEnvMap(folder) {

    folder.add(materialAttributes, "envMap", textureNameList).name("环境贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.envMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.envMap = textureList[value];
      currentMaterial.envMap.mapping = THREE.EquirectangularReflectionMapping;
      currentMaterial.envMap.needsUpdate = true;
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境贴图强度
  function materialAddEnvMapIntensity(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }
    if (materialAttributes.type === "MeshPhongMaterial") { return; }

    folder.add(materialAttributes, "envMapIntensity", 0.0, 1.0, 0.01).name("环境贴图强度").onChange(function (value) {
      currentMaterial.envMapIntensity = value;
    });

  }

  // 添加 环境贴图合并方式
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

  // 添加 反射率
  function materialAddReflectivity(folder) {

    if (materialAttributes.type === "MeshStandardMaterial") { return; }

    folder.add(materialAttributes, "reflectivity", 0.0, 1.0, 0.01).name("反射率").onChange(function (value) {
      currentMaterial.reflectivity = value;
    });

  }

  // 添加 环境光遮蔽贴图（AO）
  function materialAddAoMap(folder) {

    folder.add(materialAttributes, "aoMap", textureNameList).name("环境光遮蔽贴图（AO）").onChange(function (value) {

      if (value === "none") { currentMaterial.aoMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.aoMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境光遮蔽贴图强度
  function materialAddAoMapIntensity(folder) {

    folder.add(materialAttributes, "aoMapIntensity", 0.0, 1.0, 0.01).name("环境光遮蔽贴图强度").onChange(function (value) {
      currentMaterial.aoMapIntensity = value;
    });

  }

  // 添加 光照贴图
  function materialAddLightMap(folder) {

    folder.add(materialAttributes, "lightMap", textureNameList).name("光照贴图").onChange(function (value) {

      if (value === "none") { currentMaterial.lightMap = undefined; currentMaterial.needsUpdate = true; return; }

      currentMaterial.lightMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 光照贴图强度
  function materialAddLightMapIntensity(folder) {

    folder.add(materialAttributes, "lightMapIntensity", 0.0, 1.0, 0.01).name("光照贴图强度").onChange(function (value) {
      currentMaterial.lightMapIntensity = value;
    });

  }

  // 添加 折射率
  function materialAddRefractionRatio(folder) {

    folder.add(materialAttributes, "refractionRatio", 0.0, 1.0, 0.01).name("折射率").onChange(function (value) {
      currentMaterial.refractionRatio = value;
    });

  }

};
