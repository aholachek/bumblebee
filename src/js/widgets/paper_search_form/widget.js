define([
  "js/widgets/base/base_widget",
  "js/components/api_query",
  "hbs!./form",
  "./topterms",
  "jquery-ui"
], function(
  BaseWidget,
  ApiQuery,
  FormTemplate,
  AutocompleteData,
  JQueryUI
  ){


  var FormView = Marionette.ItemView.extend({

    template : FormTemplate,

    className : "paper-search-form",

    events: {
      "keyup .paper-form input" : "checkPaperFormDisabled",
      "click .paper-form button[type=submit]" : "submitPaperForm",

      "keyup .bibcode-form textarea" : "checkBibcodeFormDisabled",
      "click .bibcode-form button[type=submit]" : "submitBibcodeForm"
    },

    onRender : function(e){
      this.$("#pub-input").autocomplete({ source : AutocompleteData, minLength : 2 , autoFocus : true });
    },

    checkPaperFormDisabled : function(){
      //require at least 1 character to be in at least 1 input field
      var fields= this.$("input:not(.parse-reference)").map(function(){
        return $(this).val();
      }).get();

      if (fields.join("").match(/\w+/)){
        this.$(".paper-form button[type=submit]").prop("disabled", false);
      }
      else {
        this.$(".paper-form button[type=submit]").prop("disabled", true);
      }
    },

    checkBibcodeFormDisabled : function(){

      if (this.$(".bibcode-form textarea").val().match(/\w+/)){
        this.$(".bibcode-form button[type=submit]").prop("disabled", false);
      }
      else {
        this.$(".bibcode-form button[type=submit]").prop("disabled", true);
      }
    },

    submitPaperForm : function(e){

      this.$(".paper-form button[type=submit]").html('<i class="icon-loading"/>  Loading...')

      var terms = this.$(".paper-form input:not(.parse-reference)").map(function(){
        var $t = $(this);
        $t.val() ? toReturn = $t.data("term") + ":" + $t.val() : toReturn =  undefined;
        return toReturn;
      }).get();

      terms = _.filter(terms, function(t){if (t){return t}});

      this.trigger("submit", terms.join(" "));
      e.preventDefault();
    },

    submitBibcodeForm : function(e){

      this.$(".bibcode-form button[type=submit]").html('<i class="icon-loading"/>  Loading...');

      var terms = this.$(".bibcode-form textarea").val().split(/\s+/);

      terms = _.filter(terms, function(t){if (t){return t}});

      this.trigger("submit", "bibcode:(" + terms.join(" OR ") + ")");

      e.preventDefault();
    }


  });

  FormWidget = BaseWidget.extend({

    initialize: function (options) {

      options = options || {};
      this.view = new FormView();
      this.listenTo(this.view, "submit", this.submitForm);

    },

    activate: function (beehive) {
      this.setBeeHive(beehive);
      this.pubsub = beehive.Services.get('PubSub');
    },

    onShow : function(){
      //fresh form
      this.view.render();
    },

    submitForm : function(query){

      var newQuery = new ApiQuery({
        q: query
      });

      this.pubsub.publish(this.pubsub.START_SEARCH, newQuery);

    },

    onShow : function(){
      //wipe out any previously filled in parts
      this.render();
      this.view.$("input#pub-input").focus();
    }

  });

  return FormWidget;

})