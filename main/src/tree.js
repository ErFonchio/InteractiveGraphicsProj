// Generare assioma
//L'albero sarà una lista di diversi blocchi

function getRandomPoints(min, max, n, scale_factor, translation_factor){
    //Random generates between 0 and 1 -> we have to scale the points!
    //Also we have to translate the points according to the tranlsation vector (translation_factor)
    let ret = [];
    console.log(min, max, n);
    for (let i=0; i<n; i++){
        ret.push([  (Math.random(min,max)*scale_factor)+translation_factor[0]-scale_factor/2, 
                    (Math.random(min,max)*scale_factor)+translation_factor[1]-scale_factor/2, 
                    (Math.random(min,max)*scale_factor)+translation_factor[2]-scale_factor/2
                ]);
    }
    return ret;
}

export function initialize(){
    let kb = {
        position: [[0, -1, 0], [0, 0, 0], [0, 1, 0], [0, 2, 0]]
    };
    //Generare box tridimensionale
    let box = {
        type: "box",
        size: 20,
        position: [0, 10, 0],
        points: []
    };
    box.points = getRandomPoints(-Math.floor(box.size/2), Math.ceil(box.size/2), 100, box.size, box.position);
    return {kb, box};
}

//Inizializzare ciclo per produrre i rami
function generateBranches(kb, box){
    
}

//Completare i rami con le foglie