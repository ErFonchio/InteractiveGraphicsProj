import * as THREE from "three";
import { GrassBlade } from "./grassbladeScene";
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';


export class TerrainScene {
    constructor(scene, noise, texLoader) {
        // Crea una geometria quadrata
        this.noise = noise;
        this.texLoader = texLoader;
        const size = 40; //Terrain size
        const geometry = new THREE.PlaneGeometry(size, size);
        geometry.rotateX(-Math.PI / 2);
        const groundTex = this.texLoader.load('textures/rocky_terrain_02_diff_1k.jpg');
        const material = new THREE.MeshStandardMaterial({  
                                                            map: groundTex,
                                                        }); 

        const ground = new THREE.Mesh(geometry, material);
        //ground.rotation.x = -Math.PI / 2; // Ruota il piano orizzontalmente
        ground.position.y = 0; 
        ground.receiveShadow = true; 

        scene.add(ground);

        this.ground = ground;

        //Let's add some grass
        const sampler = new MeshSurfaceSampler(this.ground).build();

        let density = 1.5; // Aumenta per più punti
        let area = this.ground.geometry.parameters.width * this.ground.geometry.parameters.height;
        let numberOfPoints = Math.floor(area * density);

        const position = new THREE.Vector3();
        
        this.grassList = []

        for (let i = 0; i < numberOfPoints; i++) {
            sampler.sample(position); //Fa side effect sul vettore position
            const grass = new GrassBlade(scene, position.clone(), this.noise, this.texLoader);
            this.grassList.push(grass);
        }

    }
    update(time) {
        for (let i=0; i<this.grassList.length; i++){
            this.grassList[i].update(time);
        }
    }
}