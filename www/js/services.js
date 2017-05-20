angular.module('app.services', [])

.service('AuthService', function ($state, $http, $q, API_URL, $rootScope){
    var AuthService = this;
    this.login = function(data){
        var deferred = $q.defer();
        $http.post(API_URL + "/auth/login", data)
        .success(function(data) {
            console.log(data);
            AuthService.setToken(data.token);
            deferred.resolve(data.token);
            
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    }; 


    this.register = function(data){
        var deferred = $q.defer();
        $http.post(API_URL + "/auth/signup", data)
        .success(function(data) {
            AuthService.setToken(data.token);     
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;        
    };
    
    this.userIsLoggedIn = function(){
        var deferred = $q.defer(),  
            AuthService = this,
            user = AuthService.getToken();
        if (user){
            deferred.resolve(user);           
        }
        else{
            deferred.reject("No user saved");
        }
        return deferred.promise;
    }    
     
    this.recoverPassword = function(email){
        var deferred = $q.defer();
        $http.post(API_URL + '/auth/recovery',{"email":email})
        .success(function(data) {
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    } 
    this.recoverPasswordReset = function(password, token){
        
        var deferred = $q.defer();
        if (!token){deferred.reject("No token");}  
        $http.post(API_URL + '/auth/recoveryreset?token=' + token,{"password":password})
        .success(function(data) {
            AuthService.setToken(data.token);
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    }   
    
    this.resetPassword = function(data){
        
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}  
        data["token"] = token;
        $http.post(API_URL + '/auth/reset?token=' + token,data)
        .success(function(data) {
            AuthService.setToken(data.token);
            deferred.resolve(data);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;                 
    } 
 
    this.logout = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");}   
        console.log(token);
        $http.post(API_URL + "/auth/logout?token=" + token)
        .success(function(data) {
            AuthService.removeToken();
            AuthService.removeUser();
            $rootScope.user = null;            
            deferred.resolve(data);
        })
        .error(function(data) {
            AuthService.removeToken();
            AuthService.removeUser();
            $rootScope.user = null;            
            deferred.reject(data);
        });
          

        

        return deferred.promise;         
    }
    
    this.setToken = function(token){
        window.localStorage.fg_user_token = JSON.stringify(token);
        
    }
    this.getToken = function(){
        var data = window.localStorage.fg_user_token ? JSON.parse(window.localStorage.fg_user_token) : null;
        return data;        
    }
    this.removeToken = function(){
        window.localStorage.fg_user_token = null;
    }
 
})


.service('MainService', function ($state, $http, $q, API_URL, AuthService, $rootScope, OfflineService){
    var MainService = this;
    
    this.getCategories = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");} 
        $http.get(API_URL + '/categories?token=' + token)
        .success(function(data) {
            OfflineService.storeCategories(data.categories);
            deferred.resolve(data.categories);
        })
        .error(function(data) {
            if (data && data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            var data = OfflineService.getCategories();
            deferred.resolve(data);
        });

        return deferred.promise;   
    } 

    this.createOrder = function(order){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");} 
        $http.post(API_URL + '/orders?token=' + token, order)
        .success(function(data) {
            deferred.resolve(data);
        })
        .error(function(data) {
            if (data && data.error && data.error.status_code === 401){AuthService.logout();$state.go("login")}
            if (OfflineService.isOffline()){
                OfflineService.storeOrder(order);
            }
            deferred.reject(data);
        });

        return deferred.promise;   
    }    
    
    
})


.service('OfflineService', function ($http,$interval, $q, API_URL, $rootScope, $cordovaSQLite, AuthService){
    
    var OfflineService = this, online = navigator.onLine;

    this.getOrders = function(){
        var data = window.localStorage.fg_offline_orders ? JSON.parse(window.localStorage.fg_offline_orders) : [];
        return data;        
    }     
  
    this.storeOrder = function(order){
        var orders = OfflineService.getOrders();
        order.requestid = orders.length < 1 ? 1 : parseInt(orders[orders.length - 1].requestid) + 1;
        orders.push(order);
        window.localStorage.fg_offline_orders = JSON.stringify(orders);
    }
    
    this.removeOrder = function(index){
        var orders = OfflineService.getOrders();
        orders.splice(index, 1);
        window.localStorage.fg_offline_orders = JSON.stringify(orders);
    }    
    
    this.submitOrders = function(){
       
        var deferred = $q.defer(),orders = OfflineService.getOrders(),index = 0;
  
        
        var interval = $interval(function(){  
            if (index >= orders.length){
                $interval.cancel(interval);
                deferred.resolve();
            }
            else{
                OfflineService.submitOrder(orders[index], index);
                index +=1;
            }

        },100);     
        return deferred.promise; 
    }  
    
    this.submitOrder = function(order, index){
        
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");} 
        $http.post(API_URL + '/orders?token=' + token, order)
        .success(function(data) {
            OfflineService.removeOrder(index);
            deferred.resolve(data); 
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;             
    }  
    
    this.getCategories = function(){ 
        var deferred = $q.defer(); 
        if (!$rootScope.db){deferred.reject();}
        else{
            var query = "SELECT * FROM categories";
            $cordovaSQLite.execute($rootScope.db, query, []).then(function(res) {
                if(res.rows.length > 0) {
                    deferred.resolve(JSON.parse(res.rows.item(0).data));
                } else {
                    deferred.reject();
                }
            }, function (err) {
                console.error(err);
                deferred.reject();
            });  
        }
        return deferred.promise;
    }
    
    this.storeCategories = function(data){
        if (!$rootScope.db){return;}
        var data = JSON.stringify(data);
        
        var query = "INSERT OR REPLACE INTO categories (id, data) VALUES (?,?)";
        $cordovaSQLite.execute($rootScope.db, query, [1, data]).then(function(res) {

        }, function (err) {
            console.error(err);
        });        
    }

    this.isOffline = function(){
        return !online;
    }
  
    document.addEventListener("offline", function(){
        online = false;
    }, false);
    document.addEventListener("online", function(){
        online = true;
        this.checkOrders();
    }, false); 
    
    
    this.checkOrders = function(){
        var orders = this.getOrders();
        if (orders.length > 0 && online){
            this.submitOrders();
        }
    } 
    this.checkOrders();
    
    
})