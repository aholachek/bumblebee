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
        orcidLoggedIn : false,
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
      "click .orcid-link" : "navigate-to-orcid-link",
      "click .orcid-logout" : "logout-only-orcid"
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
    this.model.set("orcidModeOn", true);
     //need to explicitly trigger to widget that this has changed
     //otherwise it will be ignored, since it can also be changed
     //from outside
     this.trigger("user-change-orcid-mode");
    },

    changeOrcidMode : function() {
      var that = this;
      //allow animation to run before rerendering
      setTimeout(function(){

        if (that.$(".orcid-mode").is(":checked")){
          that.model.set("orcidModeOn", true);
        }
        else {
          that.model.set("orcidModeOn", false);
        }

        //need to explicitly trigger to widget that this has changed
        //otherwise it will be ignored, since it can also be changed
        //from outside
        that.trigger("user-change-orcid-mode");

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
      //dealing with authentication/user
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
        //log the user out of both the session and orcid
        this.beehive.getObject("Session").logout();
        this.orcidLogOut();
      },

      //dealing with orcid
      "navigate-to-orcid-link" : "navigateToOrcidLink",
      "user-change-orcid-mode" : "toggleOrcidMode",
      "logout-only-orcid" : "orcidLogOut"
    },
    //to set the correct initial values for signed in statuses
    setInitialVals : function(){
      var user = this.beehive.getObject("User");
      var orcidApi = this.beehive.getService("OrcidApi");
      this.model.set({orcidModeOn : user.isOrcidUIOn(), orcidLoggedIn:  orcidApi.hasAccess()});
      this.model.set("currentUser",  user.getUserName());
    },
 
    handleUserAnnouncement : function(msg, data){

      var user = this.beehive.getObject("User");
      var orcidApi = this.beehive.getService("OrcidApi");

      if (msg === "user_info_change" &&  data === "USER"){
        //if user logs out, username will be undefined
        this.model.set("currentUser",  this.beehive.getObject("User").getUserName());
      }
      else if (msg == 'orcidUIChange') {
        this.model.set({orcidModeOn : user.isOrcidUIOn(), orcidLoggedIn:  orcidApi.hasAccess()});
      }
    },

    //we don't want to respond to changes from pubsub or user object with this,
    //only changes that the user has initiated using the navbar widget,
    //otherwise things will be toggled incorrectly
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

    navigateToOrcidLink : function(){
      this.pubsub.publish(this.pubsub.NAVIGATE, "orcid-page")
    },

    orcidLogOut : function() {
      this.beehive.getService("OrcidApi").signOut();
      this.beehive.getObject("user").setOrcidMode(false);
    }

  });

  return NavWidget;

});