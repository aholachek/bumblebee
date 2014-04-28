define(['marionette', 'js/components/api_query',  'js/widgets/base/base_widget',
 'hbs!./templates/search_bar_template', 'bootstrap'], 
 function(Marionette, ApiQuery, BaseWidget, SearchBarTemplate) {

  $.fn.selectRange = function(start, end) {
    if(!end) end = start; 
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};


  var SearchBarView = Marionette.ItemView.extend({

    template: SearchBarTemplate,

    initialize: function() {},

    events: {
      "click .search-submit": "submitQuery",
      "click .field-options button": "addField",
      "keypress .q": "checkSubmit"
    },

    checkSubmit : function(e){
      if (e.keyCode === 13) {
        this.submitQuery();
      }

    },

    addField: function(e) {

      var currentVal, newVal;

      var df = $(e.target).attr("data-field");

      if (df.split("-")[0] === "operator") {

        currentVal = this.$(".q").val();
        if (currentVal !== "") {
          newVal = df.split("-")[1] + ":(" + currentVal + ")";
          this.$(".q").val(newVal);
        } else {
          this.$(".q").val(df.split("-")[1] + ":( )");
        }

      } else {

        currentVal = this.$(".q").val();
        newVal = currentVal + " " + df + ":\"\"";
        this.$(".q").val(newVal);
      }
      this.$(".q").focus()
      this.$(".q").selectRange(newVal.length-1)
      
    },

    submitQuery: function() {
      var query = (this.$(".q").val());
      this.trigger("new_query", query)
    }

  })

  var SearchBarWidget = BaseWidget.extend({

    subscribeCustomHandlers : function(){

      this.pubsub.subscribe(this.pubsub.INVITING_REQUEST, this.updateCurrentQuery);
    },

    initialize: function(options) {
      _.bindAll(this, "updateCurrentQuery");
      this.view = new SearchBarView();
      this.listenTo(this.view, "new_query", this.submitNewQuery);

      BaseWidget.prototype.initialize.call(this, options)
    },

    updateCurrentQuery : function(apiQuery){
      this.setCurrentQuery(apiQuery);
    },

    submitNewQuery: function(query) {
      var queryToSend = this.customizeQuery({q: query})
      this.pubsub.publish(this.pubsub.NEW_QUERY, queryToSend);
    }
  })


  return SearchBarWidget;


});
