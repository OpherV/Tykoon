
(function() {


    var UnderbotCharacter = Tykoon.UnderbotCharacter = function(level, id){
        this.id = id;
        this.level = level;
        this.animations = {};

        Tykoon.Character.prototype.init.call(this);
    };

    UnderbotCharacter.prototype = Object.create(Tykoon.Character.prototype);
    UnderbotCharacter.prototype.constructor = UnderbotCharacter;

    UnderbotCharacter.prototype.renderBody = function () {
        var that = this;


        var creatureObj = this.creatureObj =  this.level.game.assetCache["underbotModel"].clone();
        creatureObj.scale.set(0.2,0.2,0.2);
        creatureObj.rotation.y = -Math.PI/2;
        creatureObj.position.y = 73;

        var material = new THREE.MeshPhongMaterial( {
            map: this.level.game.assetCache["underbotUV"]
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