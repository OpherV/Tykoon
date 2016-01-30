
(function() {


    var Character = function (level, id) {
        this.id = id;
        this.level = level;
        this.animations = {};

        Character.prototype.init.call(this);
    };
    Tykoon.Character = Character;
    Character.prototype.constructor = Character;


    Character.BEHAVIORS = {
        normal: "normal",
        gototarget: "gototarget"
    };


    Character.prototype.init = function () {
        var that = this;
        //this.bindMethods();

        var extend = Tykoon.Utils.extend;

        var eventDispatcher = new THREE.EventDispatcher();
        eventDispatcher.apply(this);

        this.timeHandlers = {};
        this.behavior=Character.BEHAVIORS.normal;


        var defaultStats = {
            maxEnergy: 100,
            maxLife: 100,
            size: 1,
            speed: 2,
            rotateSpeed: 0.1,
            colorHSLA: [0, 69, 55, 1]
        };


        this.stats = extend.call({}, defaultStats);
        this.modifiedStats = extend.call({}, this.stats);
        this.velocity = new THREE.Vector2(1, 0).setLength(this.modifiedStats.speed);

        //3d representation
        this.obj = new THREE.Object3D();
        this.obj.character = this;
        this.obj.position = new THREE.Vector3();

        this.renderBody();

        //
        //if (this.level.debugger.active) {
        //    this.debugObj = new THREE.Object3D();
        //    this.obj.add(this.debugObj);
        //    var cubeMaterial = new THREE.MeshBasicMaterial({wireframe: true});
        //    this.debugCube = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), cubeMaterial);
        //    this.debugCube.visible = false;
        //    this.debugObj.add(this.debugCube);
        //
        //    this.debugTarget = this.level.debugger.drawArrow();
        //    this.debugTarget.visible = false;
        //}

    };

    Character.prototype.serialize=function () {
        var parcel={
            localId: this.id,
            dna: Tykoon.Utils.clone(this.dna),
            modifiedStats: Tykoon.Utils.clone(this.modifiedStats)
        };
        return parcel
    };

    Character.prototype.bindMethods=function(){
        this.replicationPause=this.replicationPause.bind(this);
        this.die=this.die.bind(this);
    };



    Character.prototype.setupEmitters= function () {
        //setup breeding indicator particle

        //// Create a particle group to add the emitter to.
        //this.breedingParticleGroup = new SPE.Group({
        //    // Give the particles in this group a texture
        //    texture: this.level.game.assetCache['heart'],
        //    blending: THREE.NormalBlending,
        //    //transparent: false,
        //    colorize: 1,
        //    // How long should the particles live for? Measured in seconds.
        //    maxAge: 5
        //});
        //
        //// Create a single emitter
        //this.breedingParticleEmitter = new SPE.Emitter({
        //    position: new THREE.Vector3(0, 200, 0),
        //    positionSpread: new THREE.Vector3( 0, 0, 0 ),
        //
        //    acceleration: new THREE.Vector3(0, -10, 0),
        //    accelerationSpread: new THREE.Vector3( 10, 0, 10 ),
        //
        //    velocity: new THREE.Vector3(0, 200, 0),
        //    velocitySpread: new THREE.Vector3(10, 7.5, 10),
        //
        //    opacityStart: 1,
        //    opacityMiddle: 0.6,
        //    opacityEnd: 0,
        //
        //    //colorStart: new THREE.Color('red'),
        //    //colorEnd: new THREE.Color('white'),
        //
        //    angleStart: Math.PI,
        //    angleEnd: Math.PI,
        //    angleMiddleSpread: 0.3,
        //
        //
        //    sizeStart: 200,
        //    sizeEnd: 1500,
        //
        //    particleCount: 5
        //});
        //
        //// Add the emitter to the group.
        //this.breedingParticleGroup.addEmitter( this.breedingParticleEmitter );
        //
        //// Add the particle group to +the scene so it can be drawn.
        //this.obj.add( this.breedingParticleGroup.mesh ); // Where `scene` is an instance of `THREE.Scene`.
        //
        //this.breedingParticleEmitter.disable();

        // Create a particle group to add the emitter to.
        this.poisonParticleGroup = new SPE.Group({
            // Give the particles in this group a texture
            texture: this.level.game.assetCache['poison'],
            blending: THREE.AdditiveBlending,
            //transparent: false,
            colorize: 1,
            // How long should the particles live for? Measured in seconds.
            maxAge: 5
        });

        // Create a single emitter
        this.poisonParticleEmitter = new SPE.Emitter({
            position: new THREE.Vector3(0, 200, 0),
            positionSpread: new THREE.Vector3( 0, 0, 0 ),

            acceleration: new THREE.Vector3(0, 1, 0),
            accelerationSpread: new THREE.Vector3( 10, 10, 10 ),

            velocity: new THREE.Vector3(10, 10, 10),
            velocitySpread: new THREE.Vector3(10, 10, 10),

            opacityStart: 1,
            opacityMiddle: 0.6,
            opacityEnd: 0,

            //colorStart: new THREE.Color('red'),
            colorEnd: new THREE.Color('white'),

            angleStartSpread: Math.PI,
            angleEndSpread: Math.PI,

            sizeStart: 400,
            sizeEnd: 800,

            particleCount: 5
        });

        // Add the emitter to the group.
        this.poisonParticleGroup.addEmitter( this.poisonParticleEmitter );

        // Add the particle group to +the scene so it can be drawn.
        this.obj.add( this.poisonParticleGroup.mesh ); // Where `scene` is an instance of `THREE.Scene`.

        this.poisonParticleEmitter.disable();
    };

    Character.prototype.renderBody = function () {
        var that = this;

        var geometry = new THREE.SphereGeometry(30, 8, 8);
        var material =  new THREE.MeshLambertMaterial( {
            //ambient: 0x44B8ED,
            color: 0x999999,
            //emissive: 0xF4FF1C,
            //side: THREE.DoubleSide,
            //map: this.level.game.assetCache["tykoonUV"]
            //shading: THREE.FlatShading
        } );
        //var creatureObj = this.creatureObj = new THREE.Mesh(geometry, material);
        //creatureObj.scale.set(0.1,0.1,0.1);

        var creatureObj = this.creatureObj = new THREE.BlendCharacter();
        var model = this.level.game.assetCache["tykoonCharacter"];
        model.materials[0] = material;
        creatureObj.load(model);
        creatureObj.play("animation");
        //creatureObj.animations["animation"].timeScale = 100;
        creatureObj.mixer.timeScale = 3;
        this.creatureObj.scale.set(0.2,0.2,0.2);
        this.creatureObj.rotation.y = -Math.PI/2;


        creatureObj.position.y+=40;
        //creatureObj.castShadow = true;
        //geometry.computeFaceNormals();
        that.obj.add(creatureObj);
    };

    Character.prototype.runStep = function (timestamp, lastTimestamp) {
        if (this.behavior == Character.BEHAVIORS.gototarget){
            if (this.obj.position.distanceTo(this.target) < 30){
                this.behavior = Character.BEHAVIORS.normal;
                this.steeringType = Tykoon.Steering.STEERINGTYPES.idle;
            }

            this.steer();
        }
        else if (this.behavior==Character.BEHAVIORS.normal) {
            this.steer();
        }
        this.updateGridPosition();

        //todo not performant
        //var terrainPosition = this.level.terrain.getPosition(this.obj.position.x, this.obj.position.z);
        //var yPos = terrainPosition.height;
        //this.obj.position.y = yPos + this.level.terrain.obj.position.y + 7;

        this.obj.position.y = 30;

        //hexapods hog the ground
        //if (this.traits.Hexapod) {
        //    //gradual change
        //    var normalClone=terrainPosition.normal.clone();
        //    var oldY=this.obj.rotation.y;
        //    var oldRotation=new THREE.Vector3(this.obj.rotation.x,0,this.obj.rotation.z);
        //    this.obj.lookAt(normalClone.add(this.obj.position));
        //    var newRotation=new THREE.Vector3(this.obj.rotation.x,0,this.obj.rotation.z);
        //
        //    var lerp=oldRotation.add( newRotation.sub(oldRotation).setLength(0.02) );
        //    this.obj.rotation.set(lerp.x,oldY,lerp.z);
        //
        //    lerp=null;
        //    normalClone=null;
        //    oldY=null;
        //    newRotation=null;
        //    oldRotation=null;
        //

        this.animate(timestamp, lastTimestamp)
    };


    Character.prototype.animate = function (timestamp, lastTimestamp) {
        var delta=this.level.delta;
        if(this.breedingParticleGroup) {
            this.breedingParticleGroup.tick(delta);
        }
        if(this.poisonParticleGroup) {
            this.poisonParticleGroup.tick(delta);
        }
        if (this.creatureObj.update) {
            this.creatureObj.update(delta);
        }
    };

    Character.prototype.steer = function () {
        this.steering=this.steering?this.steering:new Tykoon.Steering(this); //lazy initialize steering

        if (this.steeringType == Tykoon.Steering.STEERINGTYPES.idle) {
            return;
        }

        if (this.steeringType == Tykoon.Steering.STEERINGTYPES.drift) {
            this.steering.drift();
        }
        if (this.steeringType == Tykoon.Steering.STEERINGTYPES.wander) {
            this.steering.wander();
        } else if (this.steeringType == Tykoon.Steering.STEERINGTYPES.chase) {

            if (this.target) {
                this.steering.chase();
            }
            else{
                this.steering.wander();
            }

        }

        //debug
        //this.target=this.level.mouseTerrainPoint;

        //add steering and clamp values
        this.steering.finalize();
        //this.steering.avoidBounds();
        //if (!this.traits.Hexapod) {
        //    this.steering.avoidSteep();
        //}
        //console.log(this.steering.finalVelocity);
        this.obj.position.add(this.steering.finalVelocity);
        var targetRotation = Math.PI * 2 - Math.atan2(this.steering.velocity.y, this.steering.velocity.x);
        if (Math.abs(targetRotation - this.obj.rotation.y) > 0.05) {
            this.obj.rotation.y = targetRotation;
            //this.obj.rotation.y += (targetRotation-this.obj.rotation.y)/13;
        }

    };




    Character.prototype.updateGridPosition = function () {
        var that = this;

        this.oldGridPositionString = this.gridPositionString;

        this.gridPosition = {
            x: Math.floor(this.obj.position.x / this.level.positionGridSize),
            y: Math.floor(this.obj.position.z / this.level.positionGridSize)
        };
        this.gridPositionString = this.gridPosition.x + "x" + this.gridPosition.y;

        //if dead remove from grid
        if (!this.isAlive && this.level.positionGrid[this.gridPositionString]) {
            if (this.level.positionGrid[this.oldGridPositionString]) {
                delete this.level.positionGrid[this.oldGridPositionString][this.id];
            }
        }
        else {

            //remove old position
            if (this.gridPositionString != this.oldGridPositionString) {

                if (this.level.positionGrid[this.oldGridPositionString]) {
                    delete this.level.positionGrid[this.oldGridPositionString][this.id];
                }

                //create position grid if necessary
                if (this.level.positionGrid[this.gridPositionString] == null) {
                    this.level.positionGrid[this.gridPositionString] = {};
                    this.level.positionGrid[this.gridPositionString][this.id] = this;
                }
                else {
                    //add self to position grid
                    this.level.positionGrid[this.gridPositionString][this.id] = this;
                }
            }

        }
    };


    //todo how to refactor this?
    function findClosestMate(char,closeCharacters){
        var closest = null;
        var closestDistance = null;

        var perceiveClosest = function (checkedChar) {
            var distanceToCharacter = char.obj.position.distanceTo(checkedChar.obj.position);
            if (checkedChar != char && //not self
                checkedChar.stats.species == char.stats.species && (closest == null || distanceToCharacter < closestDistance)) {
                closest = checkedChar;
                closestDistance = distanceToCharacter;
            }
        };
        closeCharacters.forEach(perceiveClosest);
        return closest;
    }


    Character.prototype.findTarget = function () {
        if (this.stats.isFood) return; //todo for demo purposes. in the future check for what doesn't target
        var that = this;
        var debugObj = this.level.debugger;
        var closestFood = null;
        var closestFoodDistance = Infinity;


        var closestEnemy = null;
        var closestEnemyDistance = Infinity;

        var perceiveClosestFood = function (character) {

            var distanceToCharacter = that.obj.position.distanceTo(character.obj.position);
            //debugObj.drawArrow(that.obj.position.x,that.obj.position.y,that.obj.position.z,0xff0000);
            //debugObj.drawArrow(character.obj.position.x,character.obj.position.y,character.obj.position.z,0xff0000);
            if (character != that && //don't find yourself
                (character.stats.isFood || //todo probably don't need isfood
                (!character.stats.isEgg &&
                character.stats.species != that.stats.species &&
                character.stats.size < that.stats.size)) && (closestFood == null || distanceToCharacter < closestFoodDistance)) {

                closestFood = character;
                closestFoodDistance = distanceToCharacter;
            }

        };

        var perceiveClosestEnemy = function (character) {
            var distanceToCharacter = that.obj.position.distanceTo(character.obj.position);

            if (character != that && !character.stats.isEgg && !character.stats.isFood &&
                character.species != that.species && (closestEnemy == null || distanceToCharacter < closestEnemyDistance)) {
                closestEnemy = character;
                closestEnemyDistance = distanceToCharacter;
            }
        };

        //search in closest squares
        var closeCharacters = [];
        //if (this.level.debugMode && this.level.debugSprite==this){
        //    this.level.debugGraphic.clear();
        //}

        if (this.gridPosition) {
            for (var x = this.gridPosition.x - 1; x <= this.gridPosition.x + 1; x++) {
                for (var y = this.gridPosition.y - 1; y <= this.gridPosition.y + 1; y++) {
                    var positionString = x + "x" + y;
                    var checkedSquare = this.level.positionGrid[positionString];
                    if (checkedSquare && Object.keys(checkedSquare).length > 0) {
                        if (debugObj.active && debugObj.activeCharacter == this) {
                            debugObj.debugGrid[positionString].material = debugObj.debugHelpers.greenMaterial;
                        }
                        for (var key in checkedSquare) {
                            closeCharacters.push(checkedSquare[key]);
                        }
                    }
                    else {
                        if (debugObj.active && debugObj.activeCharacter == this && debugObj.debugGrid[x + "x" + y]) {
                            debugObj.debugGrid[positionString].material = debugObj.debugHelpers.redMaterial;
                        }
                    }
                }
            }
        }


        if (this.behavior==Character.BEHAVIORS.estrus){
            var closest=findClosestMate(this,closeCharacters);
            if (closest) this.target=closest.obj.position;
            return;
        }

        //todo refactor
        closeCharacters.forEach(perceiveClosestFood);
        closeCharacters.forEach(perceiveClosestEnemy);

        //no characters in the position grid, or not found, iterate through all characters
        if (closestFood == null) {
            //this.level.layers.boids.forEachAlive(perceiveClosestFood);
        }

        if (closestEnemy == null) {
            //this.level.layers.boids.forEachAlive(perceiveClosestEnemy);
        }
        //console.log(closestFood,closestEnemy);



        //todo refactor this giant mess
        var chaseEnemy=this.modifiedStats.isHostile && closestEnemy && closestEnemyDistance < closestFoodDistance;
        var chaseFood=closestFood && closestFoodDistance < closestEnemyDistance;
        var fleeEnemy=false; //todo implement this


        if (chaseFood){
            this.target = closestFood.obj.position;

        }
        else if (chaseEnemy){
            this.target = closestEnemy.obj.position;
        }
        else if(fleeEnemy){
            var fleeVector = this.obj.position.clone().sub(closestEnemy.obj.position);
            fleeVector.setLength(fleeVector.length() * 2);
            this.target = closestEnemy.obj.position.clone().add(fleeVector);
        }
        else{
            this.target=null;
        }

        //todo proper fix
        if (this.level.portals["mesa"] && Math.random()>0.2){
            this.target=this.level.portals["mesa"].obj.position;
        }
        else if (this.level.portals["ice"] && Math.random()>0.2){
            this.target=this.level.portals["ice"].obj.position;
        }
        else if (this.level.portals["green"] && Math.random()>0.2){
            this.target=this.level.portals["green"].obj.position;
        }


        if (this.level.debugger.active && this.level.debugger.activeCharacter == this) {
            if (this.target) {
                this.debugTarget.visible = true;
                this.debugTarget.position.copy(this.target);
            }
            else {
                this.debugTarget.visible = false;
            }
            //console.log(this.target);
        }

    };



})();