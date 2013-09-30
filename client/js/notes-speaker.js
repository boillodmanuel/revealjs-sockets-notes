var UtilSpeakerNotes = UtilSpeakerNotes || {
     // String function for number formating
    zeroPadInteger : function(num){
         var str = "00" + parseInt( num );
        return str.substring( str.length - 2 );
    }
}

/**
 * Handles opening of and synchronization with the reveal.js
 * notes window.
 */
var RevealSpeakerNotes = RevealSpeakerNotes || {
    
    conf : null, // parameters comming from conf.json (with port for WebSockets)
    Reveal : null, // The Reveal object of iframe for manipulating the api
    uiElements : {
        notes : null,
        nbSlides : -1,
        curentSlideIndex : null,
        nextSlideIndex : null,
        totalSlideIndex : null,
        options : null,
        pluginList : null,
        next : null,
        prev : null,
        left : null,
        right : null,
        up : null,
        down : null,
        show : null,
        reset : null,
        timeEl : null,
        hoursEl : null,
        minutesEl : null,
        secondsEl : null,
        progressEl : null,
        fullScreenEl : null
    },
    model : {
        defaultInterval : 2, // Time in minute of the conference
        limitAlert : 1, // time before the end where we have to alert the speaker (if defaultInterval is upper limitAlert)
        totalTime : 0, // Total time ellapsed during the presentation
        timeStart : false, // true if the time loader is on
        couldUnlock : false, // true if the client is ready for websocket control
        socket : null, // The webSocket
        indices : null, // The indices of the presentation
        fragment : 0, // The current fragment number
        localUrl : null // Var use in order to see if the presentation has already be loaded       
    },
    // WebSocket initialisation and time management initialisation
    init : function(){
         // Plug Fastclick module        
        FastClick.attach(document.body);
        
        
        // Read configuration file for getting server port
        $.getJSON('../conf/conf.json', function(data){              
            RevealSpeakerNotes.conf = data;
            
            //Init the webSocket and time management
            RevealSpeakerNotes.initSocket();
            RevealSpeakerNotes.initElements();
            RevealSpeakerNotes.timeManagement();
        }).error(function(e){
            console.log("Error during getting config file : "+e);
        });
    
    },// Init all the plugins
    initPlugins : function(){
        RevealSpeakerNotes.model.socket.emit('message', {
           type:'ping-plugin'
       }); 

        // To comment
        $(".plugin a").on("click", function(evt){
            RevealSpeakerNotes.uiElements.pluginList.hide();
            RevealSpeakerNotes.model.socket.emit('message', {
               type:'activate-plugin',
               id: evt.target.id
           }); 
        });
    },
    // Init all html elements
    initElements : function(){
        
        RevealSpeakerNotes.uiElements.notes  =  $('#content-notes' );
        RevealSpeakerNotes.uiElements.curentSlideIndex  =  $('.curent-slide');
        RevealSpeakerNotes.uiElements.nextSlideIndex  =  $('.next-slide');
        RevealSpeakerNotes.uiElements.totalSlideIndex  =  $('.nb-slides');
        RevealSpeakerNotes.uiElements.next  =  $( '#next' );
        RevealSpeakerNotes.uiElements.prev  =  $( '#prev' );
        RevealSpeakerNotes.uiElements.left  =  $( '#left' );
        RevealSpeakerNotes.uiElements.right  =  $( '#right' );
        RevealSpeakerNotes.uiElements.up  =  $( '#up' );
        RevealSpeakerNotes.uiElements.reset  =  $( '#reset' );
        RevealSpeakerNotes.uiElements.down  =  $( '#down' );
        RevealSpeakerNotes.uiElements.show  =  $( '#show' );
        RevealSpeakerNotes.uiElements.timeEl  =  $( '#time' );
        RevealSpeakerNotes.uiElements.hoursEl  =  $( '#hours' );
        RevealSpeakerNotes.uiElements.minutesEl  =  $( '#minutes' );
        RevealSpeakerNotes.uiElements.secondsEl  =  $( '#seconds' );
        RevealSpeakerNotes.uiElements.options  =  $( '#options' );
        RevealSpeakerNotes.uiElements.pluginList  =  $( '#plugin-list' );
        RevealSpeakerNotes.uiElements.progressEl  =  $( '#progress_elapsed_time' );
        RevealSpeakerNotes.uiElements.fullScreenEl  =  $( '#full-screen' );
        
         // Buttons interaction
        RevealSpeakerNotes.uiElements.next.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.next();
        });
        RevealSpeakerNotes.uiElements.prev.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.prev();
        });
        RevealSpeakerNotes.uiElements.left.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.left();
        });
        RevealSpeakerNotes.uiElements.right.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.right();
        });
        RevealSpeakerNotes.uiElements.up.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.up();
        });
        RevealSpeakerNotes.uiElements.down.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.down();
        });
        RevealSpeakerNotes.uiElements.reset.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.slide( 0, 0, 0 );
        });
        RevealSpeakerNotes.uiElements.show.on('click', function(){
            if (RevealSpeakerNotes.Reveal && !this.hasAttribute('disabled')) 
                RevealSpeakerNotes.Reveal.next();
            RevealSpeakerNotes.model.socket.emit('message', {
                type : 'operation', 
                data : 'show', 
                index: RevealSpeakerNotes.model.indices, 
                fragment : RevealSpeakerNotes.model.fragment
            });
        });
        
        // Add options management
        RevealSpeakerNotes.uiElements.options.on('click', function(){
            RevealSpeakerNotes.uiElements.pluginList.show();

        });

        // Add full screen management
        RevealSpeakerNotes.uiElements.fullScreenEl.on('click', function(){
            if (document.fullscreenElement || 
                document.webkitFullscreenElement ||
                document.mozFullscreenElement){
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }else{
                var docElm = document.getElementById("main-content");
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen();
                }
                else if (docElm.mozRequestFullScreen) {
                    docElm.mozRequestFullScreen();
                }
                else if (docElm.webkitRequestFullscreen) {
                    docElm.webkitRequestFullscreen();
                }
            }

        });

        RevealSpeakerNotes.renderProgress(0);
        
    },
    // Connect to websocket on host
    initSocket : function(){
        RevealSpeakerNotes.model.socket = io.connect('http://'+window.location.hostname+':'+RevealSpeakerNotes.conf.port);
        
        // Socket IO connect
        RevealSpeakerNotes.model.socket.on('connect',function(){
            // Send a ping message for getting config
           RevealSpeakerNotes.model.socket.emit('message', {
               type:'ping'
           }); 

           RevealSpeakerNotes.initPlugins();
        });

       
       

        // Message from presentation
        RevealSpeakerNotes.model.socket.on("message", RevealSpeakerNotes.onMessage);
    },
    // On WebSockets Messages
    onMessage : function(json){
        // Message send when recieving notes
            if (json.type === "notes"){							
                if( json.data.markdown ) {
                    RevealSpeakerNotes.uiElements.notes.html(marked( json.data.notes ));
                }
                else {
                    RevealSpeakerNotes.uiElements.notes.html(json.data.notes);
                }
            }else  // Message recieve on each change of slide
                if (json.type === "config"){	
                    // We unlock the presentation if we have a client
                    if (!RevealSpeakerNotes.model.couldUnlock){
                        $("#show").removeAttr("disabled");
                    }
                    RevealSpeakerNotes.model.couldUnlock = RevealSpeakerNotes.model.couldUnlock || true;
                    // If we have to load the speaker slide versions (recieve the url of presentation)
                    if (json.url && !RevealSpeakerNotes.model.localUrl){
                       RevealSpeakerNotes.model.localUrl = "http://"+window.location.hostname+":"+RevealSpeakerNotes.conf.port+json.url+"#speakerNotes";
                        
                       var iframe = document.getElementById("next-slide");                                              
                       iframe.src = RevealSpeakerNotes.model.localUrl;
                       iframe.onload = RevealSpeakerNotes.onIframeLoad;   
                       RevealSpeakerNotes.model.nbSlides = json.nbSlides;
                       RevealSpeakerNotes.uiElements.totalSlideIndex.html(json.nbSlides);
                    }else  // If we recieve the index of presentation
                        if (json.indices){
                            RevealSpeakerNotes.model.indices = json.indices;
                            RevealSpeakerNotes.model.fragment = 0;
                            RevealSpeakerNotes.uiElements.curentSlideIndex.html(RevealSpeakerNotes.model.indices.h+RevealSpeakerNotes.model.indices.v);       
                            RevealSpeakerNotes.uiElements.nextSlideIndex.html(RevealSpeakerNotes.model.indices.h+RevealSpeakerNotes.model.indices.v+1);    
                           
                            
                    }else // If we recieve a fragment modification
                        if (json.fragment){
                            if (json.fragment === '+1'){
                                RevealSpeakerNotes.model.fragment++;
                            }else{
                                RevealSpeakerNotes.model.fragment = Math.min(0, RevealSpeakerNotes.model.fragment++);
                            }
                    }
            }
    },
    onIframeLoad : function(){
        var iframe = document.getElementById("next-slide");     
        RevealSpeakerNotes.Reveal = iframe.contentWindow.Reveal;
        // Configuration of presentation to hide controls
        RevealSpeakerNotes.Reveal.initialize({
            controls: true,
            transition : 'default',
            transitionSpeed : 'fast'
        });
        
        // We listen to reaveal events in order to ajust the screen
        RevealSpeakerNotes.Reveal.addEventListener( 'slidechanged', RevealSpeakerNotes.revealChangeListener);
        RevealSpeakerNotes.Reveal.addEventListener( 'fragmentshown', RevealSpeakerNotes.revealFragementShowListener);
        RevealSpeakerNotes.Reveal.addEventListener( 'fragmenthidden', RevealSpeakerNotes.revealFragementHiddeListener);
        RevealSpeakerNotes.updateControls();
    },
    revealChangeListener : function(event){
         setTimeout(function(){          
             RevealSpeakerNotes.updateControls();
             RevealSpeakerNotes.model.indices = RevealSpeakerNotes.Reveal.getIndices();
             RevealSpeakerNotes.uiElements.nextSlideIndex.html(RevealSpeakerNotes.model.indices.h+RevealSpeakerNotes.model.indices.v);                
        }, 500);		
    },
    revealFragementShowListener : function(event){
         RevealSpeakerNotes.model.fragment++;
    },
    revealFragementHiddeListener : function(event){
        RevealSpeakerNotes.model.fragment = Math.min(0, RevealSpeakerNotes.model.fragment++);
    },
    // Time management
    timeManagement : function(){
        // Time Management
        var start = new Date();
        
        
        // Show / Hide methods
        $('#config_ellapsed_cancel').on('click',function(){
            $('#configEllapsed').hide();
            $('#ellapsedTime').show();
            $('#timeMenu').show();
            $('#timeTitleMenu').hide();
        });
        $('#config_ellapsed_validate').on('click',function(){
            $('#configEllapsed').hide();
            $('#ellapsedTime').show();
            $('#timeMenu').show();
            $('#timeTitleMenu').hide();
            RevealSpeakerNotes.model.defaultInterval = $('#config_interval').val();
        });
        $('#timeMenu').on('click',function(){
            $('#ellapsedTime').hide();
            $('#configEllapsed').show();
            $('#timeMenu').hide();
            $('#timeTitleMenu').show();
        });
        
        
        // Actions
        $('#action_time_play').on('click',function(){
            $('#action_time_pause').show();
            $('#action_time_play').hide();
            RevealSpeakerNotes.model.timeStart = true;
            start  = new Date();
        });
        $('#action_time_pause').on('click',function(){
            $('#action_time_pause').hide();
            $('#action_time_play').show();
            RevealSpeakerNotes.model.timeStart = false;
            RevealSpeakerNotes.model.totalTime = RevealSpeakerNotes.model.totalTime + (new Date().getTime() - start.getTime());
        });
        $('#action_time_stop').on('click',function(){
            $('#action_time_pause').hide();
            $('#action_time_play').show();
            $(".loader-spiner").removeClass("loader-spinner-alert");
            $(".loader-spiner").addClass("loader-spiner");
            RevealSpeakerNotes.model.timeStart = false;
            RevealSpeakerNotes.model.totalTime  = 0;
            RevealSpeakerNotes.renderProgress(0);
        });
        
        
        
        // Time interval for management of time
        setInterval( function() {
        
            RevealSpeakerNotes.uiElements.timeEl.css('opacity',1);
        
            var diff, 
                hours, 
                minutes, 
                seconds,
                now = new Date();
            if (RevealSpeakerNotes.model.timeStart){
                diff = now.getTime() - start.getTime();
                RevealSpeakerNotes.model.defaultInterval = RevealSpeakerNotes.model.defaultInterval > 0 ? RevealSpeakerNotes.model.defaultInterval : 60;
                var totalDiff = diff + RevealSpeakerNotes.model.totalTime;
                var alertTime = (RevealSpeakerNotes.model.defaultInterval * 60 * 1000) - (RevealSpeakerNotes.model.limitAlert * 60 * 1000);
                hours = parseInt( totalDiff / ( 1000 * 60 * 60 ) );
                minutes = parseInt( ( totalDiff / ( 1000 * 60 ) ) % 60 );
                seconds = parseInt( ( totalDiff / 1000 ) % 60 );
            
                RevealSpeakerNotes.uiElements.hoursEl.html(UtilSpeakerNotes.zeroPadInteger( hours ));
                if (hours > 0 && RevealSpeakerNotes.uiElements.hoursEl.hasClass("mute"))
                    RevealSpeakerNotes.uiElements.hoursEl.removeClass("mute");
                else if(!RevealSpeakerNotes.uiElements.hoursEl.hasClass("mute"))
                    RevealSpeakerNotes.uiElements.hoursEl.addClass("mute");                
                
                RevealSpeakerNotes.uiElements.minutesEl.html(":" + UtilSpeakerNotes.zeroPadInteger( minutes ));
                if (minutes > 0 && RevealSpeakerNotes.uiElements.minutesEl.hasClass("mute"))
                    RevealSpeakerNotes.uiElements.minutesEl.removeClass("mute");
                else if(!RevealSpeakerNotes.uiElements.minutesEl.hasClass("mute"))
                    RevealSpeakerNotes.uiElements.minutesEl.addClass("mute");
                
                RevealSpeakerNotes.uiElements.secondsEl.html(":" + UtilSpeakerNotes.zeroPadInteger( seconds ));
                
                var diffPercent = (totalDiff / (RevealSpeakerNotes.model.defaultInterval * 60 * 1000)) * 100;                
                RevealSpeakerNotes.renderProgress(Math.min(diffPercent, 100));
                
                
                if (totalDiff > RevealSpeakerNotes.model.alertTime && !$(".loader-spiner").hasClass("loader-spinner-alert")){
                    $(".loader-spiner").addClass("loader-spinner-alert");
                    $(".loader-spiner").removeClass("loader-spiner");
                }
            }
        }, 1000 );
    },
    updateControls : function(){
        // We update the buttons
        var controls = RevealSpeakerNotes.getControls();
        if (controls.right) 
            RevealSpeakerNotes.uiElements.right.removeAttr("disabled"); 
        else 
            RevealSpeakerNotes.uiElements.right.attr("disabled", true); 
        
        if (controls.left) 
            RevealSpeakerNotes.uiElements.left.removeAttr("disabled"); 
        else 
            RevealSpeakerNotes.uiElements.left.attr("disabled", true); 
        
        if (controls.up) 
            RevealSpeakerNotes.uiElements.up.removeAttr("disabled"); 
        else 
            RevealSpeakerNotes.uiElements.up.attr("disabled", true); 
        
        if (controls.down) 
            RevealSpeakerNotes.uiElements.down.removeAttr("disabled"); 
        else 
            RevealSpeakerNotes.uiElements.down.attr("disabled", true); 
        
        if (RevealSpeakerNotes.model.indices.h+RevealSpeakerNotes.model.indices.v+1 > RevealSpeakerNotes.model.nbSlides)
            RevealSpeakerNotes.uiElements.next.attr("disabled", true);
        else
            RevealSpeakerNotes.uiElements.next.removeAttr("disabled");
        
        if (RevealSpeakerNotes.model.indices.h+RevealSpeakerNotes.model.indices.v <= 0)
            RevealSpeakerNotes.uiElements.prev.attr("disabled", true);
        else
            RevealSpeakerNotes.uiElements.prev.removeAttr("disabled");
            
        
    },// Get the curent controls 
    getControls : function(){
        var controls = document.querySelector('iframe').contentDocument.querySelector('.controls');
        var upControl = false,
            downControl = false,
            leftControl = false,
            rightControl = false;                
        if (controls){
            controls.style.display = "none";
            upControl = controls.querySelector("div.navigate-up.enabled") ? true : false;
            downControl = controls.querySelector("div.navigate-down.enabled") ? true : false;
            leftControl = controls.querySelector("div.navigate-left.enabled") ? true : false;
            rightControl = controls.querySelector("div.navigate-right.enabled") ? true : false;
        }
        return {
            up : upControl,
            down : downControl,
            left : leftControl,
            right : rightControl
        }
    },
    renderProgress : function(progress){
        progress = Math.floor(progress);
        RevealSpeakerNotes.uiElements.progressEl.css("width", progress+"%");
        var alertClass = RevealSpeakerNotes.uiElements.progressEl.hasClass("alert");
        var advancedClass = RevealSpeakerNotes.uiElements.progressEl.hasClass("advanced");
        if (progress < 75 && (alertClass || advancedClass)){
            RevealSpeakerNotes.uiElements.progressEl.removeClass("alert");
            RevealSpeakerNotes.uiElements.progressEl.removeClass("advanced");
        }else if(progress >= 75 && progress < 90 && !advancedClass){
            RevealSpeakerNotes.uiElements.progressEl.addClass("advanced");
            RevealSpeakerNotes.uiElements.progressEl.removeClass("alert");
        }else if(progress >= 90 && !alertClass){
            RevealSpeakerNotes.uiElements.progressEl.addClass("alert");
            RevealSpeakerNotes.uiElements.progressEl.removeClass("advanced");
        }
        /*if(progress<25){
            var angle = -90 + (progress/100)*360;
            $(".animate-0-25-b").css("transform","rotate("+angle+"deg)");
            $(".animate-25-50-b").css("transform","rotate(-90deg)");
            $(".animate-50-75-b").css("transform","rotate(-90deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=25 && progress<50){
            var angle = -90 + ((progress-25)/100)*360;
            $(".animate-0-25-b").css("transform","rotate(0deg)");
            $(".animate-25-50-b").css("transform","rotate("+angle+"deg)");
            $(".animate-50-75-b").css("transform","rotate(-90deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=50 && progress<75){
            var angle = -90 + ((progress-50)/100)*360;
            $(".animate-25-50-b, .animate-0-25-b").css("transform","rotate(0deg)");
            $(".animate-50-75-b").css("transform","rotate("+angle+"deg)");
            $(".animate-75-100-b").css("transform","rotate(-90deg)");
        }
        else if(progress>=75 && progress<=100){
            var angle = -90 + ((progress-75)/100)*360;
            $(".animate-50-75-b, .animate-25-50-b, .animate-0-25-b")
                                                  .css("transform","rotate(0deg)");
            $(".animate-75-100-b").css("transform","rotate("+angle+"deg)");
        }*/
    }    
};


$(function() {    
    // TODO manage navigator with incompatible proerties
    RevealSpeakerNotes.init();    
});