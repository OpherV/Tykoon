
(function() {


    var CatCharacter = Tykoon.CatCharacter = function(level, id){
        this.id = id;
        this.level = level;
        this.animations = {};

        Tykoon.Character.prototype.init.call(this);
        this.modifiedStats.speed = 3;
        this.modifiedStats.rotateSpeed = 2;
    };

    CatCharacter.prototype = Object.create(Tykoon.Character.prototype);
    CatCharacter.prototype.constructor = CatCharacter;

    CatCharacter.prototype.renderBody = function () {
        var that = this;


        var creatureObj = this.creatureObj =  this.level.game.assetCache["catModel"].clone();
        creatureObj.scale.set(0.1,0.1,0.1);
        creatureObj.rotation.y = Math.PI/2;
        creatureObj.position.y = 24;

        var material = new THREE.MeshPhongMaterial( {
            map: this.level.game.assetCache["catUV"]
        } );

        creatureObj.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                var geometry = child.geometry;

                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                child.material = material;
                child.castShadow = true;
            }
        } );

        //var hex  = 0xff0000;
        //var bbox = new THREE.BoundingBoxHelper( creatureObj, hex );
        //bbox.update();
        //this.level.scene.add( bbox );

        that.obj.add(creatureObj);
    };

})();