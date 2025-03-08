<template>
  <div id="container" class="container-fluid">
    <div class="d-flex flex-column h-100">
      <!-- Title of the page -->
      <div class="d-flex flex-column">
        <div class="text-center my-4">
          <h1>TD - Fingerprint</h1>
        </div>

        <div class="d-flex flex-row flex-wrap justify-content-between ">


          <div class="m-4 d-flex flex-row gap-2">
            <input type="number" v-model="mobileRSSI" class="form-control mt-auto mb-auto" :placeholder="mobileRSSI" />
            <button @click="computePosition()" class="btn btn-primary">Compute phone pos</button>
            {{ computedPosition ? `Position computed !` : '' }}
          </div>

          <h3 class="mt-auto mb-auto">
            <span v-if="threeContainerComp?.hoveredObject" class="badge text-bg-light fw-medium ">Coords : 
              {{ threeContainerComp?.hoveredObject?.position.x != null ? ('x : '+ threeContainerComp?.hoveredObject?.position.x ) : ''}}
              {{ threeContainerComp?.hoveredObject?.position.z != null ? ('z : '+ threeContainerComp?.hoveredObject?.position.z ) : ''}}
            
            
            </span>
          </h3>

        </div>
      </div>


      <!-- Three.js container, now takes the remaining height -->
      <div class="flex-grow-1 mb-4 px-3  position-relative">

        <ThreeContainer ref="threeContainerComp" :opacity="opacityEnabled" :bin="displayBin" :mobileRSSI="mobileRSSI"
          :controllers="displayControllers" :openState="openState" />
      </div>



    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, onUnmounted,computed } from 'vue';
import ThreeContainer from '@/components/ThreeContainer.vue';


// Variables for controlling visibility and opacity
const opacityEnabled = ref(true);
const displayBin = ref(true);
const displayControllers = ref(true);
const openState = ref(false);
const computedPosition = ref(null);
const mobileRSSI = ref(-32);

const threeContainerComp = ref(null)


  
const computePosition = () => {
  if(threeContainerComp.value)
  threeContainerComp.value.computePosition()
} 

</script>

<style scoped>
.container-fluid {
  height: 100vh;
  background-color: #f4f4f4;
}

.d-flex {
  display: flex;
}

.h-100 {
  height: 100%;
}

.flex-grow-1 {
  flex-grow: 1;
}

h1 {
  font-size: 3rem;
}

.form-check {
  display: inline-block;
  margin-right: 20px;
}
</style>