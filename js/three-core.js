var ThreeCore = function () {

  var self = this, container, renderer, camera, scene, light, ambientLight, cameraController;

  self.init = function () {

    container = self.container = document.getElementById("editor_canvas");

    renderer = self.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x505050);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene = self.scene = new THREE.Scene();
    scene.position.set(0, 0, 0);

    light = self.light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-100, 100, -100);
    light.lookAt(scene.position);
    scene.add(light);

    ambientLight = self.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    camera = self.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(30, 50, -30);
    camera.lookAt(scene.position);

    cameraController = self.cameraController = new THREE.OrbitControls(camera, renderer.domElement);
    cameraController.enablePan = false;
    cameraController.panSpeed = 0.02;
    cameraController.enableDamping = true;
    cameraController.dampingFactor = 0.05;
    cameraController.rotateSpeed = 0.5;
    cameraController.minDistance = 2;
    cameraController.maxDistance = 1200;
    cameraController.minPolarAngle = Math.PI * 0.2;
    cameraController.maxPolarAngle = Math.PI * 0.45;

    cameraController.update();

    var gridHelper = new THREE.GridHelper(30, 30, new THREE.Color(0xB2B2B2), new THREE.Color(0x888888));
    scene.add(gridHelper);

    renderer.render(scene, camera);

    self.fileLoader = new THREE.FileLoader();
    self.objectLoader = new THREE.ObjectLoader();
    self.materialLoader = new THREE.MaterialLoader();
    self.textureLoader = new THREE.TextureLoader();

  };

  self.resizeRenderArea = function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
  };

  self.setUpdate = function () {
    renderer.setAnimationLoop(this.update);
  };

};
