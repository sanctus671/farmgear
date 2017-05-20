angular.module('app.controllers', [])


.controller('LoginController', function($scope, AuthService, $state, $timeout) {
    $scope.user = {email:"", password:""};
    $scope.errors = [];
    
    $scope.login = function(){
        AuthService.login($scope.user).then(function(){
            $scope.user = {email:"", password:"", confirm_password:""};
            $scope.errors = [];
            $state.go("app.home");
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
    
    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    }); 
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


.controller('AppController', function($scope, $timeout, $ionicModal, $timeout, MainService, $rootScope, $stateParams) {
    $scope.categories = [];
    
    $rootScope.order = {order_items:[]};
    
    $scope.getCategories = function(){
        MainService.getCategories().then(function(data){
            $scope.categories = data;
            $scope.$broadcast("categoriesLoaded");
        })
    }
    
    $scope.getCategories();
    
    $scope.getOrderPrice = function(){
        var price = 0;
        for (var index in $scope.order.order_items){
            price = price + parseFloat($scope.order.order_items[index].price);
        }
        return price;
    }
    
    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    });     

})

.controller('HomeController', function($scope, $timeout, MainService, OfflineService) {
    $timeout(function(){
        $scope.categories = $scope.$parent.categories;        
    })
    
    $scope.$parent.$on("categoriesLoaded",function(){
        $scope.categories = $scope.$parent.categories;      
    })  
    
    if (OfflineService.isOffline()){ //have to do this because local db takes a while to load
        $timeout(function(){          
            $scope.getCategories();
        },1000);
    }
    
    $scope.getCategories = function(){
        MainService.getCategories().then(function(data){
            $scope.categories = data;
            $scope.$broadcast('scroll.refreshComplete');
        })        
    }
    
    
})

.controller('AboutController', function($scope) {
})

.controller('CategoryController', function($scope, $stateParams, MainService, $timeout, $ionicModal, $rootScope) {
    $scope.category = {};
    $scope.products = [];
    $scope.categories = [];
    
    $scope.selectedOptions = {};
    
    $scope.selectedProduct = {};
    
    $scope.currentIndex = 999;
    
    $scope.$on('$ionicView.enter', function() {
        $rootScope.stateIndex = parseInt($stateParams.id);
    })
    
    $scope.addedToOrder = false;
    
    $scope.getProducts = function(){
        $scope.products = $scope.category.products; 
        for (var index in $scope.products){
            if ($scope.products[index].gallery){
                $scope.products[index].gallery = JSON.parse($scope.products[index].gallery);
            }
        }
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
        $scope.addedToOrder = true;
        var item = {product_id:product.id, quantity:1, price: product.price, name:product.name};
        var exists = false;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === product.id && !$rootScope.order.order_items[index].product_option_id){
                exists = true;
            }
        }
        
        if (!exists){
            $rootScope.order.order_items.push(item);
        }
    }
    
    $scope.removeFromOrder = function(product){
        $scope.addedToOrder = false;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === product.id && !$rootScope.order.order_items[index].product_option_id){
                $rootScope.order.order_items.splice(index,1);
            }
        }
    }    
    
    
    $scope.updateOptions = function(option, product, selected){
        if (selected){
            var item = {product_option_id:option.id, product_id: product.id,  quantity:1, price: option.price, name:option.name, product_name:product.name};
            $rootScope.order.order_items.push(item);
        }
        else{
            for (var index in $rootScope.order.order_items){
                if ($rootScope.order.order_items[index].product_option_id === option.id){
                    $rootScope.order.order_items.splice(index, 1);
                }
            }
        }
    }

    
    
    
})

.controller('OrderController', function($scope, $rootScope, $ionicPopup, $state, $ionicHistory, MainService) {
    
    $scope.localOrder = {order_items:[]}
    
    $scope.$on('$ionicView.enter', function() {
        //order the order
        $scope.localOrder = angular.copy($rootScope.order);
                
        $scope.localOrder.order_items.sort(function(a,b){
            a = parseFloat(a.product_id + "." + a.product_option_id);
            b = parseFloat(b.product_id + "." + b.product_option_id);
            return a - b;
        })
        //calculate and add valves
        var valves = 0;
        for (var index in $scope.localOrder.order_items){
            if ($scope.localOrder.order_items[index].valves_required){
                valves = valves + parseFloat($scope.localOrder.order_items[index].valves_required);
            }
        }
        
        if (valves > 0){
            $scope.localOrder.order_items.push({product_id:2, quantity:valves, price:valves*425, name:"Valves"});
        }
        
    })    
    
    
    $scope.getOrderTotal = function(){
        var price = 0;
        for (var index in $scope.localOrder.order_items){
            price = price + parseFloat($scope.localOrder.order_items[index].price);
        }
        return price;        
    }
    
    $scope.removeItem = function(item, index){
        $scope.localOrder.order_items.splice(index,1);
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === item.product_id && 
                    $rootScope.order.order_items[index].product_option_id === item.product_option_id){
                $rootScope.order.order_items.splice(index,1);
                //$ionicHistory.clearCache();
            }
        }
        
    }
    
    $scope.completeOrder = function(){
        MainService.createOrder($scope.localOrder);
        $ionicPopup.alert({
            title: 'Order Completed',
            template: 'Your order has been received and is now being processed. We will be in touch as your order progresses.',
            buttons:[{
                text: 'OK',
                type: 'button-balanced',
                onTap: function(e) {
                  return true;
                }
                }]
       }).then(function(res) {
            $scope.localOrder = {order_items:[]};
            $rootScope.order.order_items = [];
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();            
            $state.go('app.home');
        });       
    }
    
    
    
    
})
