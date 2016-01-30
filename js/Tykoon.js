Tykoon=(window.Tykoon?window.Tykoon:{});

Tykoon.Game=function () {
    var eventDispatcher = new THREE.EventDispatcher();
    eventDispatcher.apply(this);
    this.init();
};

Tykoon.Game.prototype.constructor = Tykoon.Game;


Tykoon.Game.prototype.init=function(){
    var that=this;

    //TODO preperation for level loading
    this.loadObjects(function(){
        that.setupMaterials();
        that.currentLevel = new Tykoon.Level(that);
        that.dispatchEvent({type: "afterInit"});
    });



    //TODO preperation for stats
    //this.stats = new Stats();
    //this.stats.domElement.style.position = 'absolute';
    //this.stats.domElement.style.left = '0px';
    //this.stats.domElement.style.top = '0px';
    //document.body.appendChild( this.stats.domElement );

};

Tykoon.Game.prototype.loadObjects=function(callback){
    var that=this;
    this.assetCache={};


    var assetList=[
        ['json','tykoonCharacter','assets/models/tykoonCharacter.json'],
        ['texture','tykoonUV','assets/uv/tykoonUV.jpg'],
        ['texture','islandUV','assets/uv/islandUV.jpg'],
        ['texture','underbotUV','assets/uv/HankUnderbot_TEx.jpg'],
        ['obj','islandModel','assets/models/island.obj'],
        ['obj','underbotModel','assets/models/hank_NoAnim.obj'],
        ['obj','volcanoModel','assets/models/volcano.obj']
    ];

    var manager = new THREE.LoadingManager();
    var jsonLoader = this.jsonLoader = new THREE.JSONLoader();
    var objLoader = new THREE.OBJLoader( manager );


    var loaderPromises=[];


    for (var x=0;x<assetList.length;x++){
        (function() {
            var asset = assetList[x];
            switch (asset[0]) {
                case "json":
                    var jsonDeferred = new $.Deferred();
                    jsonLoader.load( asset[2], function( geometry, materials ) {
                        that.assetCache[asset[1]] = {
                            geometry: geometry,
                            materials: materials
                        };
                        Tykoon.Utils.assignUVs(geometry);
                        jsonDeferred.resolve();
                    } );
                    loaderPromises.push(jsonDeferred.promise());
                    break;
                case "texture":
                    var jsonDeferred = new $.Deferred();
                    THREE.ImageUtils.loadTexture(asset[2],undefined,function(texture){
                        if (asset[3]) { //wrapping texture
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            texture.repeat.set(0.008, 0.008);
                        }
                        that.assetCache[asset[1]]=texture;
                        jsonDeferred.resolve();

                    });
                    loaderPromises.push(jsonDeferred.promise());
                    break;
                case "shader":
                    var shaderdDeferred = $.ajax({
                        url: asset[2],
                        dataType: 'text',
                        complete: function (jqXHR, textStatus) {
                            that.assetCache[asset[1]] = jqXHR.responseText;
                        }
                    });
                    loaderPromises.push(shaderdDeferred);
                    break;
                case "template":
                    var templateDeferred = $.ajax({
                        url: asset[2],
                        dataType: 'text',
                        complete: function (jqXHR, textStatus) {
                            that.assetCache[asset[1]] = jqXHR.responseText;
                        }
                    });
                    loaderPromises.push(templateDeferred);
                    break;
                case "image":
                    var imageDeferred = new $.Deferred();
                    var img = new Image();
                    img.onload = function () {
                        imageDeferred.resolve();
                        that.assetCache[asset[1]]=img;
                    };
                    img.src = asset[2];
                    loaderPromises.push(imageDeferred);
                    break;
                case "obj":
                    var imageDeferred = new $.Deferred();
                    objLoader.load(asset[2], function ( object ) {
                        that.assetCache[asset[1]]=object;
                        loaderPromises.push(imageDeferred);

                    }, function(){}, function(){} );
                    break;
            }
        })()
    }

    Promise.all(loaderPromises).then(function(){
        callback();
    });

};

Tykoon.Game.prototype.setupMaterials=function(){
    this.materialCache={};

    this.materialCache.characterSkinInvisibleMaterial=new THREE.MeshPhongMaterial( {
            //ambient: 0x44B8ED,
            color: 0xFF0000,
            //emissive: 0x44B8ED,
            side: THREE.DoubleSide,
            visible: false,
            shading: THREE.FlatShading,
            skinning: true
        } );

    this.materialCache.characterSkinMaterial=new THREE.MeshPhongMaterial( {
        //ambient: 0x44B8ED,
        //color: 0x87327D,
        //emissive: 0x44B8ED,
        side: THREE.DoubleSide,
        shading: THREE.FlatShading
    } );


    this.materialCache.characterEyeMaterial=new THREE.MeshPhongMaterial( {
        //ambient: 0x44B8ED,
        color: 0xF4FF1C,
        emissive: 0xF4FF1C,
        side: THREE.DoubleSide,
        shading: THREE.FlatShading
    } );

    this.materialCache.foodMaterial=new THREE.MeshLambertMaterial( {
        //ambient: 0x44B8ED,
        color: 0x999999,
        //emissive: 0xF4FF1C,
        //side: THREE.DoubleSide,
        shading: THREE.FlatShading
    } );



};

Tykoon.init=function(){
    return new Tykoon.Game();
};