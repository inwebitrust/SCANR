var App = {
    $body:$("body"),

    init: function init() {
        this.$App = $("#App");
        this.$BubblesWorld = $("#BubblesWorld");
        this.$Tooltip = $(".menu_tooltip");

        this.startRadius = 20; // rayon initial de positionnement des bulles
        this.rowShiftRadius = 10; // rayon de décalage des bulles

        this.nbProductions = 3000; // nombre de bulles pour le faux jeu de données
        this.productions = {}; // objet js contenant toutes les productions
        this.filteredProductions = []; // objet contenant les productions filtrées en fonction des choix de l'utilisateur

        this.selectedType = "_"; // type selectionné : "_", "publication", "brevet" ou "these"
        this.selectedBeginYear = 2002; // année de début
        this.selectedEndYear = 2016; // année de fin
        this.isByDomain = false; // booléen pour savoir si l'app doit être groupée par domaine ou non

        var Utils = require("utils");
        this.utils = new Utils();

        var HeaderView = require("views/headerView");
        this.headerView = new HeaderView();

        this.render();
    },

    render:function(){
    	this.generateRandomData();
        this.renderRangeSlider();
        this.bindEvents();

        this.update();
    },

    /*
        Génération d'un faux jeu de données
    */
    generateRandomData:function(){
        for(var i=0 ; i<this.nbProductions ; i++){
            var prodObj = {
                id:i,
                type:_.sample(["publication", "brevet", "these", "publication", "publication", "publication", "brevet", "brevet"]),
                year:_.sample([2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016]),
                domain:_.sample([1,2,3,4,5,6]),
                title:chance.sentence({words:3}),
                author:chance.name()
            };

            if(prodObj == "brevet"){
                prodObj.openAccess = 0;
            }else{
                prodObj.openAccess = _.sample([0,0,0,0,0,0,0,0,0,0,0,0,0,1]);
            }
            this.productions[prodObj.id] = prodObj;
        }
    },

    /*
        Initialisation du range slider Jquery
    */
    renderRangeSlider:function(){
        var self = this;

        $( "#RangeSlider" ).slider({
          range: true,
          min: 2002,
          max: 2016,
          step:1,
          values:[2002, 2016],
          stop: function( event, ui ) {
            self.selectedBeginYear = ui.values[0];
            self.selectedEndYear = ui.values[1];
            self.update();
          },
        });
    },

    /*
        Update de l'app à chaque changement d'état
    */
    update:function(){
        var self = this;

        this.filterProductions();
        this.updateRangeValues();

        if(this.selectedType == "_"){
            this.updateProductionsView();
        }else{
            if(this.isByDomain){
                this.updateProductionTypeByDomainView();
            }else{
                this.updateProductionTypeView();
            }
        }

        $(".title_nb").html(this.filteredProductions.length);

        if(this.groupedProductions["these"] !== undefined) $(".menu_typebt[data-type='these'] .typebt_nb").html(this.groupedProductions["these"].length);
        else $(".menu_typebt[data-type='these'] .typebt_nb").html("0");

        if(this.groupedProductions["brevet"] !== undefined) $(".menu_typebt[data-type='brevet'] .typebt_nb").html(this.groupedProductions["brevet"].length);
        else $(".menu_typebt[data-type='brevet'] .typebt_nb").html("0");

        if(this.groupedProductions["publication"] !== undefined) $(".menu_typebt[data-type='publication'] .typebt_nb").html(this.groupedProductions["publication"].length);
        else $(".menu_typebt[data-type='publication'] .typebt_nb").html("0");

        $(".menu_typebt").removeClass("selected");
        $(".menu_typebt[data-type='"+self.selectedType+"']").addClass("selected");
    },

    /*
        Update des années du Range Slider
    */
    updateRangeValues:function(){
        $(".range_value[data-range='low']").html(App.selectedBeginYear)
                                            .css("left", $($(".ui-slider-handle")[0]).position().left);
        $(".range_value[data-range='up']").html(App.selectedEndYear)
                                            .css("left", $($(".ui-slider-handle")[1]).position().left);
    },

    /*
        Update de la vue "Productions" - avec les 3 cercles
    */
    updateProductionsView:function(){
        var self = this;

        $("#ProductionsView").addClass("displayed");
        $("#ProductionTypeView").removeClass("displayed");
        $(".block_productiontype").removeClass("displayed");
        $("#ProductionTypeByDomainView").removeClass("displayed");

        $(".packcircle").empty();

        _.each(this.groupedProductions, function(group, index){
            var $packcircle = $(".packcircle[data-type='"+index+"']"); // je récupère le packcircle qui va contenir toutes mes bulles
            var startLeft = $packcircle.width()/2; // je stocke la position center x
            var startTop = $packcircle.height()/2; // je stocke la position center y

            var radius = self.startRadius; // rayon initial de positionnement des bulles
            var perimeter = 2 * Math.PI * radius; // calcul du permiètre du cercle conteneur
            var maxBubbles = Math.floor(perimeter / 10); // calcul du nombre max de bulle pour ce perimetre
            var angleShift = 360/maxBubbles; // calcul de l'angle de décalage entre chaque bulle
            var incBubble = 0; // incrementeur du nombre de bulles

            _.each(group, function(prod){
                // pour chaque production j'ajoute une bulle dans le cercle conteneur
                var $bubble = $("<div class='bubble' data-type='"+index+"'></div>");
                $bubble.css("left", startLeft + (Math.cos(self.utils.toRadians(incBubble*angleShift)) * radius))
                        .css("top", startTop + (Math.sin(self.utils.toRadians(incBubble*angleShift)) * radius))
                        .attr("data-openaccess", prod.openAccess)
                        .attr("data-id", prod.id);
                $packcircle.append($bubble);
                incBubble += 1;

                // si l'incrémenteur du nombre de bulles est supérieur au nombre de bulles max que le cercle conteneur peut contenir je réinitialise les paramètres en aggrandissant le cercle conteneur de la valeur rowShiftRadius
                if(incBubble > maxBubbles){
                    incBubble = 0;
                    radius += self.rowShiftRadius;
                    perimeter = 2 * Math.PI * radius;
                    maxBubbles = Math.floor(perimeter / 10);
                    angleShift = 360/maxBubbles;
                }
            });
        });
    },

    /*
        Update de la vue "Type de Production" - avec un seul cercle
    */
    updateProductionTypeView:function(){
        var self = this;
        $("#ProductionsView").removeClass("displayed");
        $("#ProductionTypeView").addClass("displayed");
        $("#ProductionTypeByDomainView").removeClass("displayed");
        if(this.selectedType == "publication"){
            $(".block_productiontype").addClass("displayed")
                                        .html("Afficher les publications par domaines de recherche");
        }
        else $(".block_productiontype").removeClass("displayed");

        var $packcircle = $(".typepackcircle");
        $packcircle.empty();
        var startLeft = $packcircle.width()/2;
        var startTop = $packcircle.height()/2;

        var radius = self.startRadius;
        var perimeter = 2 * Math.PI * radius;
        var maxBubbles = Math.floor(perimeter / 10);
        var angleShift = 360/maxBubbles;
        var incBubble = 0;

        _.each(this.filteredProductions, function(prod){
            var $bubble = $("<div class='bubble' data-type='"+self.selectedType+"'></div>");
            $bubble.css("left", startLeft + (Math.cos(self.utils.toRadians(incBubble*angleShift)) * radius))
                    .css("top", startTop + (Math.sin(self.utils.toRadians(incBubble*angleShift)) * radius))
                    .attr("data-openaccess", prod.openAccess)
                    .attr("data-id", prod.id);
            $packcircle.append($bubble);

            incBubble += 1;
            if(incBubble > maxBubbles){
                incBubble = 0;
                radius += self.rowShiftRadius;
                perimeter = 2 * Math.PI * radius;
                maxBubbles = Math.floor(perimeter / 10);
                angleShift = 360/maxBubbles;
            }
        });
    },

    /*
        Update de la vue production par domaine - Utilisé pour les publications avec les groupes de cercles par domaines
    */
    updateProductionTypeByDomainView:function(){
        var self = this;

        $("#ProductionsView").removeClass("displayed");
        $("#ProductionTypeView").removeClass("displayed");
        $("#ProductionTypeByDomainView").addClass("displayed");

        if(this.selectedType == "publication"){
            $(".block_productiontype").addClass("displayed")
                                        .html("Masquer les publications par domaines de recherche")
        }
        else $(".block_productiontype").removeClass("displayed");

        $(".domainpackcircle").empty();
        var domainedGroupProductions = _.groupBy(this.filteredProductions, function(prod){
            return prod.domain;
        });

        _.each(domainedGroupProductions, function(group, index){
            var $packcircle = $(".domainpackcircle[data-domain='"+index+"']");
            var startLeft = $packcircle.width()/2;
            var startTop = $packcircle.height()/2;

            var radius = self.startRadius;
            var perimeter = 2 * Math.PI * radius;
            var maxBubbles = Math.floor(perimeter / 10);
            var angleShift = 360/maxBubbles;
            var incBubble = 0;

            _.each(group, function(prod){
                var $bubble = $("<div class='bubble' data-type='"+index+"'></div>");
                $bubble.css("left", startLeft + (Math.cos(self.utils.toRadians(incBubble*angleShift)) * radius))
                        .css("top", startTop + (Math.sin(self.utils.toRadians(incBubble*angleShift)) * radius))
                        .attr("data-openaccess", prod.openAccess)
                        .attr("data-type", prod.type)
                        .attr("data-id", prod.id);
                $packcircle.append($bubble);

                incBubble += 1;
                if(incBubble > maxBubbles){
                    incBubble = 0;
                    radius += self.rowShiftRadius;
                    perimeter = 2 * Math.PI * radius;
                    maxBubbles = Math.floor(perimeter / 10);
                    angleShift = 360/maxBubbles;
                }
            });

            $packcircle.append("<div class='packcircle_legend'><div class='packcircle_cardinal'>"+group.length+"</div><div class='packcircle_label'>Domaine "+index+"</div></div>");
        });
    },

    /*
        Filtrage des productions en fonction des paramètres choisis par l'utilisateur
    */
    filterProductions:function(){
        var self = this;

        this.filteredProductions = [];

        var toAppend = true;
        _.each(this.productions, function(prod){
            toAppend = true;
            if(prod.year > self.selectedEndYear || prod.year < self.selectedBeginYear){
                toAppend = false;
            }else{
                if(self.selectedType !== "_"){
                    if(prod.type !== self.selectedType){
                        toAppend = false;
                    }
                }
            }

            if(toAppend) self.filteredProductions.push(prod);
        });

        this.groupedProductions = _.groupBy(this.filteredProductions, function(prod){
            return prod.type;
        });
    },

    /*
        Événements js sur les éléments interactifs de l'app
    */
    bindEvents:function(){
    	var self = this;
        console.log("bindEvents");
        $(".tooltip_closebt").on("click", function(){
            self.$Tooltip.removeClass("displayed");
        });

        $("#App").on("click", ".bubble", function(){
            self.displayTooltip($(this).attr("data-id"));
        });

        $(".menu_typebt").on("click", function(){
            var dataType = $(this).attr("data-type");
            if(self.selectedType !== dataType){
                self.selectedType = dataType;
            }else{
                self.selectedType = "_";
            }

            self.update();
        });

        $(".block_productiontype").on("click", function(){
            self.isByDomain = !self.isByDomain;
            App.update();
        });
    },

    /*
        Affichage de la tooltip d'une prodution
    */
    displayTooltip:function(productionID){
        console.log("displayTooltip", productionID, this.productions[productionID]);
        this.$Tooltip.find(".tooltip_title").html(this.productions[productionID].title);
        this.$Tooltip.find(".author_value").html(this.productions[productionID].author);
        this.$Tooltip.find(".date_value").html(this.productions[productionID].year);
        this.$Tooltip.addClass("displayed");
    },

};

module.exports = App;
window.App = App;