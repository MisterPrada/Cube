import * as THREE from '../build/three.module.js';
import { OrbitControls } from '../examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../examples/jsm/loaders/GLTFLoader.js';

var canvas_width = window.innerWidth-50; // Ширина канвас
var canvas_height = window.innerHeight-50; // Высота канвас

var controls;
var camera, scene, renderer;
var geometry, material, mesh, light;
var cube, cube_animations, cube_mesh;

var mixer, clips;
var clock = null;


var action, clip;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(0,0);


var regex_buttons = RegExp('^plug');
var clicked_elements = [];

// Добавлением событие если меняется размер экрана, надо адаптировать вывод сцены
window.addEventListener( 'resize', onWindowResize, false );

// Добавляем событие мыши и тач
window.addEventListener( 'click', onClick, false );
window.addEventListener( 'touchstart', onClick, false );



var loader = new GLTFLoader().setPath( 'models/' );
loader.load( 'cube.gltf', function ( gltf ) {
    /*gltf.scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.material.envMap = envMap;
        }
    } );*/
    scene.add( gltf.scene );
    cube_mesh = gltf;
    cube_animations = gltf.animations;
    cube = gltf.scene;
    cube.scale.set(0.3, 0.3, 0.3);

    mixer = new THREE.AnimationMixer( cube );
    clips = cube_mesh.animations;
    mixer.addEventListener( 'loop', function( e ) {
        //console.log('Сработала функция loop');
    } ); // properties of e: type, action and loopDelta
    mixer.addEventListener( 'finished', function( e ) {
        //console.log(e);
    } );

    animate(); // Запускаем обновление рендера и анимаций, только после загрузки всех объектов
} );




init();


function init() {

    //Вермя для анимаций
    clock = new THREE.Clock();

    // Камера
    camera = new THREE.PerspectiveCamera( 70, canvas_width / canvas_height, 0.01, 1000 ); // (Угор обзора, соотношение сторон, с какой точки камеры смотреть, как далеко будет видно)
    camera.position.z = 2;

    // Создаём сцену
    scene = new THREE.Scene();

    // 2 необходимых элемента для mesh
    geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    material = new THREE.MeshNormalMaterial();

    // Добавляем собранный объект
    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set(10,10,10);
    //scene.add( mesh );

    //cubemap
    var path = '/examples/textures/cube/SwedishRoyalCastle/';
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path + 'nx' + format,
        path + 'py' + format, path + 'ny' + format,
        path + 'pz' + format, path + 'nz' + format
    ];
    var reflectionCube = new THREE.CubeTextureLoader().load( urls );
    reflectionCube.format = THREE.RGBFormat;

    scene.background = reflectionCube;

    // Лампочки
    var light = new THREE.PointLight( 0xddffdd, 1.0 );
    light.position.z = 70;
    light.position.y = - 70;
    light.position.x = - 70;
    scene.add( light );
    var light2 = new THREE.PointLight( 0xffdddd, 1.0 );
    light2.position.z = 70;
    light2.position.x = - 70;
    light2.position.y = 70;
    scene.add( light2 );
    var light3 = new THREE.PointLight( 0xddddff, 1.0 );
    light3.position.z = 70;
    light3.position.x = 70;
    light3.position.y = - 70;
    scene.add( light3 );

    var canvas = document.querySelector('#tv_out');
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } ); // antialias убирает угловатость
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( canvas_width, canvas_height );
    renderer.gammaOutput = true;
    //document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    //controls.autoRotate = true;
    controls.enablePan = false; // Отключаем панорамное передвижение камеры
    //controls.enableDamping = true; // Придаём вес объекту

}


function animate() {

    // Браузер вызовет именно тогда, когда будет готов отрисовать следующий кадр
    requestAnimationFrame( animate );






    /*for ( var i = 0; i < intersects.length; i++ ) {

        ///intersects[ i ].object.material.color.set( 0xff0000 );

    }*/

    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.02;

    //mesh.rotation.x += 0.01;
    //mesh.rotation.y += 0.02;

    controls.update(); // Для
    mixer.update(clock.getDelta());

    renderer.render( scene, camera );

}

function onWindowResize() {
    canvas_width = window.innerWidth; // Ширина канвас
    canvas_height = window.innerHeight; // Высота канвас
    camera.aspect = canvas_width / canvas_height;
    camera.updateProjectionMatrix();
    renderer.setSize( canvas_width, canvas_height );
}

function onClick( event ) {
    //event.preventDefault();

    var clientX = 0;
    var clientY = 0;

    if('touches' in event){ // Тач события
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    }
    else{ // Клик мыши
        clientX = event.clientX;
        clientY = event.clientY;
    }

    mouse.x = ( clientX / canvas_width ) * 2 - 1;
    mouse.y = - ( clientY / canvas_height ) * 2 + 1;


    // Рейкаст
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObject( scene, true );
    //console.log(intersects);
    if(intersects.length && regex_buttons.test(intersects[0].object.name)){ // проекта на нажатие объекта и то что в его имени есть префикс (Plug)
        var num_animation = intersects[0].object.name.match(/[0-9]+/)[0]; // Добавляем номер стороны, на которую мы нажали
        if(!clicked_elements.includes(num_animation)){
            clicked_elements.push(num_animation); // добавляем в массив элемент, который уже был нажат, чтобы убрать повторные нажатия
            clip = THREE.AnimationClip.findByName( clips, 'plug' + num_animation + 'Action' ); // достаём определённую анимацию из объекта
            action = mixer.clipAction( clip ); // добавляем в миксер анимацию
            //action.reset();
            action.loop = THREE.LoopOnce; // Проиграть анимацию 1 раз
            action.clampWhenFinished = true; // Остановить анимацию на последнем кадре
            action.stop(); // Для обновления анимации, чтобы можно было её запустить заного
            action.play(); // запускаем анимацию (по таймеру
        }

        console.log(clicked_elements);
    }

    // Запустить все анимации
    /*clips.forEach( function ( clip ) {
        var act = mixer.clipAction( clip ).play();
        act.loop = THREE.LoopOnce; // Проиграть анимацию 1 раз
        act.clampWhenFinished = true; // Остановить анимацию на последнем кадре
        act.stop();
        act.play();
    } );*/

    /*var clip = THREE.AnimationClip.findByName( clips, 'plug2Action' );
    action = mixer.clipAction( clip );
    //action.reset();
    action.loop = THREE.LoopOnce; // Проиграть анимацию 1 раз
    action.clampWhenFinished = true; // Остановить анимацию на последнем кадре
    action.stop();
    action.play();*/

}
