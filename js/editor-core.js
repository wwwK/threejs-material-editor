var MaterialEditor = function (editor) {

  var self = this;

  var currentObject, objectList = {}, objectNameList = [];
  var currentMaterial, materialList = {}, materialNameList = [];
  var currentTexture, textureList = {}, textureNameList = [];

  var materialEditorGUI, objectListFolder, materialListFolder, meshMaterialFolder;
  var meshBasicMaterialFolder, meshLambertMaterialFolder, meshPhongMaterialFolder;
  var objectController, materialNameController, materialTypeController;

  // 对象属性
  var objectAttributes = { object: "" };

  // 材质属性
  var materialAttributes = {

    name: "", type: "MeshLambertMaterial",

    transparent: false, opacity: 1.0, side: "FrontSide", visible: true,

    alphaTest: 0.0, depthTest: true, depthWrite: true, flatShading: false, lights: true, fog: true,

    color: 0xFFFFFF, emissive: 0x000000, emissiveIntensity: 1.0, emissiveMap: "",

    map: "", alphaMap: "", specular: 0x111111, shininess: 30, specularMap: "",

    normalMap: "", normalScale: {}, normalMapType: "", bumpMap: "", bumpScale: 1.0,

    envMap: "", combine: "", reflectivity: 1.0,

    aoMap: "", aoMapIntensity: 1.0, lightMap: "", lightMapIntensity: 1.0,

    refractionRatio: 0.98,

    wireframe: false,

  };

  /*********************************************/
  /* 初始化                                     */
  /*********************************************/

  // 初始化
  self.init = function () {

    // 创建材质编辑器
    editor.signals.createMaterialEditor = new signals.Signal();
    editor.signals.createMaterialEditor.addOnce(createMaterialEditor);
    editor.signals.createMaterialEditor.add(createBasicMaterialEditor);
    editor.signals.createMaterialEditor.add(createLambertMaterialEditor);
    editor.signals.createMaterialEditor.add(createPhongMaterialEditor);

    // 材质属性添加
    editor.signals.addMaterialAttributes = new signals.Signal();
    editor.signals.addMaterialAttributes.add(materialAddColor);
    editor.signals.addMaterialAttributes.add(materialAddEmissive);
    editor.signals.addMaterialAttributes.add(materialAddEmissiveMap);
    editor.signals.addMaterialAttributes.add(materialAddEmissiveIntensity);
    editor.signals.addMaterialAttributes.add(materialAddMap);
    editor.signals.addMaterialAttributes.add(materialAddAlphaMap);
    editor.signals.addMaterialAttributes.add(materialAddSpecular);
    editor.signals.addMaterialAttributes.add(materialAddShininess);
    editor.signals.addMaterialAttributes.add(materialAddSpecularMap);
    editor.signals.addMaterialAttributes.add(materialAddNormalMap);
    editor.signals.addMaterialAttributes.add(materialAddBumpMap);
    editor.signals.addMaterialAttributes.add(materialAddEnvMap);
    editor.signals.addMaterialAttributes.add(materialAddCombine);
    editor.signals.addMaterialAttributes.add(materialAddReflectivity);
    editor.signals.addMaterialAttributes.add(materialAddAoMap);
    editor.signals.addMaterialAttributes.add(materialAddAoMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddLightMap);
    editor.signals.addMaterialAttributes.add(materialAddLightMapIntensity);
    editor.signals.addMaterialAttributes.add(materialAddRefractionRatio);

    createMenu();

  };

  // 创建菜单
  function createMenu() {

    materialEditorGUI = self.materialEditorGUI = new dat.GUI();
    materialEditorGUI.width = 320;

    objectListFolder = materialEditorGUI.addFolder("对象列表");
    materialListFolder = materialEditorGUI.addFolder("材质列表");

    materialEditorGUI.close();

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

      if (child.material.name === "Carpaint_M") {

        child.material.opacity = 0.1;

      }

      objectList[child.name] = child;
      objectNameList.push(child.name);

      materialList[child.material.name] = child.material;
      materialNameList.push(child.material.name);

    });

    editor.threeCore.scene.add(object);

    createObjectController();
    createMaterialController();

    materialEditorGUI.open();

  };

  // 导入纹理
  self.importTexture = function (texture) {

    textureList[texture.name] = texture;
    textureNameList.push(texture.name);

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

      }

      currentMaterial.name = materialAttributes.name;
      materialList[materialAttributes.name] = currentMaterial;

      // 刷新材质到对象
      currentObject.traverse(function (child) {

        if (child.isMesh && child.material.name !== materialAttributes.name) { return; }

        child.material = currentMaterial;

      });

      editor.signals.createMaterialEditor.dispatch({ name: materialAttributes.name, type: value });

    });

  }

  // 更新当前材质属性到编辑器
  function updateCurrentMaterial2Attributes() {

    materialAttributes.color = currentMaterial.color.getHex();

  }

  /*********************************************/
  /* 初始化                                     */
  /*********************************************/

  // 创建材质基类属性编辑器
  function createMaterialEditor() {

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

  /*********************************************/
  /* 向材质编辑器添加属性操作控件                 */
  /*********************************************/

  // 添加 颜色
  function materialAddColor(folder) {

    folder.addColor(materialAttributes, "color").name("颜色").onChange(function (value) {

      currentMaterial.color.setHex(value);

    });

  }

  // 添加 放射光
  function materialAddEmissive(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.addColor(materialAttributes, "emissive").name("自发光").onChange(function (value) {

      currentMaterial.emissive.setHex(value);

    });

  }

  // 添加 放射光贴图
  function materialAddEmissiveMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.add(materialAttributes, "emissiveMap", textureNameList).name("放射光贴图").onChange(function (value) {

      currentMaterial.emissiveMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 放射光强度
  function materialAddEmissiveIntensity(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }

    folder.add(materialAttributes, "emissiveIntensity", 0.0, 1.0, 0.01).name("放射光强度").onChange(function (value) {

      currentMaterial.emissiveIntensity = value;

    });

  }

  // 添加 贴图
  function materialAddMap(folder) {

    folder.add(materialAttributes, "map", textureNameList).name("贴图").onChange(function (value) {

      currentMaterial.map = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 透明贴图
  function materialAddAlphaMap(folder) {

    folder.add(materialAttributes, "alphaMap", textureNameList).name("透明贴图").onChange(function (value) {

      currentMaterial.alphaMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 高光颜色
  function materialAddSpecular(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.addColor(materialAttributes, "specular").name("高光颜色").onChange(function (value) {

      currentMaterial.specular.setHex(value);

    });

  }

  // 添加 高光强度
  function materialAddShininess(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.add(materialAttributes, "shininess", 0.0, 100.0, 0.1).name("高光强度").onChange(function (value) {

      currentMaterial.shininess = value;

    });

  }

  // 添加 高光贴图
  function materialAddSpecularMap(folder) {

    folder.add(materialAttributes, "specularMap", textureNameList).name("高光贴图").onChange(function (value) {

      currentMaterial.specularMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 法线贴图
  function materialAddNormalMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.add(materialAttributes, "normalMap", textureNameList).name("法线贴图").onChange(function (value) {

      currentMaterial.normalMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 凹凸贴图
  function materialAddBumpMap(folder) {

    if (materialAttributes.type === "MeshBasicMaterial") { return; }
    if (materialAttributes.type === "MeshLambertMaterial") { return; }

    folder.add(materialAttributes, "bumpMap", textureNameList).name("凹凸贴图").onChange(function (value) {

      currentMaterial.bumpMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境贴图
  function materialAddEnvMap(folder) {

    folder.add(materialAttributes, "envMap", textureNameList).name("环境贴图").onChange(function (value) {

      currentMaterial.envMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境贴图结合方式
  function materialAddCombine(folder) {

    folder.add(materialAttributes, "combine", ["相乘", "混合", "相加"]).name("环境贴图结合方式").onChange(function (value) {

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

    folder.add(materialAttributes, "reflectivity", 0.0, 1.0, 0.01).name("反射率").onChange(function (value) {

      currentMaterial.reflectivity = value;

    });

  }

  // 添加 环境遮挡贴图
  function materialAddAoMap(folder) {

    folder.add(materialAttributes, "aoMap", textureNameList).name("环境遮挡贴图").onChange(function (value) {

      currentMaterial.aoMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 环境遮挡强度
  function materialAddAoMapIntensity(folder) {

    folder.add(materialAttributes, "aoMapIntensity", 0.0, 1.0, 0.01).name("环境遮挡效果强度").onChange(function (value) {

      currentMaterial.aoMapIntensity = value;

    });

  }

  // 添加 光照贴图
  function materialAddLightMap(folder) {

    folder.add(materialAttributes, "lightMap", textureNameList).name("光照贴图").onChange(function (value) {

      currentMaterial.lightMap = textureList[value];
      currentMaterial.needsUpdate = true;

    });

  }

  // 添加 烘焙光强度
  function materialAddLightMapIntensity(folder) {

    folder.add(materialAttributes, "lightMapIntensity", 0.0, 1.0, 0.01).name("烘焙光强度").onChange(function (value) {

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
