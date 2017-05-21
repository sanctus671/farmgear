angular.module('app', ['ionic', 'app.controllers', 'app.services', 'app.config', 'ngCordova', 'ionicImgCache'])

.run(function($ionicPlatform, $rootScope, AuthService, $state, $cordovaSQLite) {
    $ionicPlatform.ready(function() {

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        if (window.cordova){
            //$cordovaSQLite.deleteDB("offline.db");
            $rootScope.db = $cordovaSQLite.openDB({name: 'offline.db', location: 'default'})
            $cordovaSQLite.execute($rootScope.db, "CREATE TABLE IF NOT EXISTS categories (id int unique, data text)").then(function(){
                $rootScope.$broadcast("dbLoaded");               
            });     
        }    

        $rootScope.platform = ionic.Platform.platform(); 
    });
  
  
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams){ 
        var token = AuthService.getToken();
        $rootScope.isLoggedIn = token;
        $rootScope.currentState = toState.name;
        if (toState.requireAuth && !(token)){
            event.preventDefault();
            $state.go("login");
        }
            
    })    
    $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams){

      });   
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController'
    })
    .state('register', {
        url: '/register',
        templateUrl: 'templates/register.html',
        controller: 'RegisterController'
    })
    .state('forgotpassword', {
        url: '/forgotpassword',
        templateUrl: 'templates/forgot-password.html',
        controller: 'ForgotPasswordController'
    })

    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppController'
    })
    
    .state('app.home', {
        url: '/home',
        requireAuth:true,
        views: {
            'menuContent': {
              templateUrl: 'templates/home.html',
              controller: 'HomeController'
            }
        }
    })     
    
    .state('app.about', {
        url: '/about',
        requireAuth:true,
        views: {
            'menuContent': {
              templateUrl: 'templates/about.html',
              controller: 'AboutController'
            }
        }
    })    

    .state('app.category', {
        url: '/category/:id',
        requireAuth:true,
        views: {
            'menuContent': {
              templateUrl: 'templates/category.html',
              controller: 'CategoryController'
            }
        }
    })

    .state('app.order', {
        url: '/order',
        requireAuth:true,
        views: {
            'menuContent': {
              templateUrl: 'templates/order.html',
              controller: 'OrderController'
            }
        }
    })
    
  $urlRouterProvider.otherwise('/app/home');
});