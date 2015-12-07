/**
 * Created by thanh on 12/6/2015.
 */
var camera, scene, renderer;
var keyState = Object.freeze ({unpressed: {}, note_on: {}, pressed:{}, note_off:{} });
var keys_down = [];
var keys_obj = [];
var obj_info = [];
var black_key = ["Lamp", "_37", "_39", "_42", "_44", "_46", "_49", "_51", "_54", "_56", "_58", "_61", "_63", "_66", "_68", "_70", "Omni01"];
var white_key_size = [0.280, 0.170, 1.941];
var songs =["hes_a_pirate.mid","game_of_thrones.mid","hedwigs_theme.mid","alb_se5_format0.mid","alb_se6.mid",
    "bach_846.mid","bohemian1.mid","chpn_op25_e1.mid","chpn_op53.mid","cruel_angel__s_thesis.mid","for_elise_by_beethoven.mid",
    "gra_esp_2.mid","haydn_35_1.mid","mario_-_overworld_theme.mid","me_cuesta.mid","michael_nyman-the_heart_asks_pleasure_first.mid",
    "mond_1.mid","mz_331_1.mid","mz_545_1.mid","schub_d760_1.mid","something_there.mid","ty_maerz.mid"];

// Begin MIDI loader widger
MIDI.loader = new widgets.Loader({
    message: "Loading: Soundfont....."
});

function smoothstep(a,b,x){
    if( x<a ) return 0.0;
    if( x>b ) return 1.0;
    var y = (x-a)/(b-a);
    return y*y*(3.0-2.0*y);
}
function mix(a,b,x){
    return a + (b - a)*Math.min(Math.max(x,0.0),1.0);
}

var controls = new function(){
    this.key_attack_time = 9.0;
    this.key_max_rotation = 0.72;
    this.octave = 2;
    this.songID = 1;
    this.song = "game_of_thrones.mid";
    this.noteOnColor = [ 255, 0, 0, 1.0 ];
    this.play = function(){
        MIDI.Player.resume();
    };
    this.stop = function(){
        MIDI.Player.stop();
    }
};
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(30, window.innerWidth/window.innerHeight, 2.0, 5000);
renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMapEnabled = true;
// renderer.shadowMapSoft = true;
// renderer.shadowMapType = THREE.PCFSoftShadowMap;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.physicallyBasedShading = true;
document.body.appendChild(renderer.domElement);
scene.fog = new THREE.Fog( 0xffffff, 40, 50 );
noteOnColor = new THREE.Color().setRGB(controls.noteOnColor[0]/256.0, controls.noteOnColor[1]/256.0, controls.noteOnColor[2]/256.0);

/* Render the floor */
function drawFloor(){
    var material = new THREE.MeshLambertMaterial( { color: 0x606060} );
    floor = new THREE.Mesh( new THREE.PlaneGeometry( 8000, 8000 ), new THREE.MeshBasicMaterial( { color: 0xf0f0f0 } ) );
    floor.rotation.x = - 90 * ( Math.PI / 180 );
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.castShadow = true;
    scene.add( floor );
    scene.fog = new THREE.Fog( 0xffffff, 40, 50 );

}

/* Set lighting for the world */
function init_lights(){
    var spotlight = new THREE.DirectionalLight(0xffffff);

    spotlight.position.set(-1,3,-7);
    spotlight.target.position.set(0,0,0);
    spotlight.shadowCameraVisible = false;
    spotlight.shadowDarkness = 0.75;
    spotlight.intensity = 1;
    spotlight.castShadow = true;
    spotlight.shadowMapWidth = 2048;
    spotlight.shadowMapHeight = 2048;

    spotlight.shadowCameraNear = 5.0;
    spotlight.shadowCameraFar = 20.0;
    spotlight.shadowBias = 0.0025;

    spotlight.shadowCameraLeft = -8.85;
    spotlight.shadowCameraRight = 5.5;
    spotlight.shadowCameraTop = 4;
    spotlight.shadowCameraBottom = 0;
    scene.add(spotlight);
}

drawFloor();
init_lights();

/* Set up properties for camera */
camera.position.x = 0;
camera.position.y = 3.0;
camera.position.z = 6.5;
camera.lookAt(new THREE.Vector3(0, 0, 0));
var cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
cameraControls.target.set(0,0,0);
//        function drawAxes(){
//            // Ox axis (blue light)
//            var material1 = new THREE.LineBasicMaterial({color: 0x0000ff});
//            var geometry1 = new THREE.Geometry();
//            geometry1.vertices.push(new THREE.Vector3(0, 0, 0));
//            geometry1.vertices.push(new THREE.Vector3(5, 0, 0));
//            var line1 = new THREE.Line(geometry1, material1);
//            scene.add(line1);
//            // Oy axis (red line)
//            var material2 = new THREE.LineBasicMaterial({color: new THREE.Color("rgb(255, 0, 0)")});
//            var geometry2 = new THREE.Geometry();
//            geometry2.vertices.push(new THREE.Vector3(0, 0, 0));
//            geometry2.vertices.push(new THREE.Vector3(0, 5, 0));
//            var line2 = new THREE.Line(geometry2, material2);
//            scene.add(line2);
//            // Oz axis (pink line)
//            var material3 = new THREE.LineBasicMaterial({color: new THREE.Color("rgb(255, 5, 255)")});
//            var geometry3 = new THREE.Geometry();
//            geometry3.vertices.push(new THREE.Vector3(0, 0, 0));
//            geometry3.vertices.push(new THREE.Vector3(0, 0, 5));
//            var line3 = new THREE.Line(geometry3, material3);
//            scene.add(line3);
//        }
//        drawAxes();
 var fingers = [new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)];
//var fingers = [new THREE.Vector3(0,0,0)];
var spheres = [];
/* Draw finger tips as cube spheres */
function drawFingerTips(){
    for (var i=0; i < fingers.length; i++)  {
        var geometry = new THREE.CubeGeometry(0.1,0.1,0.1); // Create a 20 by 20 by 20 cube.
        var material = new THREE.MeshBasicMaterial({ color: 0x0000FF }); // Skin the cube with 100% blue.
        var cube = new THREE.Mesh(geometry, material); // Create a mesh based on the specified geometry (cube) and material (blue skin).
        cube.position = fingers[i];
        spheres[i] = cube;
        scene.add(cube); // Add the cube at (0, 0, 0).
    }
}
drawFingerTips();

function updateFingerTips(){
    for (var i=0; i < fingers.length; i++)  {
        spheres[i].position = fingers[i];
    }
}
var clock = new THREE.Clock();

/* Load dae file and rendering piano */
var loader = new THREE.ColladaLoader();
loader.load( 'obj/piano.dae', prepare_scene );

function prepare_scene( collada ){
    collada.scene.traverse(initialize_keys);
    console.log(obj_info);
    scene.add(collada.scene);
}

/* Render each piano based on the given Object3D of ThreeJS */
function initialize_keys( obj){
    keys_obj.push(obj);
    pushObj(obj)
    obj.rotation.x = -Math.PI/4.0;
    obj.rotation.y = 0;
    obj.rotation.z = 0;
    obj.keyState = keyState.unpressed;
    obj.clock = new THREE.Clock(false);
    obj.castShadow = true;
    obj.receiveShadow = true;
    // only add meshes in the material redefinition (to make keys change their color when pressed)
    if (obj instanceof THREE.Mesh){
        old_material = obj.material;
        obj.material = new THREE.MeshPhongMaterial( { color:old_material.color} );
        obj.material.shininess = 35.0;
        obj.material.specular = new THREE.Color().setRGB(0.25, 0.25, 0.25);
        obj.material.note_off = obj.material.color.clone();
    }

}

/* Check if the given key is black key */
function check_key(name) {
    for (var i = 0; i < black_key.length; i++) {
        if (name == black_key[i]) return true;
    }
    return false;
}

/* Add obj information to array */
function pushObj(obj) {
    if (!check_key(obj.name)){
        var key_name= obj.name;
        var key_position= obj.position;
        var key_topleft= [obj.position.x - white_key_size[0]/2, obj.position.y + white_key_size[1], obj.position.z];
        var key_topright= [obj.position.x + white_key_size[0]/2, obj.position.y + white_key_size[1], obj.position.z];
        var key_bottomleft= [obj.position.x - white_key_size[0]/2, obj.position.y + white_key_size[1], obj.position.z + white_key_size[2]+ 0.5];
        var key_bottomright= [obj.position.x + white_key_size[0]/2, obj.position.y + white_key_size[1], obj.position.z + white_key_size[2]+ 0.5];
        var key = {};
        key.name = key_name;
        key.position = key_position;
        key.topleft = key_topleft;
        key.topright = key_topright;
        key.bottomleft = key_bottomleft;
        key.bottomright = key_bottomright;
        console.log(key.name+":"+key.topleft[0]+":"+key.topright[0]);
        obj_info.push(key);
    }
}

/* Mapping Leap coordinate to Three JS world */
function leapToScene( position , frame ){
    var iBox = frame.interactionBox;
    var x = position[0];
    var y = position[1];
    var z = position[2];
    x /= iBox.width;
    y /= iBox.height;
    z /= iBox.depth;

    x*= 6;
    z= 1.9;
    return new THREE.Vector3(x,y,z);
}

/* Mapping position of finger to appropriate piano key */
function tapPosToKey(position){
    console.log(obj_info);
    for (var i=1; i< obj_info.length; i++){
        if (obj_info[i].topleft[0] <= position.x && obj_info[i].topright[0] >= position.x){
            console.log(obj_info[i].name);
            return obj_info[i].name;
        }
    }
}

/* Set key status for the given keyname */
function key_status (keyName, status){
    var obj = scene.getObjectByName(keyName, true);
    if (obj != undefined && obj.clock != undefined){
        obj.clock.start();
        obj.clock.elapsedTime = 0;
        obj.keyState = status;
    }
}

/* Update continuously */
function loop(){
    // frame = controller.frame();
    requestAnimationFrame( loop );
    var delta = clock.getDelta();
    update(delta);
    render(delta);
    updateFingerTips();
}
loop();

/* Update piano key based on event */
function update_key( obj, delta ){
    if (obj.keyState == keyState.note_on){
        obj.rotation.x = mix(-Math.PI/4.0, -controls.key_max_rotation, smoothstep(0.0, 1.0, controls.key_attack_time*obj.clock.getElapsedTime()));
        if (obj.rotation.x >= -controls.key_max_rotation){
            obj.keyState = keyState.pressed;
            obj.clock.elapsedTime = 0;
        }
        obj.material.color = noteOnColor;
    }else
    if (obj.keyState == keyState.note_off){
        obj.rotation.x = mix(-controls.key_max_rotation, -Math.PI/4.0, smoothstep(0.0, 1.0, controls.key_attack_time*obj.clock.getElapsedTime()));
        if (obj.rotation.x <= -Math.PI/4.0){
            obj.keyState = keyState.unpressed;
            obj.clock.elapsedTime = 0;
        }
        obj.material.color = obj.material.note_off;
    }
}

/* Update on interval of delta */
function update( delta ){
    cameraControls.update(delta);
    for(i in keys_obj){
        update_key(keys_obj[i], delta);
    }
}

/* Render on update */
function render( delta ){
    renderer.render(scene, camera);
}


/* Mapping key to note on piano */
function keyCode_to_note( keyCode){
    var note = -1;
    //-----------------------------------
    if(   keyCode==90 )  note= 0; // C 0
    if(   keyCode==83 )  note= 1; // C#0
    if(   keyCode==88 )  note= 2; // D 0
    if(   keyCode==68 )  note= 3; // D#0
    if(   keyCode==67 )  note= 4; // E 0
    if(   keyCode==86 )  note= 5; // F 0
    if(   keyCode==71 )  note= 6; // F#0
    if(   keyCode==66 )  note= 7; // G 0
    if(   keyCode==72 )  note= 8; // G#0
    if(   keyCode==78 )  note= 9; // A 0
    if(   keyCode==74 )  note=10; // A#0
    if(   keyCode==77 )  note=11; // B 0
    if(   keyCode==188 ) note=12; // C 0

    //-----------------------------------
    if(   keyCode==76 )  note=13; // C#1
    if(   keyCode==190 )  note=14; // D 1
    if(   keyCode==186 )  note=15; // D#1
    if(   keyCode==191 )  note=16; // E 1
    if(   keyCode==81 )  note=17; // F 1
    if(   keyCode==50 )  note=18; // F#1
    if(   keyCode==87 )  note=19; // G 1
    if(   keyCode==51 )  note=20; // G#1
    if(   keyCode==69 )  note=21; // A 1
    if(   keyCode==52 )  note=22; // A#1
    if(   keyCode==82 )  note=23; // B 1
    //-----------------------------------
    if(   keyCode==84 )  note=24; // C 2
    if(   keyCode==54 )  note=25; // C#2
    if(   keyCode==89 )  note=26; // D 2
    if(   keyCode==55 )  note=27; // D#2
    if(   keyCode==85 )  note=28; // E 2
    if(   keyCode==73 ) note=29; // F 2
    if(   keyCode==57 ) note=30; // F#2
    if(   keyCode==79 ) note=31; // G 2
    //-----------------------------------
    if(   keyCode==48 ) note=32; // G#2
    if(   keyCode==80 ) note=33; // A 3
    if(   keyCode==189 ) note=34; // A#3
    if(   keyCode==219 ) note=35; // B 3
    //-----------------------------------

    if( note == -1 ) return -1;

    return ("_" + (note + 3*12));

}

window.onkeydown = function(ev)
{
    if (keys_down[ev.keyCode] != true)
    {
        var note = keyCode_to_note(ev.keyCode);
        if (note != -1)
        {
            key_status(note, keyState.note_on);
            keys_down[ev.keyCode] = true;

            var delay = 0; // play one note every quarter second
            var note = parseInt(note.substr(1))+21; // the MIDI note
            var velocity = 127; // how hard the note hits
            MIDI.setVolume(0, 127);
            MIDI.noteOn(0, note, velocity, delay);
        }
    }
};

window.onkeyup = function(ev)
{
    if (keys_down[ev.keyCode] == true)
    {
        var note = keyCode_to_note(ev.keyCode);
        key_status(note, keyState.note_off);
        keys_down[ev.keyCode] = false;

        var delay = 0; // play one note every quarter second
        var note = parseInt(note.substr(1))+21;
        var velocity = 127;// how hard the note hits
        MIDI.setVolume(0, 127);
        MIDI.noteOff(0, note, delay + 0.08);
    }

};

window.onload = function ()
{
    MIDI.loadPlugin(function ()
    {
        //MIDI.Player.loadFile(song[0], MIDI.Player.start);
        MIDI.Player.timeWarp = 1.0; // speed the song is played back
        MIDI.Player.loadFile("midi/" + controls.song);

        MIDI.Player.addListener(function(data)
        {
            var pianoKey = data.note - MIDI.pianoKeyOffset - 3;
            if (data.message === 144)
            {
                key_status("_" + pianoKey, keyState.note_on);
            }
            else
            {
                key_status("_" + pianoKey, keyState.note_off);
            }
        });

        // Close the MIDI loader widget and open the GUI
        MIDI.loader.stop();
        songsToFiles ={
            "Game Of Thrones Theme, Ramin Djawadi": "game_of_thrones.mid",
            "Mario Overworld Theme (Super Mario Bros 3), Koji Kondo": "mario_-_overworld_theme.mid",
            "He's a Pirate (Pirates of the Caribbean), Klaus Badelt" : "hes_a_pirate.mid",
            "Hedwigs Theme (Harry Potter), John Williams": "hedwigs_theme.mid",
            "Something There (Beauty and the Beast), Alan Menken":"something_there.mid",
            "Cruel Angel Thesis (Neon Genesis Evangelion)": "cruel_angel__s_thesis.mid",
            "Me cuesta tanto olvidarte (Mecano)": "me_cuesta.mid",
            "Sonata No. 14 C# minor (Moonlight), Beethoven": "mond_1.mid",
            "For Elise, Beethoven": "for_elise_by_beethoven.mid",
            "Asturias (Leyenda), Albeniz": "alb_se5_format0.mid",
            "Aragon (Fantasia), Albeniz": "alb_se6.mid",
            "Prelude and Fugue in C major BWV 846, Bach": "bach_846.mid",
            "Fantasia C major, Schubert": "schub_d760_1.mid",
            "Sonata No. 16 C major, Mozart": "mz_545_1.mid",
            "Sonata No. 11 A major (Alla Turca), Mozart": "mz_331_1.mid",
            "March - Song of the Lark, Tchaikovsky":"ty_maerz.mid",
            "Piano Sonata in C major, Hoboken, Haydn": "haydn_35_1.mid",
            "Etudes, Opus 25, Chopin": "chpn_op25_e1.mid",
            "Polonaise Ab major, Opus 53, Chopin": "chpn_op53.mid",
            "No. 2 - Oriental, Granados": "gra_esp_2.mid",
            "Bohemian Rhapsody, Queen": "bohemian1.mid",
        };
        var gui = new dat.GUI({ width:625});
        //gui.add(controls, 'key_attack_time', 2.0 , 40.0);
        //gui.add(controls, 'key_max_rotation',0.2 , 1.0);
        var song = gui.add(controls, 'song', songsToFiles);
        var noteOnColorControl = gui.addColor(controls, 'noteOnColor');
        noteOnColorControl.onChange(function(value)
        {
            noteOnColor = new THREE.Color().setRGB(controls.noteOnColor[0] / 256.0, controls.noteOnColor[1] / 256.0, controls.noteOnColor[2] / 256.0);
        });

        song.onChange(function(value)
        {
            MIDI.Player.stop();
            MIDI.Player.loadFile("midi/" + value, MIDI.Player.start);
        });

        // make sure to remove any key pressed when changing the octave
        gui.add(controls, 'play');
        gui.add(controls, 'stop');
    });
};

/* Forward/Backward song by using Leap */
var d = new Date();
var lastChangeSongTime = d.getTime();
var controller = Leap.loop({enableGestures: true}, function(frame){
    frame.hands.forEach(function(hand, index) {
        hand.fingers.forEach(function(finger,index){
            // console.log(index);
            var fPosition = finger.tipPosition;
            fingers[index]= leapToScene(fPosition,frame);
        })
    });
    if(frame.valid && frame.gestures.length > 0){
        frame.gestures.forEach(function(gesture){
            switch (gesture.type){
                case "circle":
//                         d = new Date();
//                         var distance = d.getTime()-lastChangeSongTime;
//                         if (distance > 1000){
//                             lastChangeSongTime = d.getTime();
//                             controls.stop();
//                             controls.play();
//                         }
                    break;
                case "keyTap":
                    console.log("Key Tap Gesture");
                    var sencePos = leapToScene(gesture.position,frame);
                    var tapKeyName = tapPosToKey(sencePos);
                    if (tapKeyName != undefined){
                        key_status(tapKeyName,keyState.note_on);
                        var delay = 0; // play one note every quarter second
                        var note = parseInt(tapKeyName.substr(1))+21; // the MIDI note
                        var velocity = 127; // how hard the note hits
                        MIDI.setVolume(0, 127);
                        MIDI.noteOn(0, note, velocity, delay);
                        setTimeout(key_status(tapKeyName,keyState.note_off),50000);
                        //key_status(note, keyState.note_off);
                    }
                    break;
                case "screenTap":
                    console.log("Screen Tap Gesture");
                    break;
                case "swipe":
                    var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
                    if(isHorizontal){
                        d = new Date();
                        var distance = d.getTime()-lastChangeSongTime;
                        if ( distance > 1000){
                            lastChangeSongTime = d.getTime();
                            if(gesture.direction[0] > 0){
                                //swipeDirection = "right";
                                console.log("Swipe Gesture Right");
                                controls.songID++;
                                if (controls.songID >= songs.length) controls.songID = 0;
                                controls.song = songs[controls.songID];
                                MIDI.Player.stop();
                                MIDI.Player.loadFile("midi/" + controls.song, MIDI.Player.start);
                            } else {
                                console.log("Swipe Gesture Left");
                                //swipeDirection = "left";
                                controls.songID--;
                                if (controls.songID < 0) controls.songID = songs.length - 1;
                                controls.song = songs[controls.songID];
                                MIDI.Player.stop();
                                MIDI.Player.loadFile("midi/" + controls.song, MIDI.Player.start);
                            }
                        }
                    } else {
                        console.log("Vertical Swipe Gesture");
                        controls.stop();
                    }

                    break;
            }});
    }
});

/* Listener for window resize event */
function on_window_resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
window.addEventListener( 'resize', on_window_resize, false );