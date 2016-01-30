Tykoon=(window.Tykoon?window.Tykoon:{});
Tykoon.Utils= (function(){

    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined'
                    ? args[number]
                    : match
                    ;
            });
        };
    }


    function _clone(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            var copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            var copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = _clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = _clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    function _extend(obj) {
        var clone=_clone(this);
        for(var i in obj){
            clone[i] = obj[i];
        }
        return clone;
    }

    function _generateGuid(prefix){
        prefix=prefix?prefix+"_":"";
        var S4 = function() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (prefix+S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    //taken from
    // http://stackoverflow.com/questions/22360936/will-three-js-object3d-clone-create-a-deep-copy-of-the-geometry
    THREE.Object3D.prototype.GdeepCloneMaterials = function() {
        var object = this.clone( new THREE.Object3D(), false );

        for ( var i = 0; i < this.children.length; i++ ) {

            var child = this.children[ i ];
            if ( child.GdeepCloneMaterials ) {
                object.add( child.GdeepCloneMaterials() );
            } else {
                object.add( child.clone() );
            }

        }
        return object;
    };

    THREE.Mesh.prototype.GdeepCloneMaterials = function( object, recursive ) {
        if ( object === undefined ) {
            object = new THREE.Mesh( this.geometry, this.material.clone() );
        }

        THREE.Object3D.prototype.GdeepCloneMaterials.call( this, object, recursive );

        return object;
    };

    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 99], [0,359] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  l       The lightness
     * @return  Array           The RGB representation
     */
    function hslToRgb(h, s, l){
        var r, g, b;
        h/=359;
        s/=99;
        l/=99;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }


    var _assignUVs = function(geometry) {

        geometry.faceVertexUvs[0] = [];

        geometry.faces.forEach(function(face) {

            var components = ['x', 'y', 'z'].sort(function(a, b) {
                return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
            });

            var v1 = geometry.vertices[face.a];
            var v2 = geometry.vertices[face.b];
            var v3 = geometry.vertices[face.c];

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(v1[components[0]], v1[components[1]]),
                new THREE.Vector2(v2[components[0]], v2[components[1]]),
                new THREE.Vector2(v3[components[0]], v3[components[1]])
            ]);

        });

        geometry.uvsNeedUpdate = true;
    };


    function _regularPolygonPoints(sideCount,radius){
        var sweep=Math.PI*2/sideCount;
        var cx=0;
        var cy=0;
        var points=[];
        var outString="";
        for(var i=0;i<sideCount;i++){
            var x=cx+radius*Math.cos(i*sweep);
            var y=cy+radius*Math.sin(i*sweep);
            points.push({x:x, y:y});
            outString+=" {0},{1}".format(x.toFixed(1), y.toFixed(1));
        }return(outString);
    }

    function _hollowHexagonPoints(radius,width){
        var hex1=_regularPolygonPoints(6,radius);
        var hex2=_regularPolygonPoints(6,radius-width);
        var points=[];
        for (var x=0;x<hex1.length;x++){
            points.push(hex1[x]);
        }
        points.push(hex1[0]);
        points.push(hex2[0]);
        for (x=hex2.length-1;x>=0;x--){
            points.push(hex2[x]);
        }

        var outString="";
        for (x=0;x<points.length;x++){
            outString+=" {0},{1}".format(points[x].x,points[x].y);
        }
        return outString;
    }

    function _setPositionFromTranform(el){
        var xforms = el.getAttribute('transform');
        var parts  = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(xforms);
        var xPos = parts[1],  yPos = parts[2];
        TweenMax.set(el,{
            x: xPos,
            y: yPos
        })
    }

    function _drawSvgLine(path,options){
        var defaultOpts={
            strokeLength: 5,
            delay: "0s",
            speed: "2s",
            marchingAnts: true
        };

        path.style.display="block";
        var options=_extend.call(defaultOpts,options);
        var length = path.getTotalLength();
        // Clear any previous transition
            path.style.transition = path.style.WebkitTransition =
            'none';
        // Set up the starting positions
        var offsetString="";
        var strokeLength=options.strokeLength;
        for(var x=0;x<length/(strokeLength*2);x++){
            offsetString=offsetString+"{0} {0} ".format(strokeLength,strokeLength);
        }
        offsetString+=" 0 "+length;
        path.style.strokeDasharray = offsetString;
        path.style.strokeDashoffset = length;
        // Trigger a layout so styles are calculated & the browser
        // picks up the starting position before animating
        path.getBoundingClientRect();
        //callback for after transition end


        _one(path,"transitionend",function(){
            path.style.transition = path.style.WebkitTransition = '';
            path.style.strokeDasharray=options.strokeLength;
            if (options.marchingAnts){
                path.classList.add("marchingAnts");
            }
            if (options.callback){
                options.callback.call(path);
            }
        });


        // Define our transition
        path.style.transition = path.style.WebkitTransition =
            'stroke-dashoffset {0} ease-in {1}'.format(options.speed,options.delay);
        // Go!
        path.style.strokeDashoffset = '0';
    }

    var _one=function(object,event,callback){
        var cbWrapper=function(){
            object.removeEventListener(event,cbWrapper, false );
            callback.apply(this,arguments);
        };
        object.addEventListener(event,cbWrapper,false);
    };

    function _shuffle(array) {
        array = array.slice(0);
        var tmp, current, top = array.length;

        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }

        return array;
    }

    function _isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _getUrlVars() {
        var query_string = {};
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
        return query_string;
    }

    String.prototype.hashCode = function() {
        var hash = 0, i, chr, len;
        if (this.length == 0) return hash;
        for (i = 0, len = this.length; i < len; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    Function.prototype.inheritsFrom = function( parentClassOrObject ){
        if ( parentClassOrObject.constructor == Function )
        {
            //Normal Inheritance
            this.prototype = new parentClassOrObject;
            this.prototype.constructor = this;
            this.prototype.parent = parentClassOrObject.prototype;
        }
        else
        {
            //Pure Virtual Inheritance
            this.prototype = parentClassOrObject;
            this.prototype.constructor = this;
            this.prototype.parent = parentClassOrObject;
        }
        return this;
    }

    return{
        extend: _extend,
        clone: _clone,
        generateGuid: _generateGuid,
        hslToRgb: hslToRgb,
        assignUVs: _assignUVs,
        regularPolygonPoints: _regularPolygonPoints,
        hollowHexagonPoints: _hollowHexagonPoints,
        setPositionFromTranform: _setPositionFromTranform,
        drawSvgLine: _drawSvgLine,
        one: _one,
        shuffle: _shuffle,
        isNumeric: _isNumeric,
        getUrlVars: _getUrlVars
    }

})();
