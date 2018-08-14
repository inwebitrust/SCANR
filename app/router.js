var AppRouter = Backbone.Router.extend({

    routes: {
        "":"routeFromURL",
        ":param1/:param2":"routeWith2Parameters",
    },

    routeFromURL:function(params){ 
        App.updateFromRouter();
    },

    routeWith2Parameters:function(param1, param2){
      App.selectedLang = lang;
      App.updateFromRouter();
    },

    
    updateRoute:function(triggerize){
        this.navigate( App.param1 + "/" + App.param2, {trigger: triggerize});
    },

});

module.exports = AppRouter;