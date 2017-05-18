angular.module('app.controllers', [])


.controller('LoginController', function($scope, AuthService, $state) {
    $scope.user = {email:"", password:""};
    $scope.errors = [];
    
    $scope.login = function(){
        AuthService.login($scope.user).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.errors = [];
            $state.go("app.about");
        },function(data){
            console.log(data);
            if (data.error && data.error.errors){
                $scope.errors = data.error.errors;
            }
            else{
                $scope.errors = [["Invalid email or password."]];
            }
        });
    }
})

.controller('RegisterController', function($scope, AuthService) {
    $scope.user = {email:"", name:"", phone:"", password:"", repeat_password:""};
    $scope.registered = false;
    $scope.errors = [];
    
    $scope.register = function(){
        if ($scope.user.password !== $scope.user.repeat_password){
            $scope.errors = [["Passwords must match."]];
            return;
        }
        AuthService.register($scope.user).then(function(data){
            console.log(data);
            $scope.user = {email:"", name:"", phone:"", password:"", repeat_password:""};
            $scope.errors = [];
            $scope.registered = true;
            
        },function(data){
            console.log(data);
            if (data.error && data.error.errors){
                $scope.errors = data.error.errors;
            }
            else{
                $scope.errors = [["Invalid registration."]];
            }
        })
    }
    
})

.controller('ForgotPasswordController', function($scope, AuthService, $state) {
    $scope.user = {email:""};
    
    $scope.resetPassword = function(){
        AuthService.recoverPassword($scope.user.email).then(function(){
            $state.go("login");
        })
    }
    
    
})


.controller('AppController', function($scope, $timeout, $ionicModal, $timeout, MainService, $rootScope) {
    $scope.categories = [];
    
    $rootScope.order = {order_items:[]};
    
    $scope.getCategories = function(){
        MainService.getCategories().then(function(data){
            $scope.categories = data;
            $scope.$broadcast("categoriesLoaded");
        })
    }
    
    $scope.getCategories();
})

.controller('HomeController', function($scope, $timeout) {
    $timeout(function(){
        $scope.categories = $scope.$parent.categories;        
    })
    
    $scope.$parent.$on("categoriesLoaded",function(){
        $scope.categories = $scope.$parent.categories;      
    })    
    
    
})

.controller('AboutController', function($scope) {
})

.controller('CategoryController', function($scope, $stateParams, MainService, $timeout, $ionicModal, $rootScope) {
    $scope.category = {};
    $scope.products = [];
    $scope.categories = [];
    
    $scope.selectedProduct = {};
    
    $scope.currentIndex = 999;
    
    $scope.getProducts = function(){
        MainService.getProducts($scope.category.id).then(function(data){
          $scope.products = data; 
          for (var index in $scope.products){
              if ($scope.products[index].gallery){
                  $scope.products[index].gallery = JSON.parse($scope.products[index].gallery);
              }
          }
          console.log(data);
        })
    }
    
    $scope.getCategory = function(){
        console.log($scope.$parent.categories);
        for (var index in $scope.$parent.categories){
            if (parseInt($scope.$parent.categories[index].id) === parseInt($stateParams.id)){
                $scope.category = $scope.$parent.categories[index];
                $scope.currentIndex = parseInt(index);
            }
        }
    }
    
    $timeout(function(){
        $scope.getCategory();
        $scope.getProducts();  
        $scope.categories = $scope.$parent.categories;
    })
    
    $scope.$parent.$on("categoriesLoaded",function(){
        $scope.getCategory();
        $scope.getProducts();
        $scope.categories = $scope.$parent.categories;  
    })
    
    $ionicModal.fromTemplateUrl('templates/modals/view-product.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.infoModal = modal;
        });     
    $scope.openInfoModal = function(product){
        $scope.selectedProduct = product;
        $scope.infoModal.show();       
    } 
    
    $scope.addToOrder = function(product){
        $rootScope.order.order_items.push(product);
    }

    
    
    
})

.controller('OrderController', function($scope, $rootScope) {

})
