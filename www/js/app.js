angular.module('app', ['ionic', 'app.controllers', 'app.services', 'app.config'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {

    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
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

    .state('app.category', {
        url: '/category/:id',
        views: {
            'menuContent': {
              templateUrl: 'templates/category.html'
            }
        }
    })

    .state('app.order', {
        url: '/order',
        views: {
            'menuContent': {
              templateUrl: 'templates/order.html'
            }
        }
    })
    
  $urlRouterProvider.otherwise('/login');
});
