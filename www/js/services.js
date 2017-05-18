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


.service('MainService', function ($state, $http, $q, API_URL, AuthService, $rootScope){
    var MainService = this;
    
    this.getCategories = function(){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");} 
        $http.get(API_URL + '/categories?token=' + token)
        .success(function(data) {
            deferred.resolve(data.categories);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;   
    } 
    
    
    this.getProducts = function(categoryId){
        var deferred = $q.defer();
        var token = AuthService.getToken();
        if (!token){deferred.reject("No token");} 
        $http.get(API_URL + '/products/' + categoryId + '?token=' + token)
        .success(function(data) {
            deferred.resolve(data.products);
        })
        .error(function(data) {
            deferred.reject(data);
        });

        return deferred.promise;   
    }    
    
})