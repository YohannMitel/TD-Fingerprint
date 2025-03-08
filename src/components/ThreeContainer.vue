<template>
  <div class="rounded shadow" ref="threeContainer" style="width: 100%; height: 100%;"></div>
</template>

<script setup>
import * as THREE from 'three';
import { onMounted, onUnmounted, ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

const rotationSpeed = 0.002;
const rotation = ref(rotationSpeed);

const props = defineProps({
  opacity: { type: Boolean, default: false },
  bin: { type: Boolean, default: true },
  controllers: { type: Boolean, default: true },
  openState: { type: Boolean, default: false }
});

const threeContainer = ref(null);
let renderer, scene, camera, controls, raycaster, hoveredObject, labelRenderer, phoneLabel, phoneLabelDiv,estSphere, mouse = [];

const beacons = [
  { x: 0.5, y: 0.5, z: 0.5, r: 3 },
  { x: 4, y: 0, z: 0, r: 2 },
  { x: 4, y: 5, z: 5, r: 4.2 },
  { x: 3, y: 3, z: 3, r: 2.5 }
];

const estimatedPosition = { x: 2, y: 2, z: 2 };
const initialCamPos = { x: -9.375, y: 7.255, z: 5.741 };

function onMouseMove(event) {
  const rect = threeContainer.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

const handleResize = () => {
  if (!renderer) return;
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  labelRenderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
};

const resetCamera = () => {
  camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
  camera.lookAt(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z);
  controls.reset();
};

const distanceToSphere = (beacon, point) => {
  console.log('REGARDE ICI :', beacon, point);
  const _point = { x: point[0], y: point[1], z: point[2] };
  console.log(_point.x, beacon.x, _point.y, beacon.y, _point.z, beacon.z)
  console.log(Math.sqrt((_point.x - beacon.x) ** 2 + (_point.y - beacon.y) ** 2 + (_point.z - beacon.z) ** 2))
  return Math.sqrt((_point.x - beacon.x) ** 2 + (_point.y - beacon.y) ** 2 + (_point.z - beacon.z) ** 2) - beacon.r;
};

const totalError = (point) => {
  return beacons.reduce((sum, beacon) => {
    const error = distanceToSphere(beacon, point) ** 2;
    console.log("sum:", sum, " | beacon:", beacon, " | point:", point, " | error:", error);
    return sum + error;
  }, 0);
};

const optimizePosition = (initialGuess) => {
  console.log('ICI', totalError(initialGuess));
  const result = numeric.uncmin(totalError, initialGuess);

  return result.solution;
};

const computePosition = () => {
  const initialGuess = [estimatedPosition.x, estimatedPosition.y, estimatedPosition.z];
  const optimizedPosition = optimizePosition(initialGuess);
  estimatedPosition.x = optimizedPosition[0];
  estimatedPosition.y = optimizedPosition[1];
  estimatedPosition.z = optimizedPosition[2];
  console.log('Optimized position:', estimatedPosition);


  phoneLabelDiv.textContent = `(${estimatedPosition.x.toFixed(2)}, ${estimatedPosition.y.toFixed(2)}, ${estimatedPosition.z.toFixed(2)})`;
  phoneLabel.position.set(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z);
  estSphere.position.set(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z);
  return estimatedPosition
};

onMounted(() => {
  if (!threeContainer.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef8f6);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  const axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemisphereLight.position.set(0, 50, 0);
  scene.add(hemisphereLight);

  camera = new THREE.PerspectiveCamera(75, threeContainer.value.clientWidth / threeContainer.value.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  threeContainer.value.appendChild(renderer.domElement);

  camera.position.set(initialCamPos.x, initialCamPos.y, initialCamPos.z);
  camera.lookAt(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  threeContainer.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 50;
  controls.minDistance = 5;

  beacons.forEach(beacon => {
    const geometry = new THREE.SphereGeometry(beacon.r, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: true, transparent: true, opacity: 0.3 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(beacon.x, beacon.y, beacon.z);
    scene.add(sphere);

    const pointGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(beacon.x, beacon.y, beacon.z);
    scene.add(point);

    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = `(${beacon.x}, ${beacon.y}, ${beacon.z})`;
    div.style.marginTop = '-1em';
    const label = new CSS2DObject(div);
    label.position.set(beacon.x, beacon.y, beacon.z);
    scene.add(label);
  });

  const estGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const estMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  estSphere = new THREE.Mesh(estGeometry, estMaterial);
  estSphere.position.set(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z);
  scene.add(estSphere);

  phoneLabelDiv = document.createElement('div');
  phoneLabelDiv.className = 'label';
  phoneLabelDiv.textContent = `(${estimatedPosition.x}, ${estimatedPosition.y}, ${estimatedPosition.z})`;
  phoneLabelDiv.style.marginTop = '-1em';
  phoneLabel = new CSS2DObject(phoneLabelDiv);
  phoneLabel.position.set(estimatedPosition.x, estimatedPosition.y, estimatedPosition.z)
  scene.add(phoneLabel);



  window.addEventListener('resize', handleResize);
  threeContainer.value.addEventListener('mousemove', onMouseMove);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();
});

onUnmounted(() => {
  threeContainer.value.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', handleResize);
  renderer.dispose();
});

defineExpose({
  resetCamera,
  computePosition
});
</script>

<style scoped>
div {
  display: block;
  position: relative;
  overflow: hidden;
}
</style>
