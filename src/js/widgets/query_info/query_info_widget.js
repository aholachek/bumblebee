define(['marionette',
    'backbone',
    'underscore',
    'js/components/api_request',
    'js/components/api_query',
    'js/widgets/base/base_widget',
    'hbs!./query_info_template',
    'hbs!./feedback-template',
    'hbs!./library-options',
    'js/mixins/formatter',
    'bootstrap',
    'js/components/api_feedback'
  ],

  function(Marionette,
           Backbone,
           _,
           ApiRequest,
           ApiQuery,
           BaseWidget,
           queryInfoTemplate,
           FeedbackTemplate,
           LibraryOptionsTemplate,
           FormatMixin,
           Bootstrap,
           ApiFeedback
    ) {


    var QueryModel = Backbone.Model.extend({

      defaults: {
        numFound: 0,
        selected: 0,
        fq: undefined,
        //for libraries
        libraryDrawerOpen : false,
        //for rendering library select
        libraries : [],
        loggedIn : false
      }
    });

    var QueryDisplayView = Marionette.ItemView.extend({

   	  className : "query-info-widget s-query-info-widget",
      template: queryInfoTemplate,

      serializeData : function(){
        var data = this.model.toJSON();
        data.numFound = this.formatNum(data.numFound);
        data.selected = this.formatNum(data.selected);
        return data;
      },

      modelEvents : {
        "change:numFound" : "render",
        "change:selected" : "render",
        "change:fq" : "render",
        "change:showFilter" : "render",
        "change:loggedIn" : "render",
        "change:libraries" : "renderLibraries"
      },

      triggers : {
        "click .clear-selected" : "clear-selected",
        "click .page-bulk-add" : "page-bulk-add"
      },

      events : {
        "click .show-filter" : function(){
          this.model.set("showFilter", true);
        },
        "click .hide-filter" : function(){
          this.model.set("showFilter", false);
        },

        "click .library-add-title" : "toggleLibraryDrawer",
        "click .submit-add-to-library" : "libraryAdd",
        "click .submit-create-library" : "libraryCreate"
      },

      libraryAdd : function(){
        var data = {};

        data.libraryID = this.$("#library-select").val();

        if (this.model.get("selected")){
          data.recordsToAdd = this.$("#all-vs-selected").val();
        } else {
          data.recordsToAdd = "all";
        }
        this.trigger("library-add", data);
      },

      libraryCreate : function(){
        var data = {};

        if (this.model.get("selected")){
          data.recordsToAdd = this.$("#all-vs-selected").val();
        } else {
          data.recordsToAdd = "all";
        }

        data.name = $("input[name='new-library-name']").val().trim();

        this.trigger("library-create", data);
      },

      toggleLibraryDrawer : function(){
        this.model.set("libraryDrawerOpen", !this.model.get("libraryDrawerOpen"), {silent : true});
      },

      onRender : function(){
        this.$(".icon-help").popover({trigger: "hover", placement: "right", html: true});
        this.renderLibraries();
      },

      renderLibraries : function(){
        this.$(".libraries-container").html(LibraryOptionsTemplate(this.model.toJSON()));
      }

    });

    _.extend(QueryDisplayView.prototype, FormatMixin);


    var Widget = BaseWidget.extend({

      initialize: function(options) {
        this.model = new QueryModel();
        this.view = new QueryDisplayView({model : this.model});
        BaseWidget.prototype.initialize.call(this, options)
      },

      viewEvents : {
        "clear-selected" : "clearSelected",
        "page-bulk-add" : "triggerBulkAdd",
        "library-add" : "libraryAddSubmit",
        "library-create" : "libraryCreateSubmit"
      },

      activate: function(beehive) {
        this.beehive = beehive;
        _.bindAll(this);
        this.pubsub = beehive.getService('PubSub');
        var pubsub = this.pubsub, that = this;

        pubsub.subscribe(pubsub.STORAGE_PAPER_UPDATE, this.onStoragePaperChange);
        pubsub.subscribe(pubsub.FEEDBACK, this.processFeedback);
        pubsub.subscribe(pubsub.LIBRARY_CHANGE, this.processLibraryInfo);
        pubsub.subscribe(pubsub.USER_ANNOUNCEMENT, this.handleUserAnnouncement);

      },

      handleUserAnnouncement : function(event, target, arg2){
        if (event == "user_info_change" && target == "USER"){
          var loggedIn = this.beehive.getObject("User").isLoggedIn();
          this.model.set({ loggedIn: loggedIn});
        }
      },

      onStoragePaperChange : function(numSelected){
       this.model.set("selected", numSelected);
      },

      processLibraryInfo : function(listOfLibraries){
       this.model.set("libraries", listOfLibraries);
     },

      clearSelected : function(){
        this.beehive.getObject("AppStorage").clearSelectedPapers();
      },

      triggerBulkAdd : function(){
        this.pubsub.publish(this.pubsub.CUSTOM_EVENT, "add-all-on-page");
      },

      libraryAddSubmit : function(data){
        var that = this, options = {};
        options.library = data.libraryID;
        //are we adding the current query or just the selected bibcodes?
        options.bibcodes = data.recordsToAdd;

        var name = _.findWhere(this.model.get("libraries"), {id : data.libraryID }).name;

        //this returns a promise
        this.beehive.getObject("LibraryController").addBibcodesToLib(options)
          .done(function(response, status){
            if (status == "error"){
              this.$(".feedback").html(FeedbackTemplate({error : true, name : name, id : data.libraryID }))
            }
            else if (status == "success"){
              this.$(".feedback").html(FeedbackTemplate({
                success : true,
                name : name,
                id : response.id,
                numRecords: response.number_added
              }))

            }
          })
          .fail();

      },

      libraryCreateSubmit : function(data){
        var that = this, options = {};
        //are we adding the current query or just the selected bibcodes?
        options.bibcodes = data.recordsToAdd;
        options.name = data.name;
        this.beehive.getObject("LibraryController").createLibAndAddBibcodes(options)
          .done(function(response, status){
            if (status == "error"){
              this.$(".feedback").html(FeedbackTemplate({ error : true, name : data.name, create : true }));
            }
            else if (status == "success"){
              this.$(".feedback").html(FeedbackTemplate({
                  create: true,
                  success : true,
                  name : data.name,
                  id : response.id,
                  numRecords : response.bibcode.length
            }));
            }
          })
          .fail();

        //handle success or failure here

      },

      processFeedback: function(feedback) {
        switch (feedback.code) {
          case ApiFeedback.CODES.SEARCH_CYCLE_STARTED:
            var q = feedback.query.clone();
            var filters = [];
            _.each(q.keys(), function(k) {
              if (k.substring(0,2) == 'fq') {
                _.each(q.get(k), function(v) {
                  if (v.indexOf('{!') == -1) {
                    filters.push(v);
                  }
                });
              }
            });
            this.view.model.set("fq", filters);
            break;
        }

      }

    });

    return Widget

  });