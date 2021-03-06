(function () {

    var UiController = function (level) {
        this.level = level;
        this.game = this.level.game;
        this.raycaster = new THREE.Raycaster();
        this.init();

        this.panDistance=0.2;

        this.mode = Tykoon.UiController.MODES.IDLE;
        this.isPanning = {};

        this.characterMenu = document.querySelector("#characterMenu");
    };

    //TODO carryover bug?
    //UiController.prototype.constructor = Tykoon.Debugger;

    UiController.MODES = {
        IDLE: "idle",
        SELECTCHARACTER: "select character"
    };

    UiController.prototype.init = function () {
        var that = this;
        var level = this.level;
        this.mousePosRel = new THREE.Vector2(); //mouse position in percent relative to the canvas
        this.mousePosAbs = new THREE.Vector2(); //mouse position in pixels relative to the page
        this.keysDown = {};


        //this.element = $(this.game.assetCache["mainUi"])[0];
        //document.body.appendChild(this.element);
        //
        //this.creatureToolTip = $(this.game.assetCache["creatureTooltip"])[0];
        //document.body.appendChild(this.creatureToolTip);
        //
        //var buttons=this.element.querySelectorAll(".button");
        //for(var x=0;x<buttons.length;x++){
        //
        //    var button=buttons[x];
        //    button.addEventListener('mouseenter',function(event){
        //        var bg = event.target.querySelector("polygon");
        //
        //        TweenMax.to(bg,0.3,{
        //            fill: "#729faf",
        //            ease: Power2.easeOut
        //        });
        //
        //    });
        //
        //    button.addEventListener('click',function(event){
        //
        //
        //        TweenMax.to(event.target,0.3,{
        //            fill: "#729faf",
        //            ease: Power2.easeOut,
        //            delay: 0.2
        //        });
        //
        //    });
        //
        //    button.addEventListener('mouseleave',function(event){
        //        var bg = event.target.querySelector("polygon");
        //
        //        TweenMax.to(event.target,0.3,{
        //            scale:1,
        //            transformOrigin:"50% 50%",
        //            ease: Power2.easeOut
        //        });
        //
        //        TweenMax.to(bg,0.3,{
        //            fill: "rgba(79, 79, 84, 0.6)",
        //            ease: Power2.easeOut
        //        });
        //
        //    });
        //}
        //
        //this.element.querySelector(".placePortal").addEventListener('click', function (event) {
        //    that.mode = Tykoon.UiController.MODES.PLACEPORTAL;
        //});
        //

        document.querySelector(".option1").addEventListener("mousedown",action);
        document.querySelector(".option2").addEventListener("mousedown",action);
        document.querySelector(".option3").addEventListener("mousedown",action);

        function action(e){

            level.dispatchEvent({
                type: "ui.selectCharacterOption"
            });
            that.characterMenu.classList.remove("active");
            e.preventDefault();
        }

        document.addEventListener('keydown', function (event) {
            that.keysDown[event.keyCode] = true;

            if (event.keyCode == 90) {
                level.currentCameraIndex++;
                if (level.currentCameraIndex >= level.cameras.length) {
                    level.currentCameraIndex = 0;
                }
                level.currentCamera = level.cameras[level.currentCameraIndex];
            }

            if (event.keyCode == 32) {
                //if(that.currentCamera==that.chaseCamera){
                //    that.currentCamera=that.trackballCamera;
                //}
                //else{
                //    that.currentCamera=that.chaseCamera;
                //}
                //that.initPostProcessing();
                level.isPaused = !level.isPaused;
            }
        });

        document.addEventListener('keyup', function (event) {
            that.keysDown[event.keyCode] = false;
        });
        document.addEventListener('mousedown', function (ev) {
            that.mousePosAbs.x=event.clientX;
            that.mousePosAbs.y=event.clientY;
            that.mousePosRel.down = true;
            //var terrainPos=that.level.terrain.getPosition(that.terrainPoint.x,that.terrainPoint.z);
            //var xDot=terrainPos.normal.dot(new THREE.Vector3(1,0,0));
            //var zDot=terrainPos.normal.dot(new THREE.Vector3(0,0,1));
            //var isSteep=Math.abs(xDot)>0.5 || Math.abs(zDot)>0.5;
            //that.level.debugger.drawArrow(
            //    terrainPos.triangleCenter.x,
            //    -2000,
            //    terrainPos.triangleCenter.z,null,true);
            if (ev.which == 1) {
                //check for site intersection
                var intersects = that.raycaster.intersectObjects(level.sites, true);
                if (intersects.length > 0) {
                    var obj = intersects[0].object;
                    level.dispatchEvent({
                        type: "ui.clickOnSite",
                        site: obj
                    });
                }
                else {
                    that.characterMenu.classList.remove("active");

                    if (that.characterOnHover) {
                        level.dispatchEvent({
                            type: "ui.clickOnCharacter",
                            character: that.characterOnHover
                        });
                    }
                    else if (that.terrainPoint) {
                        level.dispatchEvent({
                            type: "ui.clickOnTerrain",
                            terrainPoint: that.terrainPoint
                        });
                    }
                }



            }
        });

        document.addEventListener('mouseup', function (event) {
            that.mousePosRel.down = false;
        });

        document.addEventListener('mousemove', function (event) {
            that.mousePosRel.x = ( event.clientX / level.renderer.domElement.width ) * 2 - 1;
            that.mousePosRel.y = -( event.clientY / level.renderer.domElement.height ) * 2 + 1;
            that.mousePosAbs.x=event.clientX;
            that.mousePosAbs.y=event.clientY;

            //panning
            that.isPanning.left=that.mousePosRel.x<that.panDistance-1;
            that.isPanning.right=that.mousePosRel.x>1-that.panDistance;
            that.isPanning.up=that.mousePosRel.y>1-that.panDistance;
            that.isPanning.down=that.mousePosRel.y<that.panDistance-1;

            if (that.level.isPresentation) {
                var camera = level.currentCamera;
                var cameraPosition = new THREE.Vector3();
                cameraPosition.setFromMatrixPosition(camera.matrixWorld); // world position
                that.raycaster.ray.origin.copy(cameraPosition);
                that.raycaster.ray.direction.set(that.mousePosRel.x, that.mousePosRel.y, 0.5).unproject(camera).sub(cameraPosition).normalize();
            }
            else{
                that.raycaster.setFromCamera(that.mousePosRel, level.currentCamera);
            }

            if (level.island) {
                // See if the ray from the camera into the world hits one of our meshes
                var intersects = that.raycaster.intersectObjects(level.island.children);
                // Toggle rotation bool for meshes that we clicked
                that.terrainPoint = intersects.length > 0 ? intersects[0].point : null;
            }
            else{
                that.terrainPoint=null;
            }

            //check for character intersection
            intersects = that.raycaster.intersectObjects(level.characterArray, true);
            if (intersects.length > 0) {
                var obj = intersects[0].object;
                while (!obj.character) {
                    obj = obj.parent
                }

                if (that.characterOnHover != obj.character){
                    that.characterOnHover = obj.character;
                    that.showCreatureTooltip(that.characterOnHover);
                }
            }
            else {
                if (that.characterOnHover != null) {
                    that.characterOnHover = null;
                    that.hideCreatureTooltip();
                }
            }

            if (that.characterOnHover) {
                that.updateCreatureTooltip();
            }

            level.dispatchEvent({
                type: "ui.mouseMove",
                terrainPoint: that.terrainPoint
            });

        });

    };

    UiController.prototype.showActioMenu = function(){
        this.characterMenu.style.left=this.mousePosAbs.x;
        this.characterMenu.style.top=this.mousePosAbs.y;
        this.characterMenu.classList.add("active");
    };


    UiController.prototype.update = function () {
        if (this.characterOnHover) {
            var c=this.characterOnHover;


            //if (c.currentEstrusCycleStartTime!==null && c.currentEstrusCycleStartTime!==undefined){
            //    var estrusPercent=Math.round( (this.level.timer.currentTime - c.currentEstrusCycleStartTime) % c.modifiedStats.estrusCycleLength / c.modifiedStats.estrusCycleLength * 100);
            //    var seconds=Math.round( (c.modifiedStats.estrusCycleLength -  (this.level.timer.currentTime - c.currentEstrusCycleStartTime) % c.modifiedStats.estrusCycleLength) / 60);
            //    this.creatureToolTip.querySelector(".estrusBar").classList.add("inEstrus"); //todo probably inefficient
            //}
            //else{
            //    this.creatureToolTip.querySelector(".estrusBar").classList.remove("inEstrus"); //todo probably inefficient
            //    var estrusTimeEvent=this.characterOnHover.timeHandlers["estrusCycle"];
            //    var estrusPercent=Math.round( ((estrusTimeEvent.timer.currentTime-estrusTimeEvent.startOffset) % estrusTimeEvent.time) / estrusTimeEvent.time * 100);
            //    var seconds=Math.round( (estrusTimeEvent.time - ((estrusTimeEvent.timer.currentTime-estrusTimeEvent.startOffset) % estrusTimeEvent.time)) / 60);
            //}
            //this.creatureToolTip.querySelector(".estrusBar .value").innerText=seconds;
            //this.creatureToolTip.querySelector(".estrusBar .bar").style.width = "{0}%".format(estrusPercent);

        }
    };


    UiController.prototype.showCreatureTooltip = function (character) {
        showElement(this.creatureToolTip);
    };

    UiController.prototype.updateCreatureTooltip = function () {
        //this.creatureToolTip.style.left=this.mousePosAbs.x;
        //this.creatureToolTip.style.top=this.mousePosAbs.y;
    };

    UiController.prototype.hideCreatureTooltip = function () {
        hideElement(this.creatureToolTip);
    };

    Tykoon.UiController = UiController;

    function showElement(el) {
        //el.style.opacity = 1;
    }

    function hideElement(el) {
        //el.style.opacity = 0;
    }
})();