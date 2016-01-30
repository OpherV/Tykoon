(function() {
    var Level = function (game) {
        this.game = game;
        this.characters = {};
        this.timer = new Tykoon.Timer();

        Level.prototype.init.call(this);
    };


    Level.prototype.init = function () {
        var that = this;
        var urlVars=Tykoon.Utils.getUrlVars();
        this.postProcessingEnabled = !urlVars.postprocessing=="false";
        this.dimensions = 25000;
        this.positionGridSize = 1000;

        if (urlVars.showfps){
            document.getElementById("stats").style.display="block";
        }

        this.clock = new THREE.Clock();
        this.timer.play();

        var eventDispatcher = new THREE.EventDispatcher();
        eventDispatcher.apply(this);

        this.numTiles = Math.round(this.dimensions / this.positionGridSize);
        this.positionGrid = {};
        this.characters = {};
        this.characterArray = []; //this gets updated whenever a character is added or deleted
        this.proximityTests = {};
        this.lastTimestamp = 0;
        this.scene = new THREE.Scene();

        this.isPaused = false;
        this.selectedCharacter = null;



        this.cameras = [];
        this.orbitCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 100, this.dimensions * 5);
        this.orbitCamera.position.set(2600, 3000, 2600);
        this.cameras.push(this.orbitCamera);
        //this.cameras.push(new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.1, 5000 ));
        var topCamera = new THREE.OrthographicCamera(this.dimensions * window.innerWidth / window.innerHeight / -2,
            this.dimensions * window.innerWidth / window.innerHeight / 2,
            this.dimensions / 2,
            this.dimensions / -2,
            0.1, 10000);
        this.scene.add(topCamera);
        topCamera.position.set(0, 3000, 0);
        topCamera.rotation.x = -Math.PI / 2;
        //topCamera.rotation.z=Math.PI;
        this.cameras.push(topCamera);

        this.currentCameraIndex = 0;
        this.currentCamera = this.cameras[this.currentCameraIndex];

        var renderer = this.renderer = new THREE.WebGLRenderer();
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;
        renderer.setSize(window.innerWidth, window.innerHeight);


        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 1, 0);
        this.scene.add(hemiLight);

        //var dirLight = this.dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        //dirLight.color.setHSL(0.1, 1, 0.95);
        //dirLight.position.set(-10000, 4000, 10000);
        //dirLight.target = new THREE.Object3D(0, 0, 0);
        //dirLight.castShadow = true;
        ////dirLight.shadowCameraVisible=true;
        //dirLight.shadowCameraLeft = -this.dimensions / 2;
        //dirLight.shadowCameraRight = this.dimensions / 2;
        //dirLight.shadowCameraTop = this.dimensions / 2;
        //dirLight.shadowCameraBottom = -this.dimensions / 2;
        //dirLight.shadowCameraNear = -this.dimensions / 2;
        //dirLight.shadowCameraFar = this.dimensions;
        //dirLight.shadowMapWidth = dirLight.shadowMapHeight = 2048;
        //dirLight.castShadow = true;
        //this.scene.add(dirLight);



        //terrain
        //var geometry = new THREE.PlaneGeometry( 1000, 1000, 1 );
        //var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        //
        //var plane = new THREE.Mesh( geometry, material );
        //plane.rotation.x = Math.PI/2;
        //this.scene.add(plane);

        var island = this.island = this.game.assetCache["islandModel"].clone();

        var material = new THREE.MeshPhongMaterial( {
            map: this.game.assetCache["islandUV"]
            } );

        this.scene.add(island);
        island.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                var geometry = child.geometry;

                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                child.material = material;
                console.log(material);
            }
        } );


        var pointLight11 = new THREE.PointLight(0xffffff);
        pointLight11.position.set(0, 300, 200);

        this.scene.add(pointLight11);


        var hex  = 0xff0000;


        //var bbox = new THREE.BoundingBoxHelper( island, hex );
        //bbox.update();
        //this.scene.add( bbox );

        var particleLight = this.particleLight = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
        this.scene.add( particleLight );
        var pointLight = new THREE.PointLight( 0xffffff, 1);
        particleLight.add( pointLight );

        //skybox

        var geometry = new THREE.SphereGeometry(this.dimensions * 2, 60, 40);
        var uniforms = {
            texture: {type: 't', value: THREE.ImageUtils.loadTexture('images/skybox.jpg')}
        };

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: document.getElementById('sky-vertex').textContent,
            fragmentShader: document.getElementById('sky-fragment').textContent
        });

        var skyBox = this.skyBox = new THREE.Mesh(geometry, material);
        skyBox.scale.set(-1, 1, 1);
        skyBox.eulerOrder = 'XZY';
        skyBox.renderDepth = 1000.0;
        this.scene.add(skyBox);


        document.body.appendChild(renderer.domElement);

        this.initPostProcessing();
        this.setupControls();

        window.level = this;

        //this.debugger = new Tykoon.Debugger(this);
        //this.debugger.init();

        this.uiController = new Tykoon.UiController(this);

        this.setupCharacters();
        this.setupEvents();

        this.runStep(0);

    };


    Level.prototype.setupCharacters = function () {

        var newCharacter = this.selectedCharacter = new Tykoon.TykoonCharacter(this, Tykoon.Utils.generateGuid());
        newCharacter.obj.position.set(0, 0, 0);
        this.addCharacter(newCharacter);
        this.scene.add(newCharacter.obj);

        ////newCreature1.target=newCreature2.obj.position;
        ////newCreature2.target=newCreature1.obj.position;
        this.cameraObjectTracker=new THREE.Object3D();
        this.scene.add(this.cameraObjectTracker);

        //this.cameraObjectTracker.add(this.currentCamera);

    };

    Level.prototype.setupEvents = function(){
        this.addEventListener("ui.clickOnTerrain", function (ev) {
            this.selectedCharacter.target = ev.terrainPoint;
            this.selectedCharacter.steeringType = Tykoon.Steering.STEERINGTYPES.chase;
        });
    };


    Level.prototype.runStep = function (timestamp, lastTimestamp) {
        //this.game.stats.begin();
        var that = this;
        var delta = this.delta = this.clock.getDelta();
        this.animate(timestamp, lastTimestamp);

        for (var id in this.characters) {
            this.characters[id].runStep(timestamp, lastTimestamp);
        }


        //this.controls.update();


        if (this.postProcessingEnabled) {
            this.renderer.clear();
            this.composer.render(0.01);
        }
        else {
            this.renderer.render(this.scene, this.currentCamera);
        }

        requestAnimationFrame(function (timestamp) {
            that.runStep(timestamp, that.lastTimestamp);
            that.lastTimestamp = timestamp;
        });

        this.runProximityTests();

        var timer = 0.0001 * Date.now();

        this.particleLight.position.x = Math.sin( timer * 7 ) * 700;
        this.particleLight.position.y = Math.cos( timer * 5 ) * 800;
        this.particleLight.position.z = Math.cos( timer * 3 ) * 900;

        this.dispatchEvent({type: "render"});

        this.timer.tick();
        //this.game.stats.end();
    };

    Level.prototype.animate = function (timestamp) {

        //if (this.uiController.isPanning.left){
        //    this.controls.panLeft(50);
        //    this.controls.update();
        //}
        //if (this.uiController.isPanning.up){
        //    this.controls.panUp(50);
        //    this.controls.update();
        //}
        //if (this.uiController.isPanning.down){
        //    this.controls.panUp(-50);
        //    this.controls.update();
        //}
        //if (this.uiController.isPanning.right){
        //    this.controls.panLeft(-50);
        //    this.controls.update();
        //}

        this.skyBox.rotation.y += 0.0005;

        //this.thing.rotation.x += 0.001;
        //this.thing.rotation.y += 0.001;

        //if (keysDown[87] || (false && mousePos.down && mousePos.y/window.innerHeight<0.5 )){
        //    creature.translateZ(-1);
        //    isAnimating=true;
        //}
        //if (keysDown[83]){
        //    creature.translateZ(1);
        //    isAnimating=true;
        //}
        //if (keysDown[65] || (false && mousePos.down && mousePos.x/window.innerWidth<0.3 )){
        //    creature.rotation.y+=0.01;
        //    isAnimating=true;
        //}
        //if (keysDown[68] || (false && mousePos.down && mousePos.x/window.innerWidth>0.7 )){
        //    creature.rotation.y-=0.01;
        //    isAnimating=true;
        //}


        //if (keysDown[192]){
        //    debugLine(thing.position, downVector);
        //}



        //chase camera
        //var relativeCameraOffset = new THREE.Vector3(0,130,200);
        //var cameraOffset = relativeCameraOffset.applyMatrix4( creature.matrixWorld );
        //
        //chaseCamera.position.x = cameraOffset.x;
        //chaseCamera.position.y = cameraOffset.y;
        //chaseCamera.position.z = cameraOffset.z;
        //chaseCamera.lookAt( creature.position );

    };


    Level.prototype.initPostProcessing = function () {
        var hblur, vblur;

        //Create Shader Passes
        var renderModel = new THREE.RenderPass(this.scene, this.orbitCamera);
        this.copyPass = new THREE.ShaderPass(THREE.CopyShader);
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderModel);
        this.copyPass.renderToScreen = true;


        //film
        var effectFilm = new THREE.FilmPass(0.1, 0, 448, false);
        this.composer.addPass(effectFilm);


        //fxaa
        var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
        var width = window.innerWidth || 2;
        var height = window.innerHeight || 2;
        effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
        this.composer.addPass(effectFXAA);


        //blur
        hblur = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader);
        vblur = new THREE.ShaderPass(THREE.VerticalTiltShiftShader);
        var bluriness = 3;

        hblur.uniforms['h'].value = bluriness / window.innerWidth;
        vblur.uniforms['v'].value = bluriness / window.innerHeight;
        hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.5;

        this.composer.addPass(hblur);
        this.composer.addPass(vblur);

        //vignette
        var vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        vignettePass.uniforms["darkness"].value = 1.2;
        vignettePass.uniforms["offset"].value = 1;
        this.composer.addPass(vignettePass);

        this.composer.addPass(this.copyPass);
        this.copyPass.renderToScreen = true;
    };


    Level.prototype.setupControls = function () {
        var that = this;


        var controls = this.controls = new THREE.OrbitControls(this.orbitCamera);

        controls.target.set(0, 0, 0);
        controls.minDistance = 100;//1400;
        controls.maxDistance = 70000;//10000;

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.4;
        controls.panSpeed = 0.8;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

//controls.keys = [ 65, 83, 68 ];
        //controls.target=creature.position;


        this.addEventListener("ui.clickOnTerrain", function (ev) {
            if (that.uiController.mode == Tykoon.UiController.MODES.PLACEFOOD) {
                var foodDna = {
                    stats: {
                        isFood: true
                    },
                    traits: []
                };
                that.addCharacterByDna(ev.terrainPoint,foodDna);
                that.uiController.mode = Tykoon.UiController.MODES.IDLE;
            }
            else if (that.uiController.mode == Tykoon.UiController.MODES.PLACECREATURE){
                that.addCharacterByDna(ev.terrainPoint,this.placedCreature.dna);
                this.scene.remove(this.placedCreature);
                //todo dispose of this.placedCreature

                that.uiController.mode = Tykoon.UiController.MODES.IDLE;
            }
            else if (that.uiController.mode == Tykoon.UiController.MODES.PLACEPORTAL){
                var remoteWorldKey;
                //todo very simplistic, refactor into N worlds
                if (this.game.gameServer.worldKey=="mesa"){
                    remoteWorldKey=Math.random()>0.5?"ice":"green";
                }
                else if (this.game.gameServer.worldKey=="ice"){
                    remoteWorldKey=Math.random()>0.5?"mesa":"green";
                }
                if (this.game.gameServer.worldKey=="green"){
                    remoteWorldKey=Math.random()>0.5?"mesa":"ice";
                }

                that.openPortal(ev.terrainPoint,remoteWorldKey);
                that.game.gameServer.sendPortal(remoteWorldKey);
                that.uiController.mode = Tykoon.UiController.MODES.IDLE;
            }
        });

        this.addEventListener("ui.mouseMove", function (ev) {
            if (that.uiController.mode == Tykoon.UiController.MODES.PLACECREATURE) {
                if (ev.terrainPoint) {
                    this.placedCreature.position.copy(ev.terrainPoint);
                    this.placedCreature.position.y+=7;
                }
            }
        });

    };

    Level.prototype.addProximityTest = function (source, callback, params) {
        var that = this;

        var defaultParams={
            minDistance: 0,
            maxDistance: 200,
            checkInterval: 10,
            callbackInterval: 60
        };

        var _params=Tykoon.Utils.extend.call(defaultParams, params);

        var proximityTest = {
            id: Tykoon.Utils.generateGuid("proximityTest"),
            source: source,
            callback: callback,
            minDistance: _params.minDistance,
            maxDistance: _params.maxDistance,
            onCollisionEnd: _params.onCollisionEnd,
            startTime: this.timer.currentTime,
            checkInterval: _params.checkInterval,
            callbackInterval: _params.callbackInterval,
            collisionPairs: {} //this holds pairs that are currently colliding
        };

        proximityTest.destroy = function () {
            delete that.proximityTests[proximityTest.id];
        };

        this.proximityTests[proximityTest.id] = proximityTest;
        return proximityTest;
    };

//for each source, run proximity tests on relevant grids tiles
    Level.prototype.runProximityTests = function () {
        var gridTileId, gridTile, creature1Id, creature2Id, creature1, creature2, proximityTestId, proximityTest, distance, character;
        for (proximityTestId in this.proximityTests) {
            proximityTest = this.proximityTests[proximityTestId];

            //so that we don't flood the check every step
            if ((this.timer.currentTime-proximityTest.startOffset) % proximityTest.checkInterval > 0) {
                continue;
            }

            creature1 = proximityTest.source;
            creature1Id=creature1.id;
            gridTile = this.positionGrid[proximityTest.source.gridPositionString];

            for (creature2Id in gridTile) {
                creature2 = gridTile[creature2Id];
                var pairId=creature1Id+"_"+creature2Id;

                if (proximityTest.source != creature2 && !proximityTest.collisionPairs[pairId]) { //don't check against yourself.. also not already colliding
                    distance = creature1.obj.position.distanceTo(creature2.obj.position);
                    if (distance < proximityTest.maxDistance && distance > proximityTest.minDistance) {

                        //limit callback
                        if ((this.timer.currentTime-proximityTest.callbackInterval) % proximityTest.callbackInterval == 0) {
                            proximityTest.callback.call(creature1, creature2, distance, proximityTest);
                        }


                    }
                }
            }

        }

        //portal checking
        //todo should be more robust instead of this check
        for (var remoteWorldKey in this.portals){
            for (var characterId in this.characters){
                character=this.characters[characterId];
                if (!character.stats.isFood && !character.inTransit) {
                    var distanceToPortal = character.obj.position.distanceTo(this.portals[remoteWorldKey].obj.position);
                    if (distanceToPortal < 500) {
                        this.sendCharacter(character,remoteWorldKey)
                    }
                }
            }
        }

    };


    Level.prototype.findTargets = function () {
        var character;
        for (var key in this.characters) {
            if (this.characters.hasOwnProperty(key)) {
                character = this.characters[key];
                character.findTarget();
            }
        }
    };

    Level.prototype.cullCharacter = function (character) {
        delete this.positionGrid[character.gridPositionString][character.id];
        delete this.characters[character.id];
        updateCharacterArray.call(this);
        this.scene.remove(character.obj);
    };

    Level.prototype.animateToUiPosition = function(){
        this.oldCameraValues={
            position:{
                x: this.currentCamera.position.x,
                y: this.currentCamera.position.y,
                z: this.currentCamera.position.z
            },
            rotation:{
                x: this.currentCamera.rotation.x,
                y: this.currentCamera.rotation.y,
                z: this.currentCamera.rotation.z
            }
        };

        TweenMax.to(this.currentCamera.position, 3,
        {
            x: -3834.211964379465,
            y: 24542.365688535014,
            z: -22684.53323950272,
            ease: Power1.easeOut
        });
        TweenMax.to(this.currentCamera.rotation, 3,
            {
                x: -2.7252345079366576,
                y: 0.6423115876864506,
                z: 2.8826348767886856,
                ease: Power1.easeOut
            }
        );
        this.controls.enabled=false;
    };

    Level.prototype.animateFromUiPosition = function(){
        var that=this;

        TweenMax.to(this.currentCamera.position, 1,
            {
                x: this.oldCameraValues.position.x,
                y: this.oldCameraValues.position.y,
                z: this.oldCameraValues.position.z,
                ease: Power1.easeOut
            });
        TweenMax.to(this.currentCamera.rotation, 1,
            {
                x: this.oldCameraValues.rotation.x,
                y: this.oldCameraValues.rotation.y,
                z: this.oldCameraValues.rotation.z,
                ease: Power1.easeOut,
                onComplete: function(){
                    that.controls.enabled=true;
                }
            }
        );
    };



    Level.prototype.drawDebugHelpers = function () {
        this.debugMode = true;
        this.scene.add(new THREE.AxisHelper(1000));
        this.debugHelpers = {};


        this.debugGrid = {};
        var geometry = new THREE.PlaneGeometry(this.positionGridSize, this.positionGridSize);
        var greenMaterial = this.debugHelpers.greenMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        var redMaterial = this.debugHelpers.redMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });


        var debugLineMaterial = new THREE.LineBasicMaterial({color: 0xFFFF00});

        for (var x = 0; x < this.numTiles; x++) {
            for (var z = 0; z < this.numTiles; z++) {
                var plane = new THREE.Mesh(geometry, redMaterial);
                var newX = (x - Math.floor(this.numTiles / 2));
                var newZ = (z - Math.floor(this.numTiles / 2));
                plane.rotation.x = Math.PI / 2;

                plane.position.x = newX * this.positionGridSize + this.positionGridSize / 2;
                plane.position.y = 0;
                plane.position.z = newZ * this.positionGridSize + this.positionGridSize / 2;
                this.scene.add(plane);

                var vertDebugLineGeometry = new THREE.Geometry();
                var vertDebugLine = new THREE.Line(vertDebugLineGeometry, debugLineMaterial);
                vertDebugLineGeometry.vertices.push(new THREE.Vector3(plane.position.x + this.positionGridSize / 2, 0, plane.position.z - this.positionGridSize / 2));
                vertDebugLineGeometry.vertices.push(new THREE.Vector3(plane.position.x + this.positionGridSize / 2, 0, plane.position.z + this.positionGridSize - this.positionGridSize / 2));

                var horzDebugLineGeometry = new THREE.Geometry();
                var horzDebugLine = new THREE.Line(horzDebugLineGeometry, debugLineMaterial);
                horzDebugLineGeometry.vertices.push(new THREE.Vector3(plane.position.x - this.positionGridSize / 2, 0, plane.position.z + this.positionGridSize / 2));
                horzDebugLineGeometry.vertices.push(new THREE.Vector3(plane.position.x + this.positionGridSize - this.positionGridSize / 2, 0, plane.position.z + this.positionGridSize / 2));


                this.scene.add(vertDebugLine);
                this.scene.add(horzDebugLine);

                var gridPositionString = newX + "x" + newZ;
                this.debugGrid[gridPositionString] = plane;
            }
        }

    };



    Level.prototype.addCharacter = function (char) {
        this.characters[char.id]=char;
        updateCharacterArray.call(this);
    };


    function updateCharacterArray(){
        this.characterArray=[];
        for (var id in this.characters){
            this.characterArray.push(this.characters[id].obj);
        }
    }

    Tykoon.Level= Level;
})();