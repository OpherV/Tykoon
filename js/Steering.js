(function(){
    //wander
    var CIRCLE_DISTANCE=500;
    var CIRCLE_RADIUS=300;
    var WANDER_CHANGE=0.4;
    //drift
    var stopDistance = 100;
    //avoid steep
    var MAX_SEE_AHEAD=250;
    var MAX_AVOID_FORCE=2.5;


    var steering=function(char){
        this.char=char;

        this.steering = new THREE.Vector2();
        this.velocity = new THREE.Vector2(0,0);
        this.pos = new THREE.Vector2();
        this.finalVelocity = new THREE.Vector3();
    };
    steering.prototype.constructor=steering;

    steering.prototype.destroy=function(){
        this.steering=null;
        this.pos=null;
        this.velocity=null;
        this.finalVelocity=null;
    };


    steering.STEERINGTYPES = {
        idle: "idle",
        chase: "chase",
        drift: "drift",
        wander: "wander"
    };


    steering.prototype.setupSteering=function() {
        this.steering.set(0,0);
        this.pos.set(this.char.obj.position.x, this.char.obj.position.z)
    };

    steering.prototype.finalize=function() {
        //set the character speed
        this.steering.setLength(this.char.modifiedStats.rotateSpeed);
        this.velocity.add(this.steering).setLength(this.char.modifiedStats.speed);
        this.finalVelocity.set(this.velocity.x, 0, this.velocity.y);
    };

    steering.prototype.drift=function(){
        var level=this.char.level;
        //stop away from wall
        //todo nicer gradual function

        //if (Math.abs(level.dimensions / 2 - this.pos.x) < stopDistance ||
        //    Math.abs(level.dimensions / 2 + this.pos.x) < stopDistance ||
        //    Math.abs(level.dimensions / 2 + this.pos.y) < stopDistance ||
        //    Math.abs(level.dimensions / 2 - this.pos.y) < stopDistance
        //) {
        //    this.velocity.set(0, 0);
        //    this.char.steeringType = steering.STEERINGTYPES.idle;
        //}
    };


    steering.prototype.wander=function(){
        this.setupSteering();
        if (!this.wanderVars){
            this.wanderVars={
                circleCenter: new THREE.Vector2(),
                displacement: new THREE.Vector2(),
                wanderForce: new THREE.Vector2(),
                wanderAngle: 0
            }
        }
        var w=this.wanderVars;

        w.circleCenter.copy(this.velocity).setLength(CIRCLE_DISTANCE);
        w.displacement.set(0,1).setLength(CIRCLE_RADIUS);

        // Randomly change the vector direction
        // by making it change its current angle
        var len  = w.displacement.length();
        w.displacement.x = Math.cos(w.wanderAngle) * len;
        w.displacement.y = Math.sin(w.wanderAngle) * len;
        //
        // Change wanderAngle just a bit, so it
        // won't have the same value in the
        // next game frame.
        w.wanderAngle += (Math.random() * WANDER_CHANGE) - (WANDER_CHANGE * .5);
        w.wanderForce.copy(w.circleCenter).add(w.displacement);

        //debug
        //if (!this.wanderArrow){
        //    this.wanderArrow=new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(0,300,0), wanderForce.length(), 0xFFFF00);
        //    this.obj.add(this.wanderArrow);
        //
        //    this.velocityArrowHelper=new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(0,300,0), wanderForce.length(), 0xFF00FF);
        //    this.obj.add(this.velocityArrowHelper);
        //
        //    this.steeringArrow=new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(circleCenter.x,300,circleCenter.y), wanderForce.length(), 0x00FFFF);
        //    this.obj.add(this.steeringArrow);
        //
        //    var material = new THREE.MeshBasicMaterial({
        //        color: 0x0000ff,
        //        side: THREE.DoubleSide
        //    });
        //
        //    var radius = CIRCLE_RADIUS;
        //    var segments = 32;
        //
        //    var circleGeometry = new THREE.CircleGeometry( radius, segments );
        //    var circle = new THREE.Mesh( circleGeometry, material );
        //    circle.position.set(circleCenter.x,299,circleCenter.y);
        //    circle.rotation.x=Math.PI/2;
        //    this.obj.add( circle );
        //}
        //else{
        //    this.wanderArrow.setDirection(new THREE.Vector3(wanderForce.x, 0, wanderForce.y));
        //    this.wanderArrow.setLength(displacement.length());
        //
        //    this.steeringArrow.setDirection(new THREE.Vector3(wanderForce.x, 0, wanderForce.y));
        //    this.steeringArrow.setLength(CIRCLE_RADIUS);
        //
        //    this.velocityArrowHelper.setDirection(new THREE.Vector3(this.velocity.x, 0, this.velocity.y));
        //    this.velocityArrowHelper.setLength(1000);
        //}

        this.steering.copy(w.wanderForce);
    };


    steering.prototype.chase=function(){
        this.setupSteering();
        if (!this.chaseVars){
            this.chaseVars={
                desiredVelocity: new THREE.Vector2(),
                targetPos: new THREE.Vector2()
            }
        }
        var w=this.chaseVars;

        w.targetPos.set(this.char.target.x,this.char.target.z);
        w.desiredVelocity.copy(w.targetPos).sub(this.pos);

        this.steering.copy(w.desiredVelocity).sub(this.velocity);
    };

    //modifiers
    //these get called only after a main steering behaviour has been called

    steering.prototype.avoidBounds=function(){
        if (!this.avoidBoundsVars){
            this.avoidBoundsVars={
                avoidRightBound: new THREE.Vector2(),
                avoidLeftBound: new THREE.Vector2(),
                avoidTopBound: new THREE.Vector2(),
                avoidBottomBound: new THREE.Vector2()
            }
        }
        var w=this.avoidBoundsVars;

        //steer away from wall
        w.avoidRightBound.set(-1, 0).setLength(boundsAvoidance(this.char.level.dimensions / 2 - this.pos.x));
        w.avoidLeftBound.set(1, 0).setLength(boundsAvoidance(this.char.level.dimensions / 2 + this.pos.x));
        w.avoidTopBound.set(0, 1).setLength(boundsAvoidance(this.char.level.dimensions / 2 + this.pos.y));
        w.avoidBottomBound.set(0, -1).setLength(boundsAvoidance(this.char.level.dimensions / 2 - this.pos.y));

        this.velocity.add(w.avoidRightBound);
        this.velocity.add(w.avoidLeftBound);
        this.velocity.add(w.avoidTopBound);
        this.velocity.add(w.avoidBottomBound);

    };

    steering.prototype.avoidSteep=function(){
        if (!this.avoidSteepVars){
            this.avoidSteepVars={
                ahead: new THREE.Vector2(),
                avoidance: new THREE.Vector2()
            }
        }
        var w=this.avoidSteepVars;

        w.ahead.copy(this.velocity).setLength(MAX_SEE_AHEAD).add(this.pos);

        var terrainPos=this.char.level.terrain.getPosition(w.ahead.x,w.ahead.y);
        var xDot=terrainPos.normal.dot(new THREE.Vector3(1,0,0));
        var zDot=terrainPos.normal.dot(new THREE.Vector3(0,1,0)); //normal is XZ-Y
        var isSteep=Math.abs(xDot)>0.5 || Math.abs(zDot)>0.5;
        var inWater = this.char.level.terrain.options.hasWater && terrainPos.height<this.char.level.terrain.options.waterLevel;
        if (isSteep || inWater){
                w.avoidance.x = w.ahead.x - terrainPos.triangleCenter.x;
                w.avoidance.y = w.ahead.y - terrainPos.triangleCenter.z;
                w.avoidance.setLength(MAX_AVOID_FORCE);
        }
        else{
            w.avoidance.multiplyScalar(0.9);
        }

        this.velocity.add(w.avoidance);

        //debug
        //if (!this.aheadArrow){
        //    this.aheadArrow=new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(0,300,0), MAX_SEE_AHEAD, 0xFFFF00);
        //    this.char.level.scene.add(this.aheadArrow);
        //
        //    this.steepArrow=new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 1000, 0xFF00FF);
        //    this.char.level.scene.add(this.steepArrow);
        //}
        //else{
        //    this.aheadArrow.position.copy(this.char.obj.position);
        //    this.aheadArrow.position.y=this.char.obj.y+100;
        //    this.aheadArrow.setDirection(new THREE.Vector3(w.ahead.x-this.pos.x, 0, w.ahead.y-this.pos.y));
        //    this.aheadArrow.setLength(MAX_SEE_AHEAD);
        //
        //    if (isSteep) {
        //        this.steepArrow.position.x = terrainPos.triangleCenter.x;
        //        this.steepArrow.position.z = terrainPos.triangleCenter.z;
        //    }
        //}
    };


    var lineIntersectsCircle = function (ahead, ahead2, obstacleCenter, obstacleRadius  ){
        return obstacleCenter.distance(ahead) <= obstacleRadius || obstacleCenter.distance(ahead2) <= obstacleRadius;
    };

    var boundsAvoidance = function (t) {
        t *= 0.05;
        return 1 / (t * t + 0.05);
    };

    Tykoon.Steering=steering;
})();