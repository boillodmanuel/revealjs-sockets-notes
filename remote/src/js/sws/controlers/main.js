sws.controller('SwsCtrl',        
    ['$rootScope', '$scope', '$http', 
    function($rootScope, $scope, $http) {


       

                
        FastClick.attach(document.body);

        $http({
        	url: '../conf/conf.json',
        	method: 'GET'
        }).success(function(data, status, headers, config){              
            $scope.model.conf = data;
            console.log('Return from http !');
            //Init the webSocket and time management
            $scope.connect();
            // Load markdown reveal js
            $.getScript('http://'+window.location.hostname+':'+data.port+data.revealPath+'/plugin/markdown/marked.js', function(){
                console.log("Script markdown loaded and executed.");
            // Here you can use anything you defined in the loaded script
            });
        }).error(function(e){
            console.log("Error during getting config file : "+e);
        });


      $scope.hidePlugin = function(){
          for (var pluginIndex =0; pluginIndex < $scope.model.pluginList.length; pluginIndex++){
            var plugin = $scope.model.pluginList[pluginIndex];            
            if ($scope[plugin.id + 'Close']){
              $scope[plugin.id + 'Close']();
            }
          }
        }

      	

                
}]);