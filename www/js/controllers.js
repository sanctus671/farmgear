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
            $scope.user = {email:"", name:"", phone:"", password:"", repeat_password:""};
            $scope.errors = [];
            $scope.registered = true;
            
        },function(data){
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
        for (var index in $rootScope.order.order_items){
            if ($rootScope.user && $rootScope.user.discount > 0){
                price = price + (parseFloat($rootScope.order.order_items[index].price) * (1 - (parseFloat($rootScope.user.discount)/100)));
            }
            else{
                price = price + parseFloat($rootScope.order.order_items[index].price);
            }
            
        }
        return price;
    }
    
    $scope.calculateValves = function(){
        var valves = 0;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index] && $rootScope.order.order_items[index].product_id === 2){
                //remove existing valves product
                $rootScope.order.order_items.splice(index,1);
            }
            if ($rootScope.order.order_items[index] && $rootScope.order.order_items[index].valves_required){
                valves = valves + parseFloat($rootScope.order.order_items[index].valves_required);
            }
            else if ($rootScope.order.order_items[index] && $rootScope.order.order_items[index].spare_valves){
                valves = valves - parseFloat($rootScope.order.order_items[index].spare_valves);
                $rootScope.order.order_items[index]
            }
        }
        if (valves > 0){
            $rootScope.order.order_items.push({product_id:2, quantity:valves, price:valves*425, name:"Valves"});
        } 
    }
    
    $scope.$on('$ionicView.loaded', function() {
      ionic.Platform.ready( function() {         
            if(navigator && navigator.splashscreen) {$timeout(function(){navigator.splashscreen.hide();},1000);}         
      });
    });     

})

.controller('HomeController', function($scope, $timeout, MainService, OfflineService, $rootScope) {
    $timeout(function(){
        $scope.categories = $scope.$parent.categories;        
    })
    
    $scope.$parent.$on("categoriesLoaded",function(){
        $scope.categories = $scope.$parent.categories; 
    })  
    
    $rootScope.$on("dbLoaded", function(){
        $timeout(function(){
            if (OfflineService.isOffline()){   
                $scope.$parent.getCategories();
            }        
        },1000);
    })

    
    $scope.getCategories = function(){
        $scope.$parent.getCategories();
        $scope.$broadcast('scroll.refreshComplete');       
    }
    
    
})

.controller('AboutController', function($scope) {
})

.controller('CategoryController', function($scope, $stateParams, MainService, $timeout, $ionicModal, $rootScope, $ionicPopup) {
    $scope.category = {};
    $scope.products = [];
    $scope.categories = [];
    
    $scope.selectedOptions = {};
    $scope.selectedOption = {}; //for popup
    
    $scope.selectedProduct = {};
    
    $scope.currentIndex = 999;
    
    $scope.$on('$ionicView.enter', function() {
        $rootScope.stateIndex = parseInt($stateParams.id);
    })
    
    $scope.addedToOrder = {};
    
    $scope.getProducts = function(){
        $scope.products = $scope.category.products; 
        for (var index in $scope.products){
            if ($scope.products[index].gallery){
                $scope.products[index].gallery = JSON.parse($scope.products[index].gallery);
            }
        }
    }
    
    $scope.getCategory = function(){
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
        $scope.addedToOrder[product.name] = true;
        var item = {product_id:product.id, quantity:1, price: product.price, name:product.name, spare_valves:product.spare_valves};
        var exists = false;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === product.id && !$rootScope.order.order_items[index].product_option_id){
                exists = true;
            }
        }
        
        if (!exists){
            $rootScope.order.order_items.push(item);
            $scope.$parent.calculateValves();
        }
    }
    
    $scope.removeFromOrder = function(product){
        $scope.addedToOrder[product.name] = false;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === product.id && !$rootScope.order.order_items[index].product_option_id){
                $rootScope.order.order_items.splice(index,1);
                $scope.$parent.calculateValves();
            }
        }   
    }    
    
    
    $scope.updateOptions = function(option, product, selected){
        if ($rootScope.user && $rootScope.user.permission === "public"){
            return;
        }
        if (selected){
            if (!$scope.addToOrder[product.name]){$scope.addToOrder(product);}
            var item = {product_option_id:option.id, product_id: product.id,  quantity:1, price: option.price, name:option.name, valves_required:option.valves_required, product_name:product.name};
            if (option.allow_multiple){
                $scope.addQuantity(item);
            }
            else{
                $rootScope.order.order_items.push(item);
                $scope.$parent.calculateValves();
            }
        }
        else{
            for (var index in $rootScope.order.order_items){
                if ($rootScope.order.order_items[index].product_option_id === option.id){
                    $rootScope.order.order_items.splice(index, 1);
                    $scope.$parent.calculateValves();
                }
            }
        }
    }

    
    $scope.openViewFullOption = function(ev, option, product){
        ev.stopPropagation();
        $ionicPopup.show('show',{
            templateUrl: 'templates/popups/view-option.html',
            title: 'Option Details',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Add Option</b>',
                type: 'button-balanced',
                onTap: function(e) {
                    return true;
                }
              }
            ]
          }).then(function(res) {
                if (res){
                    $scope.selectedOptions[option.name];
                    $scope.updateOptions(option, product, selectedOptions[option.name])
                }
            });        
    }  
    
    
    $scope.addQuantity = function(item){
        $scope.selectedOption = item;
        $ionicPopup.show({
          template: '<input type="number" ng-model="selectedOption.quantity" class="quantity-input">',
          title: 'Select Quantity',
          subTitle: 'Choose how many of this option you want to add',
          scope: $scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>Add</b>',
              type: 'button-balanced',
              onTap: function(e) {
                return true;
                }
              
            }
          ]
        }).then(function(res) {
            if (res){
                item.price = item.price * item.quantity;
                $rootScope.order.order_items.push(item);
                $scope.$parent.calculateValves();
            }
            else{
                $scope.selectedOptions[item.name] = false;
            }
        });        
    }
    
    
    
})

.controller('OrderController', function($scope, $rootScope, $ionicPopup, $state, $ionicHistory, MainService) {

    $scope.$on('$ionicView.enter', function() {
        //order the order
   
        $rootScope.order.order_items.sort(function(a,b){
            a = parseFloat(a.product_id + "." + a.product_option_id);
            b = parseFloat(b.product_id + "." + b.product_option_id);
            return a - b;
        })
        
        $scope.$parent.calculateValves();
        
    });
    
    $scope.discount = 0;
    
    
    $scope.getOrderTotal = function(){
        var price = 0, discount = 0;
        $scope.discount = 0;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.user && $rootScope.user.discount > 0){
                discount = parseFloat($rootScope.order.order_items[index].price) * (parseFloat($rootScope.user.discount)/100);
                price = price + ((parseFloat($rootScope.order.order_items[index].price)  - discount));
                $scope.discount = $scope.discount + discount;
            }
            else{
                price = price + parseFloat($rootScope.order.order_items[index].price);
            }
            
        }
        return price;       
    }
    
    $scope.removeItem = function(item, index){
        $rootScope.order.order_items.splice(index,1);
        $scope.$parent.calculateValves();     
    }
    
    $scope.completeOrder = function(){
        
        if ($rootScope.user && $rootScope.user.discount > 0){
            var order = angular.copy($rootScope.order);
            order.order_items.push({product_id:19, quantity:1, price:-($scope.discount), name:"Discount"});
            MainService.createOrder(order);
        }
        else{
            MainService.createOrder($rootScope.order);
        }
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
            $rootScope.order.order_items = [];
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();            
            $state.go('app.home');
        });       
    }
    
    
    
    
})
