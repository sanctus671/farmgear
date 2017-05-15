angular.module('app.controllers', [])


.controller('LoginController', function($scope, AuthService) {
    $scope.user = {email:"", password:""};
    
    $scope.login = function(){
        AuthService.login($scope.user).then(function(){
            
        })
    }
})

.controller('RegisterController', function($scope) {

})

.controller('ForgotPasswordController', function($scope) {

})


.controller('AppController', function($scope, $ionicModal, $timeout) {

})



.controller('CategoryController', function($scope, $stateParams) {
})

.controller('OrderController', function($scope) {

})
