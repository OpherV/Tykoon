
(function() {


    var Character = function (level, id, dna) {
        this.id = id;
        this.level = level;
        this.animations = {};

        this.replicationPauseTime = 60 * 10;

        Character.prototype.init.call(this, dna);
    };
    Tykoon.Character = Character;
    Character.prototype.constructor = Character;


    Character.BEHAVIORS = {
        normal: "normal",
        eating: "eating",
        estrus: "estrus"
    };


    Character.prototype.init = function (dna) {
        var that = this;
        this.bindMethods();

        var extend = Tykoon.Utils.extend;

        var eventDispatcher = new THREE.EventDispatcher();
        eventDispatcher.apply(this);

        this.timeHandlers = {};

        this.isAlive = true;
        this.behavior=Character.BEHAVIORS.normal;

        this.dna = dna;
        this.species=Tykoon.Dna.getHash(dna);


        setupTraits.call(this);

        if (!this.stats.isFood) {
            //this.timeHandlers["estrusCycle"] = this.level.timer.loop(this.stats.estrusCycleFrequency, this.startEstrusCycle.bind(this, this.stats.estrusCycleLength));
            //todo in the future this might be affected by radius
            this.proximityTests = {
                eatProximityTest: this.level.addProximityTest(this, function (target, distance, proximityTest) {
                    //that.breed(target);
                    that.doEat(target);
                    //proximityTest.destroy();
                })
            };


            //debug
            //this.startEstrusCycle(this.stats.estrusCycleLength);

            //debug
            //this.steeringType=Tykoon.Steering.STEERINGTYPES.wander;
            //this.steeringType=Tykoon.Steering.STEERINGTYPES.drift;
        }


        //3d representation
        this.obj = new THREE.Object3D();
        this.obj.character = this;
        this.obj.position = new THREE.Vector3();

        this.renderBody();

        //change physical properties according to stats
        updateStatModifiers.call(this);

        this.modifiedStats.energy = Math.round(this.modifiedStats.maxEnergy*0.75);
        this.modifiedStats.life = this.modifiedStats.maxLife;

        this.velocity = new THREE.Vector2(1, 0).setLength(this.modifiedStats.speed);
        this.setSize(this.modifiedStats.size);

        if (this.stats.isFood) {
            this.steeringType = Tykoon.Steering.STEERINGTYPES.idle;
        }
        else {
            this.steeringType = Tykoon.Steering.STEERINGTYPES.chase;
            this.setupEmitters();
        }



        if (this.level.debugger.active) {
            this.debugObj = new THREE.Object3D();
            this.obj.add(this.debugObj);
            var cubeMaterial = new THREE.MeshBasicMaterial({wireframe: true});
            this.debugCube = new THREE.Mesh(new THREE.CubeGeometry(100, 100, 100), cubeMaterial);
            this.debugCube.visible = false;
            this.debugObj.add(this.debugCube);

            this.debugTarget = this.level.debugger.drawArrow();
            this.debugTarget.visible = false;
        }

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

    Character.prototype.foodGeometry = new THREE.SphereGeometry(30, 3, 3);
    Character.prototype.eggSphereGeometry = new THREE.SphereGeometry(30, 8, 8);


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
        if (this.creatureObj) {
            this.obj.remove(this.creatureObj);
            //this.material.dispose();
            //todo check why this crashes - avoid memory leaks
        }
        if (this.stats.isEgg) {
            var geometry = this.eggSphereGeometry;
            this.futureCreatureObj = Tykoon.CreatureComposer.compose(this.dna);

            var creatureObj = this.creatureObj = new THREE.Mesh(geometry, this.futureCreatureObj.skinMaterial);
            creatureObj.scale.set(0.1,0.1,0.1);
            TweenMax.to(creatureObj.scale,8,{
                x: 2,
                y: 3.5,
                z: 2,
                ease: Power4.easeOut
                //delay: delay
            });

            creatureObj.position.y+=20;
            creatureObj.castShadow = true;
            geometry.computeFaceNormals();
            that.obj.add(creatureObj);
        }
        else if (this.stats.isFood) {
            var geometry = this.foodGeometry;
            var creatureObj = that.creatureObj = new THREE.Mesh(geometry, that.level.game.materialCache.foodMaterial);
            creatureObj.rotation.x=Math.random()*Math.PI;
            creatureObj.rotation.y=Math.random()*Math.PI;
            creatureObj.rotation.z=Math.random()*Math.PI;
            creatureObj.castShadow = true;
            geometry.computeFaceNormals();
            that.obj.add(creatureObj);
        }
        else {
            if (this.futureCreatureObj){
                this.creatureObj=this.futureCreatureObj;
                this.futureCreatureObj=null;
            }
            else{
                this.creatureObj = Tykoon.CreatureComposer.compose(this.dna);
            }
            this.obj.add(this.creatureObj);
        }

    };

    Character.prototype.runStep = function (timestamp, lastTimestamp) {
        if (this.modifiedStats.speed>0 && this.behavior==Character.BEHAVIORS.normal) {
            this.steer();
        }
        this.updateGridPosition();

        //todo not performant
        var terrainPosition = this.level.terrain.getPosition(this.obj.position.x, this.obj.position.z);
        var yPos = terrainPosition.height;
        this.obj.position.y = yPos + this.level.terrain.obj.position.y + 7;

        //hexapods hog the ground
        if (this.traits.Hexapod) {
            //gradual change
            var normalClone=terrainPosition.normal.clone();
            var oldY=this.obj.rotation.y;
            var oldRotation=new THREE.Vector3(this.obj.rotation.x,0,this.obj.rotation.z);
            this.obj.lookAt(normalClone.add(this.obj.position));
            var newRotation=new THREE.Vector3(this.obj.rotation.x,0,this.obj.rotation.z);

            var lerp=oldRotation.add( newRotation.sub(oldRotation).setLength(0.02) );
            this.obj.rotation.set(lerp.x,oldY,lerp.z);

            lerp=null;
            normalClone=null;
            oldY=null;
            newRotation=null;
            oldRotation=null;
        }


        //var downVector=new THREE.Vector3(0,-1,0); //TODO might be problematic with performance
        //var raycasterVector=new THREE.Vector3(this.obj.position.x,this.obj.position.y+100,this.obj.position.z);
        //this.level.raycaster.set( raycasterVector, downVector);
        //var intersects = this.level.raycaster.intersectObject(this.level.terrain.terrainMesh);
        //if ( intersects.length > 0 ) {
        //    this.obj.position.copy( intersects[ 0 ].point );
        //    this.obj.translateY(7);
        //}

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
    Character.prototype.startEstrusCycle= function (cycleLength) {
        this.currentEstrusCycleStartTime=this.level.timer.currentTime;
        this.timeHandlers["estrusCycleEnd"]=this.level.timer.add(cycleLength, this.endEstrusCycle.bind(this));
        this.breedingParticleEmitter.enable();
        this.behavior=Character.BEHAVIORS.estrus;
        this.findTarget();
    };

    Character.prototype.endEstrusCycle= function () {
        this.breedingParticleEmitter.disable();
        this.currentEstrusCycleStartTime=null;
        this.behavior=Character.BEHAVIORS.normal;
        this.findTarget();
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
        this.steering.avoidBounds();
        if (!this.traits.Hexapod) {
            this.steering.avoidSteep();
        }

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


    Character.prototype.setSize = function (size) {
        var scale = Math.sqrt(size);
        this.obj.scale.set(scale, scale, scale);
    };

//todo separate die and destroy
    Character.prototype.die = function () {

        this.dispatchEvent({type: "beforeDie"});
        this.isAlive = false;

        //todo why this?
        //this.obj.traverse(function (object) {
        //    object.visible = false;
        //});


        //dispose of geometries and materials
        if (this.creatureObj.skinMaterial) {
            this.creatureObj.skinMaterial.dispose();
        }

        disposeTraits(this);

        //todo destroy animation as well

        this.level.cullCharacter(this);
        for (var key in this.proximityTests) {
            this.proximityTests[key].destroy();
        }
        for (var key in this.timeHandlers) {
            this.timeHandlers[key].destroy();
            delete this.timeHandlers[key];
        }
    };

    Character.prototype.startDeathAnimation = function(){
        this.isAlive = false;
        if (this.stats.isFood){

            TweenMax.to(this.creatureObj.scale,0.3,{
                x: 0.1,
                y: 0.1,
                z: 0.1,
                //ease: Bounce.easeOut,
                //delay: delay
                onComplete: this.die
            });

            return;
        }

        this.steeringType=Tykoon.Steering.STEERINGTYPES.idle;

        if (this.creatureObj.startDeathAnimation){
            this.creatureObj.startDeathAnimation(this.die.bind(this));
        }
    };

    Character.prototype.replicate = function (){
        this.modifiedStats.energy=this.modifiedStats.energy*0.5; //replicating costs half of the current energy costs
        var newCharacterDna;
        //mutation chance
        if (Math.random()>0.9) {
            newCharacterDna = Tykoon.Dna.mutate(this.dna);
        }
        else{
            newCharacterDna = Tykoon.Dna.clone(this.dna);
        }

        //todo hack - find out why this is missing in the first place
        if (!newCharacterDna.stats){
            newCharacterDna.stats={}
        }

        newCharacterDna.stats.isEgg=true;
        var newCharacter = new Character(this.level, Tykoon.Utils.generateGuid(), newCharacterDna);

        newCharacter.obj.position.set(this.obj.position.x, 0, this.obj.position.z);
        if (this.modifiedStats.isMitosis){
            var randomAngle=Math.random()*Math.PI*2;
            var radius=Math.random()*400+500;
            newCharacter.obj.position.x+=Math.cos(randomAngle)*radius;
            newCharacter.obj.position.z+=Math.sin(randomAngle)*radius;
        }
        newCharacter.startEggTimer();

        this.level.addCharacter(newCharacter);
        this.level.scene.add(newCharacter.obj);
    };

    Character.prototype.breed = function (target){
        if (!this.stats.isEgg &&  !target.stats.isEgg &&
        this.behavior==Character.BEHAVIORS.estrus && target.modifiedStats.species==this.modifiedStats.species){
            this.endEstrusCycle();
            //reset target as well if applicable
            if (target.behavior==Character.BEHAVIORS.estrus){
                target.endEstrusCycle();
            }

            var newCharacterDna=Tykoon.Utils.clone(this.dna); //todo combine dna
            newCharacterDna.stats.isEgg=true;
            var newCharacter = new Character(this.level, Tykoon.Utils.generateGuid(), newCharacterDna);
            newCharacter.obj.position.set(this.obj.position.x, 0, this.obj.position.z);
            newCharacter.startEggTimer();

            this.level.addCharacter(newCharacter);
            this.level.scene.add(newCharacter.obj);

        }
    };



    Character.prototype.doEat = function (target) {
        if (!target.isAlive || !this.isAlive || this.stats.isEgg) { return; }

        if (target.stats.isFood && !this.stats.isFood){
            this.creatureObj.pauseAll();
            if (this.creatureObj.headMesh){
                //todo INEFFICIENT
                var t1=TweenMax.to(this.creatureObj.headMesh.position,0.3,{
                    y: "-30",
                    //ease: Bounce.easeOut,
                    //delay: delay
                    onComplete: function(){
                        target.startDeathAnimation();
                        t1.reverse();
                        t1=null;
                    }
                });
                var t2=TweenMax.to(this.creatureObj.headMesh.rotation,0.3,{
                    z: "-0.5",
                    //ease: Bounce.easeOut,
                    //delay: delay
                    onComplete: function(){
                        t2.reverse();
                        t2=null;
                    }
                });
            }
            this.adjustEnergy(15);
            this.behavior=Character.BEHAVIORS.eating;
            this.level.timer.add(60,this.doneEating,this);
        }
    };

    Character.prototype.doneEating = function () {
        if (this.isAlive) {
            this.behavior = Character.BEHAVIORS.normal;
            if(this.creatureObj.animations.animation) {
                this.creatureObj.animations.animation.play(this.creatureObj.animations.animation.currentTime);
            }
            this.findTarget();
        }
    };

    Character.prototype.doEatOld = function (target) {
        //another boid might have already eaten this in the same collision state
        if (!target.isAlive) {
            return;
        }


        //eat target boid
        if (
            (target.stats.isFood && !this.stats.isFood && !this.stats.isEgg) ||
            !this.stats.isEgg && !target.stats.isEgg && this.stats.species != target.stats.species && this.stats.size > target.stats.size) {
            this.setSize(this.stats.size + target.stats.size);
            this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + target.stats.size * 7);

            var newCharacterStats = Tykoon.Utils.clone(this.stats);
            newCharacterStats.isEgg = true;

            target.die();
            this.target = null;

            while (this.stats.size > this.stats.maximalSize) {
                this.setSize(this.stats.size - this.stats.minimalSize);

                if (false && Math.random() < mutationChance) {
                    var newMin = newCharacterStats.minimalSize;
                    var newDelta = newCharacterStats.maximalSize - newCharacterStats.minimalSize;

                    newMin = newMin + Math.max(1, Math.random() > 0.5 ? 1 : -1);
                    newDelta = newDelta + Math.max(1, Math.random() > 0.5 ? 1 : -1);
                    newCharacterStats.minimalSize = newMin;
                    newCharacterStats.maximalSize = newMin + newDelta;
                    newCharacterStats.colorHSLA[0] = (newCharacterStats.colorHSLA[0] + (Math.random() > 0.5 ? 40 : -40)) % 359;
                    newCharacterStats.maxSpeed = Math.max(0, newCharacterStats.maxSpeed + (Math.random() > 0.5 ? 1 : -1));
                    newCharacterStats.species = this.level.getNewSpecies();

                }

                //creature new minicreature
                newCharacterStats.size = this.stats.minimalSize;
                var newCharacter = new Character(this.level, Tykoon.Utils.generateGuid(), newCharacterStats);
                newCharacter.obj.position.set(this.obj.position.x, 0, this.obj.position.z);
                this.level.addCharacter(newCharacter);
                this.level.scene.add(newCharacter.obj);

                newCharacter.steeringType = Tykoon.Steering.STEERINGTYPES.idle;
                newCharacter.startEggTimer();
            }

            this.findTarget();
        }
    };

    Character.prototype.startEggTimer = function () {
        var that = this;
        this.steeringType=Tykoon.Steering.STEERINGTYPES.idle;

        var _time = 60 * 8;
        var rotateVariation=0.2;
        TweenMax.to(that.creatureObj.rotation, 8, {
            x: Math.random()*rotateVariation-rotateVariation*2,
            z: Math.random()*rotateVariation-rotateVariation*2,
            ease:RoughEase.ease.config({
                template: Circ.easeIn,
                strength:10,
                points:25,
                taper:"in",
                clamp: true
            })
        });

        //todo add this to proper timevents
        this.level.timer.add(_time, function () {
            that.stats.isEgg = false;
            that.renderBody();
            TweenMax.fromTo(that.obj.scale, 1, {x: 0.1, y:0.1, z:0.1}, {x: 1, y:1, z:1, ease: Elastic.easeOut.config(2, 1)});
            that.steeringType = Tykoon.Steering.STEERINGTYPES.chase;
        });
    };


    Character.prototype.takeDamage = function(amount) {
        if (!this.isAlive) return;

        this.modifiedStats.life=Math.max(0,this.modifiedStats.life-amount);
        if (this.modifiedStats.life==0){
            this.naturalDeath();
        }
        else{
            //show damage animation
            var emissive=this.creatureObj.skinMaterial.emissive;
            TweenMax.set(emissive,{
                r: 0.4,
                g: 0,
                b: 0
            });
            TweenMax.to(emissive,0.5,{
                r: 0,
                g: 0,
                b: 0
            });
        }
    };

    Character.prototype.adjustEnergy = function(amount) {
        this.modifiedStats.energy+=amount;

        if (this.modifiedStats.energy>=this.modifiedStats.maxEnergy){
            this.modifiedStats.energy=this.modifiedStats.maxEnergy;
            //console.log(this.level.characterArray.length);
            if (this.level.characterArray.length<this.level.maxCharacters &&
                this.modifiedStats.canReplicate) {
                this.modifiedStats.canReplicate=false;
                this.timeHandlers["replicationPause"]=this.level.timer.add(this.replicationPauseTime, this.replicationPause);
                this.replicate();
            }
        }

        else if (this.modifiedStats.energy<0){
            this.modifiedStats.energy=0;
            this.takeDamage(5);
        }
    };

    Character.prototype.replicationPause= function () {
        this.modifiedStats.canReplicate=true;
    };

    Character.prototype.naturalDeath = function () {
        if (this.stats.isFood) {

        }
        else {
            var newCharacterDna = {stats:{}, traits:[]};
            newCharacterDna.stats.isFood = true;
            for (var x = 0; x < 5; x++) {
                var newCharacter = new Character(this.level, Tykoon.Utils.generateGuid(), newCharacterDna);
                newCharacter.modifiedStats.speed=0.5;
                newCharacter.obj.position.set(this.obj.position.x, this.obj.position.y, this.obj.position.z);
                this.level.addCharacter(newCharacter);
                this.level.scene.add(newCharacter.obj);

                //newCharacter.isTweening=true;
                TweenMax.to(newCharacter.obj.position,0.3, {
                    x: Math.random()*500+this.obj.position.x,
                    z: Math.random()*500+this.obj.position.z,
                    //onComplete: function(){
                    //    newCharacter.isTweening=false;
                    //},
                    ease: Power2.easeOut
                    //delay: delay
                });


                //newCharacter.steeringType = Tykoon.Steering.STEERINGTYPES.drift;
                //
                //var randomDirection = Math.random() * Math.PI;
                //newCharacter.velocity = new THREE.Vector2(Math.cos(randomDirection), Math.sin(randomDirection)).setLength(1);

            }
        }
        this.startDeathAnimation();
    };

    //private functions
    function setupTraits(){
        var extend = Tykoon.Utils.extend;

        var defaultStats = {
            maxEnergy: 100,
            maxLife: 100,
            size: 1,
            speed: 0,
            rotateSpeed: 0,
            estrusCycleFrequency: 60*40,
            estrusCycleLength: 60*10, //length must be shorted than frequency
            colorHSLA: [0, 69, 55, 1],
            canReplicate: true,
            isFood: false
        };

        this.traits={};
        for(var x=0;x<this.dna.traits.length;x++){
            var traitName=this.dna.traits[x];
            this.traits[traitName]=Tykoon.Traits[traitName];
        }

        this.stats = extend.call({}, defaultStats);
        this.stats = extend.call(this.stats, this.dna.stats);
        this.modifiedStats = extend.call({}, this.stats);
    }

    //todo make fucntional
    function updateStatModifiers(){
        var that=this;

        //take trait stat modification into account
        for (var traitName in this.traits){
            var traitStatModifiers=this.traits[traitName].statModifiers;
            if (traitStatModifiers) {
                for (var statName in traitStatModifiers){
                    var statValue=traitStatModifiers[statName];

                    if (statName=="energy"){
                        this.timeHandlers[traitName+"_energy"]=this.level.timer.loop(statValue.rate, that.adjustEnergy.bind(this,statValue.delta));
                    }
                    else if (statName=="onInit"){
                        //run init function
                        statValue(that);
                    }
                    else if (Tykoon.Utils.isNumeric(statValue)){
                        this.modifiedStats[statName]+=statValue;
                    }
                    else if (statValue===false || statValue===true){
                        this.modifiedStats[statName]=statValue;
                    }
                    else if (typeof statValue =="object"){
                        //this.level.timer.loop(statValue.rate, statValue.callback);
                        //function (statName,delta) {
                        //    this.modifiedStats[statName]=Math.max(0,this.modifiedStats[statName]+delta);
                        //}.bind(this,statName,statValue.delta)

                    }
                    else if(typeof statValue =="string" && statValue.charAt(0)=="="){
                        this.modifiedStats[statName]=parseFloat(statValue.substring(1,statValue.length));
                    }


                }
            }
        }
    }

    function disposeTraits(char){
        for (var traitName in char.traits){
            var traitStatModifiers=char.traits[traitName].statModifiers;
            if (traitStatModifiers && traitStatModifiers.onDestroy) {
                traitStatModifiers.onDestroy(char.creatureObj);

            }
        }
    }

})();