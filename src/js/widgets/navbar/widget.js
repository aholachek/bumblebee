define([
  'marionette',
  'js/widgets/base/base_widget',
  'hbs!./template/navbar',
  'bootstrap'
], function(
  Marionette,
  BaseWidget,
  NavBarTemplate
  ){

  var NavView, NavModel, NavWidget;

  NavModel = Backbone.Model.extend({
    defaults : function(){
      return {
        orcidModeOn : false,
        orcidLoggedIn : false
        currentUser  : undefined
      }
    }
  });

  NavView = Marionette.ItemView.extend({

    template : NavBarTemplate,

    modelEvents : {
      change: "render"
    },

    triggers : {
      "click .login" : "navigate-login",
      "click .register": "navigate-register",
      "click .settings" : "navigate-settings",
      "click .logout" : "logout",
      "click .orcid-link" : "navigate-to-orcid-link"
    },

    events : {
      "click .orcid-dropdown ul" : "stopPropagation",
      "click button.orcid-sign-in" : "orcidSignIn",
      "change .orcid-mode" : "changeOrcidMode",
      'click li.ads button.sign-out': 'adsSignout'
    },

    modelEvents: {
      'change': 'render'
    },

    stopPropagation : function(e) {
     if (e.target.tagName === "button"){
       return
    }
      else {
       e.stopPropagation();
     }
    },

    orcidSignIn : function(){
    this.model.set("uiOrcidModeOn", true);
    },


    changeOrcidMode : function() {
      var that = this;
      //allow animation to run before rerendering
      setTimeout(function(){

        if (that.$(".orcid-mode").is(":checked")){
          that.model.set("uiOrcidModeOn", true);
        }
        else {
          that.model.set("uiOrcidModeOn", false);
        }

        that.render();
      }, 400);
    }
  });

  NavWidget = BaseWidget.extend({

    initialize: function (options) {
      options = options || {};
      this.model = new NavModel();
      this.view = new NavView({model: this.model});
      BaseWidget.prototype.initialize.apply(this, arguments);
    },

    activate: function (beehive) {
      _.bindAll(this, ["handleUserAnnouncement"]);
      this.beehive = beehive;
      this.pubsub = beehive.getService("PubSub");
      this.pubsub.subscribe(this.pubsub.USER_ANNOUNCEMENT, _.bind(this.handleUserAnnouncement, this));
      this.setInitialVals();
    },

    viewEvents : {
      "navigate-login" : function(){
        this.pubsub.publish(this.pubsub.NAVIGATE, "authentication-page", {subView: "login"});
      },
      "navigate-register" : function(){
        this.pubsub.publish(this.pubsub.NAVIGATE, "authentication-page", {subView: "register"});
      },
      "navigate-settings" : function() {
        this.pubsub.publish(this.pubsub.NAVIGATE, "settings-page");
      },
      "logout" : function(){
        //log the user out
        this.beehive.getObject("Session").logout();
      }
    },
    //to set the correct initial values for signed in statuses
    setInitialVals : function(){
      var user = this.getBeeHive().getObject("User");
      var orcidApi = this.getBeeHive().getService("OrcidApi");
      this.model.set({orcidModeOn : user.isOrcidModeOn(), orcidLoggedIn:  orcidApi.hasAccess()};
      this.model.set("currentUser",  this.beehive.getObject("User").getUserName());
    },

 
    handleUserAnnouncement : function(msg, data){

      var user = this.getBeeHive().getObject("User");
      var orcidApi = this.getBeeHive().getService("OrcidApi");

      if (msg === "user_info_change" &&  data === "USER"){
        //if user logs out, username will be undefined
        this.model.set("currentUser",  this.beehive.getObject("User").getUserName());
      }

      else if (msg == 'orcidUIChange') {
        var orcidApi = this.getBeeHive().getService("OrcidApi");
        this.model.set({orcidModeOn : user.isOrcidModeOn(), orcidLoggedIn:  orcidApi.hasAccess()});
      }
    },

    viewEvents : {
      'ads-signout': 'signOut',
      "navigate-to-orcid-link" : "navigateToOrcidLink"

    },

    modelEvents : {
      "change:orcidModeOn" :"toggleOrcidMode"
    },

    toggleOrcidMode : function() {
      var user = this.beehive.getObject('User'),
        orcidApi = this.beehive.getService("OrcidApi");

      var newVal = this.model.get("orcidModeOn");
      user.setOrcidMode(newVal);

      if (newVal){
        //sign into orcid api if not signed in already
        if (!orcidApi.hasAccess() ){
          orcidApi.signIn();
        }
      }
    },

    signOut: function() {
      var user = this.getBeeHive().getObject('User'),
        orcidApi = this.getBeeHive().getService("OrcidApi");

      if (orcidApi)
        orcidApi.signOut();

      user.setOrcidMode(false);
    },


    navigateToOrcidLink : function(){
      this.pubsub.publish(this.pubsub.NAVIGATE, "orcid-page")
    }

  });

  return NavWidget;

});