angular.module('app.controllers', [])


.controller('LoginController', function($scope, AuthService, $state, $timeout) {
    $scope.user = {email:"", password:"password"};
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
    $scope.user = {email:"", name:"", phone:"", password:"password", repeat_password:"password"};
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


.controller('AppController', function($scope, $timeout, AuthService, $ionicModal, $timeout, MainService, $rootScope, $stateParams, $ionicHistory, $state) {
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
            if ($rootScope.user && $rootScope.user.permission === "assistant" && $rootScope.currentManagedUser && $rootScope.currentManagedUser.discount > 0 && $rootScope.discountApplied){
                price = price + (parseFloat($rootScope.order.order_items[index].price) * (1 - (parseFloat($rootScope.currentManagedUser.discount)/100)));              
            }            
            else if ($rootScope.user && $rootScope.user.discount > 0 && $rootScope.discountApplied){
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
    
    $scope.logout = function(){
            $rootScope.order.notes = "";
            $rootScope.order.order_items = [];
            //$ionicHistory.clearCache();
            $rootScope.$broadcast("resetOrder");
            $ionicHistory.clearHistory();   
            AuthService.logout();
            $state.go('login');         
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
    
    $scope.addedToOrder = {};
    
    $scope.assignedColors = {};
    
    
    $scope.$on('$ionicView.enter', function() {
        $rootScope.stateIndex = parseInt($stateParams.id);
    })
    
    $rootScope.$on("resetOrder",function(){
        $scope.selectedOptions = {};
        $scope.selectedOption = {}; //for popup

        $scope.selectedProduct = {};   
        $scope.addedToOrder = {};
    })
    
    
    
    $scope.getProducts = function(){
        $scope.products = $scope.category.products; 

        for (var index in $scope.products){
            if ($scope.products[index].gallery){
                $scope.products[index].gallery = JSON.parse($scope.products[index].gallery);
                $scope.assignColors($scope.products[index]);
                //$scope.setDefaults($scope.products[index]);
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
    
    $scope.setDefaults = function(product){
        for (var index in product.product_rules){
            var rule = product.product_rules[index];
            if (rule.type === "default"){
                var requirements = rule.requirements.split(",");
                for (var index2 in product.product_options){
                    var option = product.product_options[index2]
                    if (requirements.indexOf(option.id) > -1){
                        $scope.selectedOptions[option.name] = true;
                        $scope.updateOptions(option, product, $scope.selectedOptions[option.name],true)
                    }
                }
            }
            
        }
    }
    
    $scope.checkRequiredRules = function(product, productOption){
       var addedOptions = []; 
       for (var index in product.product_rules){
            var rule = product.product_rules[index];
            if (parseInt(rule.product_option_id) === parseInt(productOption.id) && rule.type === "requires"){
                var requirements = rule.requirements.split(",");
                for (var index2 in product.product_options){
                    var option = product.product_options[index2]
                    if (requirements.indexOf(option.id) > -1 && !$scope.selectedOptions[option.name]){
                        $scope.selectedOptions[option.name] = true;
                        $scope.updateOptions(option, product, $scope.selectedOptions[option.name],false);
                        addedOptions.push((option.group_name ? option.group_name + " - " : "") + option.name);
                    }
                }
            }
            
        } 
        
        if (addedOptions.length > 0){
            var html = 'The following have been added to your order: <ul>';
            for (var index in addedOptions){
                html = html + "<li>" + addedOptions[index] + "</li>";
            }
            html = html + "</ul>";
            $ionicPopup.alert({
              template: html,
              title: 'Required Options',
              subTitle: 'This options requires other options to be added',
              scope: $scope,   
              buttons: [{ text: 'OK', type: 'button-balanced'}]
            });        
               
        }
  
    }
    
    
    $scope.checkLimitRules = function(product, lastOption){
        for (var index in product.product_rules){
            var rule = product.product_rules[index];
            if (rule.type === "limit"){
                var requirements = rule.requirements.split(",");
                var options = [];
                //check if more than one of the requirements is added
                for (var index2 in product.product_options){
                    var option = product.product_options[index2]
                    if (requirements.indexOf(option.id) > -1 && $scope.selectedOptions[option.name]){
                        options.push(angular.copy(option));
                    }
                }
                
                if (options.length > 1){
                    for (var index in options){
                        if (parseInt(options[index].id) === parseInt(lastOption.id)){
                            
                            var option = options[index];

                            options.splice(index,1);
                            options.unshift(option);
                            
                        }
                    }
                    while (options.length > 1){
                        var option = options.pop();
                        $scope.selectedOptions[option.name] = false;
                        $scope.updateOptions(option,product,false, false);
                    }
                }
            }
            
        }
    }    
    
    
    
    $scope.assignColors = function(product){
        var colors = ["#e1f7d5", "#ffbdbd", "#c9c9ff", "#f1cbff", "#bae1ff", "#baffc9", "#ffffba", "#ffdfba", "#ffb3ba"];
        
        var colorIndex = 0;
        for (var index in product.product_options){
            var option = product.product_options[index];
            if (option.group_name && !(option.group_name in $scope.assignedColors)){
                if (colorIndex > 8){
                   colors.push("hsl(" + 360 * Math.random() + ',' +
                 (25 + 70 * Math.random()) + '%,' + 
                 (85 + 10 * Math.random()) + '%)');
                }
                $scope.assignedColors[option.group_name] = colors[colorIndex];
                colorIndex = colorIndex + 1;       
            }
        }
        
        
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
            $scope.setDefaults(product);
        }
        
        
    }
    
    $scope.removeFromOrder = function(product){
        $scope.addedToOrder[product.name] = false;
        for (var index in $rootScope.order.order_items){
            if ($rootScope.order.order_items[index].product_id === product.id /*&& !$rootScope.order.order_items[index].product_option_id*/){
                $rootScope.order.order_items.splice(index,1);
                $scope.$parent.calculateValves();
            }
        }   
    }    
    
    
    $scope.updateOptions = function(option, product, selected, defaultAdd){
        if ($rootScope.user && $rootScope.user.permission === "public"){
            return;
        }

        if (selected){
            if (!$scope.addedToOrder[product.name]){$scope.addToOrder(product);}
            var item = {product_option_id:option.id, product_id: product.id,  quantity:1, price: option.price, name:option.name, valves_required:option.valves_required, product_name:product.name};
            if (option.allow_multiple){
                $scope.addQuantity(item, product);
            }
            else{
                $rootScope.order.order_items.push(item);
                $scope.$parent.calculateValves();
            }
            if (!defaultAdd){
                $scope.checkRequiredRules(product, option);
                $scope.checkLimitRules(product, option);
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
                    $scope.updateOptions(option, product, selectedOptions[option.name], false)
                }
            });        
    }  
    
    
    $scope.addQuantity = function(item, product){
        $scope.selectedOption = item;
        //check for min quantity rule
        var min = 1;
       for (var index in product.product_rules){
            var rule = product.product_rules[index];
            if (parseInt(rule.product_option_id) === parseInt(item.product_option_id) && rule.type === "quantity"){
                min  = parseFloat(rule.quantity);
                $scope.selectedOption.quantity = min;
            }
        }
        
        $ionicPopup.show({
          template: '<input type="number" ng-model="selectedOption.quantity" class="quantity-input" min="' + min + '">',
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

.controller('OrderController', function($scope, $rootScope, $ionicPopup, $state, $ionicHistory, MainService, DraftOrdersService) {

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
    $rootScope.discountApplied = $rootScope.discountApplied ? $rootScope.discountApplied : false;
    
    
    $scope.getOrderTotal = function(){
        var price = 0, discount = 0;
        $scope.discount = 0;
        for (var index in $rootScope.order.order_items){
            
            if ($rootScope.user && $rootScope.user.permission === "assistant" && $rootScope.currentManagedUser && $rootScope.currentManagedUser.discount > 0 && $rootScope.discountApplied){
                discount = parseFloat($rootScope.order.order_items[index].price) * (parseFloat($rootScope.currentManagedUser.discount)/100);
                price = price + ((parseFloat($rootScope.order.order_items[index].price)  - discount));
                $scope.discount = $scope.discount + discount;                
            }
            else if ($rootScope.user && $rootScope.user.discount > 0 && $rootScope.discountApplied){
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
    
    $scope.applyDiscount = function(){
        $rootScope.discountApplied = true;  
        $scope.getOrderTotal();
    }
    
    $scope.clearDiscount = function(){
        $rootScope.discountApplied = false;  
        $scope.getOrderTotal();
    }    
    
    $scope.removeItem = function(item, index){
        $rootScope.order.order_items.splice(index,1);
        $scope.$parent.calculateValves(); 
        //$ionicHistory.clearCache();
        $ionicHistory.clearHistory();        
    }
    
    $scope.completeOrder = function(){
        
        if ($rootScope.currentManagedUser){
            $rootScope.order.managed_user_id = $rootScope.currentManagedUser.id
        }
        
        if ($rootScope.user && ($rootScope.user.discount > 0 || ($rootScope.currentManagedUser && $rootScope.currentManagedUser.discount > 0)) && $scope.discount > 0 && $rootScope.discountApplied){
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
            //$ionicHistory.clearCache();
            $rootScope.$broadcast("resetOrder");
            $ionicHistory.clearHistory();            
            $state.go('app.home');
        });       
    }
    
    $scope.clearCart = function(){
            $rootScope.order.notes = "";
            $rootScope.order.order_items = [];
            //$ionicHistory.clearCache();
            $rootScope.$broadcast("resetOrder");
            $ionicHistory.clearHistory();            
            $state.go('app.home');        
    }
    
    
    $scope.expandText = function(){
            var element = document.getElementById("notes-input");
            element.style.height =  element.scrollHeight + "px";
    }    
    
    $scope.preSaveOrder = function(){
        $rootScope.order.name = "";
        $ionicPopup.show({
          template: '<input type="text" ng-model="order.name">',
          title: 'Enter a name for this order',
          subTitle: 'This will be used as a reference',
          scope: $scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>Save</b>',
              type: 'button-balanced',
              onTap: function(e) {
                if (!$rootScope.order.name) {
                  //don't allow the user to close unless he enters a name
                  e.preventDefault();
                } else {
                  return $rootScope.order.name;
                }
              }
            }
          ]
        }).then(function(name){
            $scope.saveOrder();
        });        
    }
    
    $scope.saveOrder = function(){
        var createdDate = new Date();
        $rootScope.order.created_at = createdDate.getDate() + "/" + (createdDate.getMonth() + 1) + "/" + createdDate.getFullYear() + " at " + createdDate.getHours() + ":" + createdDate.getMinutes();
        $rootScope.order.total = $scope.getOrderTotal();
        $rootScope.order.discount = $scope.discount;
        DraftOrdersService.storeOrder(angular.copy($rootScope.order));
        $rootScope.order.notes = "";
        $rootScope.order.order_items = [];
        //$ionicHistory.clearCache();
        $rootScope.$broadcast("resetOrder");
        $ionicHistory.clearHistory(); 
        $state.go('app.orders'); 
        
        $ionicPopup.alert({
            title: 'Order Saved',
            template: 'Your order has been saved. You can view your saved orders under Saved Orders in the side menu.',
            buttons:[{
                text: 'OK',
                type: 'button-balanced',
                onTap: function(e) {
                  return true;
                }
                }]
       })        
    }
    
    $scope.emailOrder = function(){
        var order = angular.copy($rootScope.order);
        var createdDate = new Date();
        order.created_at = createdDate.getDate() + "/" + (createdDate.getMonth() + 1) + "/" + createdDate.getFullYear() + " at " + createdDate.getHours() + ":" + createdDate.getMinutes();
        order.total = $scope.getOrderTotal();
        order.discount = $scope.discount;

        MainService.emailOrder(order).then(function(){
            
            $ionicPopup.alert({
                title: 'Order Sent',
                template: 'Your order has been sent. You will receive it shortly.',
                buttons:[{
                    text: 'OK',
                    type: 'button-balanced',
                    onTap: function(e) {
                      return true;
                    }
                    }]
           })             
        })
    }
    
})


.controller('UsersController', function($scope, $timeout, $state, $ionicModal, $ionicHistory, $timeout, MainService, $rootScope, $stateParams) {
    //to create orders on another customers behalf
    $scope.$on('$ionicView.enter', function() {
        if ($rootScope.user && $rootScope.user.permission !== "assistant"){
            $state.go("app.home");
        }
        
    });   
    
    $scope.managedUsers = [];
    
    $scope.newUser = {name:"",email:"", phone:"", discount:""};
    
    
    $scope.getManagedUsers = function(){
        MainService.getManagedUsers().then(function(data){
            $scope.managedUsers = data;
        })
    }
    
    $scope.getManagedUsers();
    
    $scope.selectUser = function(user){
        $rootScope.currentManagedUser = user;
        $rootScope.discountApplied = false; 
        $rootScope.order = {order_items:[]};
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();         
    }
    
    $scope.clearUser = function(){
        $rootScope.currentManagedUser = false;
        $rootScope.discountApplied = false; 
        $rootScope.order = {order_items:[]};
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();          
    }
    
    
    $ionicModal.fromTemplateUrl('templates/modals/create-user.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.userModal = modal;
        });     
    $scope.openCreateUser = function(){
        $scope.userModal.show(); 
    }
    
    $scope.createUser = function(){
        $scope.userModal.hide();
        var addedUser = angular.copy($scope.newUser);
        $scope.managedUsers.push({user:addedUser});
        $scope.newUser = {name:"",email:"", phone:"", discount:""};
        MainService.createManagedUser(addedUser).then(function(data){
            
            addedUser.id = data.id;
            $scope.selectUser(addedUser);
            
        })
    }
    
    
})



.controller('OrdersController', function($scope, $rootScope, $ionicPopup, $state, $ionicHistory, MainService, DraftOrdersService, $ionicModal) {
    $scope.orders = [];
    $scope.order = {}; //for viewing specific order
    $scope.orderIndex = false;
    
    $scope.getOrders = function(){
        $scope.orders = DraftOrdersService.getOrders();
    }
    
    $scope.$on('$ionicView.enter', function() {
        $scope.getOrders();
    });     
    
    
    $scope.removeOrder = function(e, order, orderIndex){
        e.preventDefault(); // added for ionic
        e.stopPropagation(); 
        DraftOrdersService.removeOrder(orderIndex);
        $scope.getOrders();        
        
    }

    $ionicModal.fromTemplateUrl('templates/modals/view-draft-order.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.orderModal = modal;
        });   
 
    $scope.viewOrder = function(order, index){
        $scope.order = order;
        $scope.orderIndex = index;
        $scope.orderModal.show();
    }
    
    $scope.loadOrder = function(){
        $ionicPopup.show({
          template: 'This order will overwrite your current order. You will then be able to modify it.',
          title: 'Confirm',
          scope: $scope,
          buttons: [
            { text: 'Cancel' },
            {
              text: '<b>OK</b>',
              type: 'button-balanced',
              onTap: function(e) {
                return true;
                }
              
            }
          ]
        }).then(function(res) {
            if (res){
                $scope.orderModal.hide();
                $rootScope.order = angular.copy($scope.order);
                DraftOrdersService.removeOrder($scope.orderIndex);
                $scope.getOrders();
                $state.go('app.order'); 
            }
        });       
        
        
    }
   
    
    
    $scope.completeOrder = function(){

        if ($scope.order.discount > 0){
            var order = angular.copy($scope.order);
            order.order_items.push({product_id:19, quantity:1, price:-(order.discount), name:"Discount"});
            MainService.createOrder(order);
        }
        else{
            MainService.createOrder($scope.order);
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
            $scope.orderModal.hide();
            DraftOrdersService.removeOrder($scope.orderIndex);
            $scope.getOrders();
        });       
    }    
    
        
})


.controller('CalculatorController', function($scope, $rootScope, $ionicPopup, $state, $ionicHistory, MainService, $ionicModal) {
    $scope.products = [];
    $scope.product = {};
    $scope.fullOrder = {price:0, name:"Current Order", options:[]};
    
    $scope.getProducts = function(){
        $scope.products = [];
        var options = {};
        var products = {};
        $scope.fullOrder = {price:0, name:"Current Order", options:[]};
        for (var index in $rootScope.order.order_items){
            var product = $rootScope.order.order_items[index];
            
            $scope.fullOrder.price += product.price;

            if (!product.product_option_id){
                product["options"] = [];
                products[product.product_id] = product;
                
            }
            else if (product.product_id in options){
                options[product.product_id].push(product);
                $scope.fullOrder.options.push(product);
            }
            else{
                options[product.product_id] = [product];
                $scope.fullOrder.options.push(product);
            }
        }
        
        for (var index in options){
            products[index].options = options[index];
            $scope.products.push(products[index]);
        }
        
        for (var index in products){
            if (products[index].options.length < 1){
                $scope.products.push(products[index]);
            }
        }

    }
    
    
    
    $scope.$on('$ionicView.enter', function() {
        $scope.getProducts();
    });     
    
    $ionicModal.fromTemplateUrl('templates/modals/calculator.html', {
        scope: $scope,
        animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.calculatorModal = modal;
        });   
 
    $scope.viewCalculator = function(product){
        if (product){
            $scope.product = product;
        }
        else {
            $scope.product = {price:"", custom:true, name:"Custom Calculation"}
        }
        $scope.calculatorModal.show();
    }  
    
    $scope.getDiscount = function(price){
        if (!$rootScope.user){return 0;}
        price = price ? price : 0;
        return price - (parseFloat(price) * (parseFloat($rootScope.user.discount)/100));
    }

    $scope.emailCalculations = function(product){

        product.discount = $scope.getDiscount(product.price);
        product.margin_price = product.sell_price > 0 ? product.sell_price - $scope.getDiscount(product.price) : 0
        product.rrp = product.price > 0 && product.sell_price > 0 ? (1 - (product.sell_price/product.price)) * 100 : 0;
        
        MainService.emailCalculations(product).then(function(){
            $ionicPopup.alert({
                title: 'Calculations Sent',
                template: 'These details have been sent to your email addesss. You will receive them shortly.',
                buttons:[{
                    text: 'OK',
                    type: 'button-balanced',
                    onTap: function(e) {
                      return true;
                    }
                    }]
           })           
        })
    }
    
    $scope.updateSellPrice = function(){
        $scope.product.sell_price = $scope.product.margin > 0 && $scope.product.price > 0 ? 
            Math.round(($scope.getDiscount($scope.product.price) / (1 - ($scope.product.margin/100)))*100)/100
            : 0;
    }
    
    $scope.updateMargin = function(){
        $scope.product.margin = $scope.product.sell_price > 0 && $scope.product.price > 0  ? 
            Math.round(((($scope.product.sell_price - $scope.getDiscount($scope.product.price)) / $scope.product.sell_price) * 100)*100)/100 
            : 0;
    }
    
    $scope.updateCalculations = function(){
        if ($scope.product.sell_price){
            $scope.updateMargin();
        }
    }
    
        
})
