
(function() {


    var TykoonCharacter = Tykoon.TykoonCharacter = function(level, id){
        this.id = id;
        this.level = level;
        this.animations = {};

        Tykoon.Character.prototype.init.call(this);
    };

    TykoonCharacter.prototype = Object.create(Tykoon.Character.prototype);
    TykoonCharacter.TykoonCharacter.prototype.constructor = TykoonCharacter;

    TykoonCharacter.prototype.renderBody = function () {
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

})();