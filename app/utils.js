var Utils = Backbone.View.extend({

    initialize:function(){
        var self = this;
    },

    /*
        Fonction de conversion degrees to radians
    */
    toRadians:function(angle) {
      return angle * (Math.PI / 180);
    }

});

module.exports = Utils;