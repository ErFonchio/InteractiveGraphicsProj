import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { initialize } from "./tree.js";
import { Pane } from "tweakpane";

//initialize the pane for input management
const pane = new Pane();


// initialize the scene
const scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// add objects to the scene
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: "brown" });

// ADD tree axioms to the scene
const { kb, box } = initialize();

let axioms = []
for (let i=0; i<kb.position.length; i++){
    let position = kb.position[i];
    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cubeMesh.position.set(position[0], position[1], position[2]);
    scene.add(cubeMesh);
    axioms.push(cubeMesh);
}

// Create box for random points
const boxGeometry = new THREE.BoxGeometry(box.size, box.size, box.size);
const boxMaterial = new THREE.MeshBasicMaterial({ color: "green", wireframe: true});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh.position.set(box.position[0], box.position[1], box.position[2]);
scene.add(boxMesh);

// Add random points
let random_points = []
const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const pointMaterial = new THREE.MeshBasicMaterial({ color: "green" });
for (let i=0; i<box.points.length; i++){
    let point = box.points[i];
    const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    pointMesh.position.set(point[0], point[1], point[2]);
    random_points.push(pointMesh);
    scene.add(pointMesh);
}

pane.addButton({
    title: "Grow Tree",
}).on("click", () => {
    growTree();
});

var trunk_points = [...axioms];
var minimum_distance_points = []; //Will be needed to store the minimum distance points
var remaining_attraction_points = [...random_points];

function computeMinimumDistance(kill_distance=3, attraction_distance=10){
    console.log(trunk_points);
    //Just to visualize better
    trunk_points.forEach((trunk) => {
        trunk.material = new THREE.MeshBasicMaterial({ color: "brown" });
    });

    let minimum_distance_dictionary = new Map();
    let points_to_remove = [];
    for (let i=0; i<remaining_attraction_points.length; i++){

        let attraction_point = remaining_attraction_points[i];
        let minimum_point = null;
        let min_distance = 99999;
        for (let j=0; j<trunk_points.length; j++){
            //console.log("Processing trunk point: ", j);
            let trunk_point = trunk_points[j];
            let distance = attraction_point.position.distanceTo(trunk_point.position);
            //If the trunk point is too far from attraction distance, we don't want to add it.
            if (distance > attraction_distance){
                //console.log("Trunk point too far: ", trunk_point.position, distance);
                continue;
            }
            if (distance < min_distance){
                min_distance = distance;
                minimum_point = trunk_point;
            }
        }
        //If the point is too close to the trunk point, we don't want to add it. We erase it.
        if (min_distance <= kill_distance){
            points_to_remove.push(attraction_point);
            continue;
        }
        //If the point cannot reach the trunk point, we will just pass
        if (minimum_point == null){
            continue;
        }
        if (minimum_distance_dictionary.has(minimum_point)){
            minimum_distance_dictionary.get(minimum_point).push(attraction_point);
        }
        else{
            minimum_distance_dictionary.set(minimum_point, [attraction_point]);
        }
        //If the point was not already added to the minimum distance poits, we add it.
        if (!(minimum_distance_points.includes(minimum_point))){
            minimum_point.material = new THREE.MeshBasicMaterial({ color: "yellow" });
            minimum_distance_points.push(minimum_point);
        }
    }
    //Update the new minimum distance points. 
    //We don't care about all the other points.
    trunk_points = [...minimum_distance_points];
    /*Here we return to the original state -> 
        trunk_points has the available points (here the minimum points)
        and minimum_distance_points is empty
    */
    minimum_distance_points = [];
    //console.log("Remaining trunk points: ", trunk_points.length);
    
    //Actually remove the already too close points
    remaining_attraction_points = remaining_attraction_points.filter(point => !points_to_remove.includes(point));
    scene.remove(...points_to_remove);
    //console.log("Remaining attraction points: ", remaining_attraction_points.length);
    return minimum_distance_dictionary;
}

function computeAverageDistance(trunk, trunk_to_points){
    let average_distance_vector = [0, 0, 0]; //We are in three dimensions
    let trunk_position = trunk.position;
    //The expression is
    /*
    [x_dist, y_dist, z_dist] = sum {(s-v) / norm(s-v)}
    where s is the trunk point vector and v is the attraction point vector
    */
    let attractor_points = trunk_to_points.get(trunk); //This is a list of attractor
    for (let i=0; i<attractor_points.length; i++){
        let attraction_position = attractor_points[i].position;
        let distance = attraction_position.distanceTo(trunk_position);
        let temp = [attraction_position.x - trunk_position.x,
                    attraction_position.y - trunk_position.y,
                    attraction_position.z - trunk_position.z
                    ];
        temp = temp.map((x) => x/distance);
        //Finally add the computed distance
        average_distance_vector[0] += temp[0];
        average_distance_vector[1] += temp[1];
        average_distance_vector[2] += temp[2];
    }
    return average_distance_vector;

}

const growTree = (node_distance=1) => {
    //From every random point, find the closest trunk point
    let trunk_to_points = computeMinimumDistance();
    console.log("Trunk involved: ",trunk_to_points);
    //Then i compute the average distance between the trunk points and the random points
    for (const key of trunk_to_points.keys()){
        console.log("Processing trunk point: ", key.position);
        let average_distance = computeAverageDistance(key, trunk_to_points);
        //Now we compute the norm to normalize the vector
        let norm = Math.sqrt(average_distance[0]**2 + average_distance[1]**2 + average_distance[2]**2);
        //Normalize the vector
        average_distance = average_distance.map((x) => x/norm);

        //Now let's create a new branch
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cubeMesh.position.set(key.position.x + average_distance[0]*node_distance,
                              key.position.y + average_distance[1]*node_distance,
                              key.position.z + average_distance[2]*node_distance);
        scene.add(cubeMesh);
        cubeMesh.material = new THREE.MeshBasicMaterial({ color: "red" });
        trunk_points.push(cubeMesh);
        
    }
}


// initialize the camera
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 5, 30);

// initialize the renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// instantiate the controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = false;

window.addEventListener('resize', () =>{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight);
})

// render the scene
const renderloop = () => {

  controls.update();  
  renderer.render(scene, camera);
  window.requestAnimationFrame(renderloop);
};

renderloop();
