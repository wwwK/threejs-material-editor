var sceneAttributes = {

    lightColor: 0xFFFFFF, // 主光源颜色
    lightIntensity: 1.0,  // 主光源强度

    ambientLightColor: 0xFFFFFF, // 环境光颜色
    ambientLightIntensity: 0.5,  // 环境光强度

    backgroundColor: 0x888888 // 背景颜色

};

var objectAttributes = {

    object: ""

};

var materialAttributes = {

    name: "",                    // 材质名称
    type: "MeshLambertMaterial", // 材质类型

    transparent: false, // 是否透明
    opacity: 1.0,       // 透明度
    side: "正面",       // 渲染面
    visible: true,      // 是否可视

    alphaTest: 0.0,   // 透明度测试
    depthTest: true,  // 深度测试
    depthWrite: true, // 深度写入
    lights: true,     // 是否受光照影响
    fog: true,        // 是否受到雾影响
    wireframe: false, // 线框模式

    color: 0xFFFFFF,        // 颜色
    emissive: 0x000000,     // 自发光颜色 !Basic
    emissiveMap: "none",    // 自发光贴图 !Basic
    emissiveIntensity: 1.0, // 自发光强度 !Basic

    roughness: 0.5,          // 粗糙度 Standard
    roughnessMap: "none",    // 粗糙度贴图 Standard
    metalness: 0.5,          // 金属度 Standard
    metalnessMap: "none",    // 金属度贴图 Standard
    clearcoat: 0.0,          // 清漆涂层 Physical
    clearcoatRoughness: 0.0, // 清漆涂层粗糙度 Physical

    map: "none",         // 贴图
    alphaMap: "none",    // 透明贴图
    specular: 0x111111,  // 高光颜色 Phong
    specularMap: "none", // 高光贴图 !Standard|Physical
    shininess: 30,       // 光泽度 Phong

    normalMap: "none", // 法线贴图 Phong|Standard
    bumpMap: "none",   // 凹凸贴图 Phong|Standard

    envMap: "none",       // 环境贴图
    envMapIntensity: 0.0, // 环境贴图强度 Standard
    combine: "混合",      // 环境贴图合并方式 !Standard|Physical
    reflectivity: 1.0,    // 反射率 !Standard Physical

    aoMap: "none",          // 环境光遮蔽贴图（AO）
    aoMapIntensity: 1.0,    // 环境光遮蔽贴图强度
    lightMap: "none",       // 光照贴图
    lightMapIntensity: 1.0, // 光照贴图强度

    refractionRatio: 0.98, // 折射率

};
