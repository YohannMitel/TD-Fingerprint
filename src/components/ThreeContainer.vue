<template>
  <div class="rounded shadow" ref="threeContainer" style="width: 100%; height: 100%;"></div>
</template>

<script setup>
import * as THREE from 'three';
import { onMounted, onUnmounted, ref } from 'vue';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { MobilePhone } from '@/composables/mobilePhone';


const props = defineProps({
  mobileRSSI: {
    type : Number,
    required : true
  }
})

const threeContainer = ref(null);
let renderer, scene, camera, controls, labelRenderer, mobilePhone, phone;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let intersectedObject = null;
const spheres = [];



const roomSize = 12;
const pieceSize = 4;
const hoveredObject = ref(null);


const cameraPosition = {"x":1.1703017078740392,"y":9.868887758567128,"z":5.232665689849491};


const handleResize = () => {
  if (!renderer) return;
  camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  labelRenderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
};

onMounted(() => {
  if (!threeContainer.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef8f6);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  light.position.set(0, 50, 0);
  scene.add(light);

  camera = new THREE.PerspectiveCamera(75, threeContainer.value.clientWidth / threeContainer.value.clientHeight, 0.1, 1000);
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  threeContainer.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  threeContainer.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;

  // Création du sol
  const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Création des pièces
  const pieceGeometry = new THREE.BoxGeometry(pieceSize, 2, pieceSize);
  const edgesGeometry = new THREE.EdgesGeometry(pieceGeometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

  for (let i = 0; i < roomSize / pieceSize; i++) {
    for (let j = 0; j < roomSize / pieceSize; j++) {
      const pieceEdges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      pieceEdges.position.set(
        -roomSize / 2 + pieceSize / 2 + i * pieceSize,
        1.01,
        -roomSize / 2 + pieceSize / 2 + j * pieceSize
      );
      scene.add(pieceEdges);
    }
  }

  // Ajout des mesures
  function createLabel(text, position) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    div.style.color = 'black';
    div.style.fontSize = '14px';
    div.style.background = 'rgba(255, 255, 255, 0.7)';
    div.style.padding = '2px 5px';
    div.style.borderRadius = '4px';

    const label = new CSS2DObject(div);
    label.position.set(position.x, position.y, position.z);
    scene.add(label);

    return label
  }

  createLabel(`Width : ${roomSize}m`, { x: 0, y: 0, z: roomSize / 2 + 0.5 });
  createLabel(`Length : ${roomSize}m`, { x: roomSize / 2 + 0.5, y: 0, z: 0 });
  createLabel(`Access point`, { x: -6 , y: 2, z: -6 });

  const objectLabel =  createLabel(``, { x: 0, y: 0, z: 0 });
  console.log(objectLabel)
  // Ajout des points rouges adaptés
  const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const adjustedPoints = [
        { x: -4, y: 1, z: -4, rssi: -30 }, // Center of (0, 0) to (4, 4)
        { x: 0, y: 1, z: -4, rssi: -35 }, // Center of (4, 0) to (8, 4)
        { x: 4, y: 1, z: -4, rssi: -40 }, // Center of (8, 0) to (12, 4)
        { x: -4, y: 1, z: 0, rssi: -33 }, // Center of (0, 4) to (4, 8)
        { x: 0, y: 1, z: 0, rssi: -40 }, // Center of (4, 4) to (8, 8)
        { x: 4, y: 1, z: 0, rssi: -42 }, // Center of (8, 4) to (12, 8)
        { x: -4, y: 1, z: 4, rssi: -37 }, // Center of (0, 8) to (4, 12)
        { x: 0, y: 1, z: 4, rssi: -41 }, // Center of (4, 8) to (8, 12)
        { x: 4, y: 1, z: 4, rssi: -44 }  // Center of (8, 8) to (12, 12)
  ];



  adjustedPoints.forEach((el) => {
    const sphere3D = new THREE.Mesh(sphereGeometry, redMaterial.clone());
    sphere3D.position.set(el.x, el.y, el.z);
    sphere3D.rssi = el.rssi;
    scene.add(sphere3D);
    spheres.push(sphere3D);
  });

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', handleResize);

  function onMouseMove(event) {
    const rect = threeContainer.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }


  function highlightIntersectedObject() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);

    if (intersects.length > 0) {
      if (intersectedObject !== intersects[0].object) {
        if (intersectedObject) {
          intersectedObject.material.color.set(0xff0000);
          hoveredObject.value = null;
          objectLabel.visible = false;
        }
        intersectedObject = intersects[0].object;
        intersectedObject.material.color.set(0x00ff00);
        hoveredObject.value = intersectedObject;
        objectLabel.element.textContent = `RSSI : ${intersectedObject.rssi}`;
        objectLabel.visible = true;
        objectLabel.position.set(intersectedObject.position.x, intersectedObject.position.y, intersectedObject.position.z);
      }
    } else if (intersectedObject) {
      intersectedObject.material.color.set(0xff0000);
      intersectedObject = null;
      objectLabel.visible = false;

      hoveredObject.value = null;
    }
  }
  
  // MOBILE PHONE PART 

  mobilePhone = new MobilePhone(3, adjustedPoints);
  const phoneMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const phoneGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  phone = new THREE.Mesh(phoneGeometry, phoneMaterial);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    highlightIntersectedObject();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();
});

const computePosition = () => {
  if (!mobilePhone) return;
  const position = mobilePhone.calculatePosition(props.mobileRSSI );
  phone.position.set(position.x, 1, position.z);
  scene.add(phone);

}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', handleResize);
  renderer.dispose();
});

defineExpose({
  computePosition,
  hoveredObject
})
</script>

<style scoped>
div {
  display: block;
  position: relative;
  overflow: hidden;
}
</style>