Tykoon=(window.Tykoon?window.Tykoon:{});

Tykoon.Timer=function() {
    this.currentTime=0;
    this.isActive=false;

    this.events={};
};

Tykoon.Timer.prototype.constructor = Tykoon.Timer;

Tykoon.Timer.prototype.play=function(){
    this.isActive=true;
};

Tykoon.Timer.prototype.tick=function(){
    var event,eventId;

    if (this.isActive) {
        this.currentTime++;

        for (eventId in this.events){
            event = this.events[eventId];
            if (event){

                if (event.type=="repeat"){
                    if ((this.currentTime-event.startOffset) % event.time == 0){
                        event.callback.apply(event.thisContext,event.args);
                    }
                }
                if(event.type=="single"){
                    if ((this.currentTime-event.startOffset) % event.time == 0) {
                        event.callback.apply(event.thisContext,event.args);
                        event.destroy();
                    }
                }

            }

        }
    }
};

Tykoon.Timer.prototype.destroyEvent=function(eventId){
    delete this.events[eventId];
};

Tykoon.Timer.prototype.loop=function(time,callback){
    var timerEvent = new Tykoon.TimerEvent(this,
        Tykoon.TimerEvent.TYPES.repeat,
        time,
        callback
    );

    this.events[timerEvent.id]=timerEvent;

    return timerEvent;
};

Tykoon.Timer.prototype.add=function(time,callback,thisContext,args){
    var timerEvent = new Tykoon.TimerEvent(this,
        Tykoon.TimerEvent.TYPES.single,
        time,
        callback,
        thisContext,
        args
    );

    this.events[timerEvent.id]=timerEvent;
    return timerEvent;
};


Tykoon.Timer.prototype.destroy=function(id){
    delete this.events[id];
}

//todo implement timer delete all events


//timer event
Tykoon.TimerEvent = function(timer,type,time,callback,thisContext,args){
    this.id=Tykoon.Utils.generateGuid("timer");
    this.timer=timer;
    this.type=type;
    this.time=time;
    this.callback=callback;
    this.startOffset=timer.currentTime;
    this.thisContext=thisContext;
    this.args=args;

    this.destroy=function(){
        this.timer.destroy(this.id);
    }
};

Tykoon.TimerEvent.TYPES={
    repeat: "repeat",
    single: "single"
};

Tykoon.TimerEvent.prototype.constructor = Tykoon.TimerEvent;
