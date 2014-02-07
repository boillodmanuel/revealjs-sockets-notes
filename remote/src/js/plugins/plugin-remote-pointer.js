/*
* Remote pointer plugin
*/
plugins.directive('rpPlugin', ['$rootScope'
  ,function ($rootScope) {
   var directiveDefinitionObject = {
    restrict: 'A',
    priority : 102,
    scope: false,    
    link: function postLink($scope, iElement, iAttrs) { 

      $scope.register({
        name : 'remote pointer',
        icon : 'fa-pencil',
        id : 'rp'
      });

      var previewElement = iElement.find('#preview');
      var areaPointer = null;
      var currentColor = 'red';

      function touchFeedback(event){
        if (event.gesture && event.gesture.center){
          // We get the position of finger on page, and we have to calculate it's position on preview area
          var x = event.gesture.center.pageX,
              y = event.gesture.center.pageY,
              rect = previewElement[0].getClientRects()[0];

          var percentX = ((x-rect.left) / rect.width) * 100;
          var percentY = ((y-rect.top) / rect.height) * 100;
          //console.log((event.gesture.center.pageX / previewElement.width())+ '|'+ Math.round(event.gesture.center.pageX / previewElement.width()));
          $scope.pluginCommunication('rp', {
            hide : false,
            x : Math.round(percentX),
            y : Math.round(percentY),
            color : currentColor
          });
        }
      }

      function boxClicked(event){
        if (event.target.id === 'sws-rp-box-close'){
          $(areaPointer).hammer().off('drag', touchFeedback);
          areaPointer.style.display = 'none';
        }else{
          currentColor = event.target.getAttribute('sws-color');
          areaPointer.style.border = 'solid '+currentColor+' 5px';
        }
        console.log(event);
      }


      $scope.rpClick = function(){

        if (!areaPointer){
          areaPointer = document.createElement('DIV');
          areaPointer.style.position = 'absolute';
          areaPointer.style.width = previewElement.width()+'px';
          areaPointer.style.height = previewElement.height()+'px';
          areaPointer.style.top = previewElement.position().top+'px';
          areaPointer.style.left = previewElement.position().left+'px';
          areaPointer.style['margin'] = previewElement.css('margin');
          areaPointer.style['background-color'] = 'rgba(0,0,0,0)';
          areaPointer.style.border = 'solid red 5px';

          iElement.find('#main-content')[0].appendChild(areaPointer);

          // We add color div to change the color of pointer
          function addBox(id, color, icon, left){
            var boxDiv = document.createElement('DIV');
            boxDiv.setAttribute('id', 'sws-rp-box-'+id);
            boxDiv.setAttribute('sws-color', color);
            boxDiv.style.position = 'absolute';
            boxDiv.style.width = '40px';
            boxDiv.style.height = '40px';
            boxDiv.style.top = '-45px';
            boxDiv.style.left = left;
            boxDiv.style.color = color;
            boxDiv.style['text-align'] = 'center';
            boxDiv.style['font-size'] = '30px';
            boxDiv.style['line-height'] = '40px';
            boxDiv.style['background-color'] = 'lightgray';
            boxDiv.style[Modernizr.prefixed('boxShadow')] = '1px 1px 2px 0 #656565';
            boxDiv.classList.add('fa');
            boxDiv.classList.add(icon);
            return boxDiv;
          }

          areaPointer.appendChild(addBox('red', 'red', 'fa-circle','0'));
          areaPointer.appendChild(addBox('white', 'white', 'fa-circle','50px'));
          areaPointer.appendChild(addBox('black', 'black', 'fa-circle','100px'));
          areaPointer.appendChild(addBox('blue', 'blue', 'fa-circle','150px'));
          areaPointer.appendChild(addBox('close', 'black', 'fa-times','calc(100% - 50px)'));

          iElement.find('#sws-rp-box-red').bind('click', boxClicked);
          iElement.find('#sws-rp-box-white').bind('click', boxClicked);
          iElement.find('#sws-rp-box-black').bind('click', boxClicked);
          iElement.find('#sws-rp-box-blue').bind('click', boxClicked);
          iElement.find('#sws-rp-box-close').bind('click', boxClicked);
        }
        
        areaPointer.style.display = '';
        

        $(areaPointer).hammer().off('drag', touchFeedback);
        $(areaPointer).hammer().on('drag', touchFeedback);

      }
    }
  };
  return directiveDefinitionObject;
}]);