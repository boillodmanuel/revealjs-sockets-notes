components.directive('timer', ['$rootScope', '$interval'
  ,function ($rootScope, $interval) {
   var directiveDefinitionObject = {
    templateUrl: 'partials/components/timer.html',
    replace: true,
    restrict: 'E',
    scope: true,    
    link: function postLink($scope, iElement, iAttrs) { 

      $scope.showPlay = true;
      $scope.showTime = true;
      $scope.hours = "00";
      $scope.minutes = "00";
      $scope.seconds = "00";
      $scope.classHours = "mute";
      $scope.classMinutes = "mute";
      $scope.interval = 60;

      var progressEl = iElement.find('div.elapsed_bg');

      $scope.toggleTime = function(){
        $scope.showTime = !$scope.showTime;
      }

      $scope.play = function(){
        $scope.showPlay = false;
        start  = new Date();
        $scope.model.timeStart = true;
      }

      $scope.pause = function(){
        $scope.showPlay = true;
        $scope.model.timeStart = false;
        $scope.model.totalTime = $scope.model.totalTime + (new Date().getTime() - start.getTime());
      }

      $scope.stop = function(){
        $scope.showPlay = true;
        $scope.model.timeStart = false;
        $scope.model.totalTime  = 0;
        renderProgress(0);
        $scope.hours = "00";
        $scope.minutes = "00";
        $scope.seconds = "00";
        $scope.classHours = "mute";
        $scope.classMinutes = "mute";
      }

      $scope.validate = function(){
        $scope.toggleTime();
        $scope.model.defaultInterval = $scope.interval;
      }

      // Time Management
      var start = new Date();
        
      function renderProgress(progress){
        progress = Math.floor(progress);
        progressEl.css("width", progress+"%");
        var alertClass = progressEl.hasClass("alert");
        var advancedClass = progressEl.hasClass("advanced");
        if (progress < 75 && (alertClass || advancedClass)){
            progressEl.removeClass("alert");
            progressEl.removeClass("advanced");
        }else if(progress >= 75 && progress < 90 && !advancedClass){
            progressEl.addClass("advanced");
            progressEl.removeClass("alert");
        }else if(progress >= 90 && !alertClass){
            progressEl.addClass("alert");
            progressEl.removeClass("advanced");
        }
      }

      function zeroPadInteger(num){
        var str = "00" + parseInt( num );
        return str.substring( str.length - 2 );
      }
      
      // Time interval for management of time
      $interval( function() {
      
          var diff, 
              hours, 
              minutes, 
              seconds;                
          if ($scope.model.timeStart){
              var now = new Date();
              diff = now.getTime() - start.getTime();
              $scope.model.defaultInterval = $scope.model.defaultInterval > 0 ? $scope.model.defaultInterval : 60;
              var totalDiff = diff + $scope.model.totalTime;
              var alertTime = ($scope.model.defaultInterval * 60 * 1000) - ($scope.model.limitAlert * 60 * 1000);
              hours = parseInt( totalDiff / ( 1000 * 60 * 60 ) );
              minutes = parseInt( ( totalDiff / ( 1000 * 60 ) ) % 60 );
              seconds = parseInt( ( totalDiff / 1000 ) % 60 );
          
              $scope.hours = zeroPadInteger( hours );
              if (hours > 0 && $scope.classHours === 'mute')
                  $scope.classHours = '';
              else if(hours === 0 && $scope.classHours != 'mute')
                  $scope.classHours = 'mute';
              
              $scope.minutes = zeroPadInteger( minutes );
              if (minutes > 0 && $scope.classMinutes === 'mute')
                  $scope.classMinutes = '';
              else if(minutes === 0 && $scope.classMinutes != 'mute')
                  $scope.classMinutes = 'mute';
              
              $scope.seconds = zeroPadInteger( seconds );
              
              var diffPercent = (totalDiff / ($scope.model.defaultInterval * 60 * 1000)) * 100;                
              renderProgress(Math.min(diffPercent, 100));
              
          }
      }, 1000 );
      
      renderProgress(0);

    }
  };
  return directiveDefinitionObject;
}]);