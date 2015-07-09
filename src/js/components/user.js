/*
 * A generic class that lazy-loads User info
 */
define([
  'backbone',
  'js/components/api_request',
  'js/components/api_targets',
  'js/components/generic_module',
  'js/mixins/dependon',
  'js/mixins/hardened',
  'js/components/api_feedback'
  ],
 function(
   Backbone,
   ApiRequest,
   ApiTargets,
   GenericModule,
   Dependon,
   Hardened,
   ApiFeedback) {

 var SettingsModel, UserModel, Config, UserCollection, User;

// user.model; stores any variables disconnected from accounts endpoints
//stored in Persistent Storage for now
 SettingsModel = Backbone.Model.extend({
    defaults : function(){
      return {
        isOrcidModeOn : false
      }
    }
  });

//for the User Collection
 UserModel = Backbone.Model.extend({
    idAttribute : "target"
    });

  //all the targets that the user object needs to know about for storing data in its collection
  //the endpoint is the key in api_targets
  //this doesn't have the targets necessary to post data to (e.g. "change_password")
  Config = [
    {target : "TOKEN"},
    {target : "USER"},
    {target : "USER_DATA"}
    ];

  UserCollection = Backbone.Collection.extend({

    model : UserModel,

    initialize : function(Config, options){
      if (!Config){
        throw new Error("no user endpoints provided");
      }
    }
  });

  User = GenericModule.extend({

    initialize : function(options){
      //model is for settings that don't have an accounts target
      this.model = new SettingsModel();
      //each entry in the collection corresponds to an target
      this.collection = new UserCollection(Config);

      _.bindAll(this, "completeLogIn", "completeLogOut");

      //set base url, currently only necessary for change_email endpoint
      this.base_url = this.test ? "location.origin" : location.origin;

      this.listenTo(this.collection, "change", this.broadcastChange);
      this.listenTo(this.collection, "reset", this.broadcastReset);

      this.buildAdditionalParameters();
    },

    activate: function (beehive) {
      this.setBeeHive(beehive);
      this.setPubSub(beehive);
      this.key = this.getPubSub().getPubSubKey();

      var storage = beehive.getService('PersistentStorage');
      if (storage) {
        var prefs = storage.get('UserPreferences');
        if (prefs) {
          this.model.set(prefs);
        }
      }
    },

    /* orcid functions */
    setOrcidMode : function(val){
      if (!this.hasBeeHive())
        return;

      this.model.set("isOrcidModeOn", val);
      if (_.has(this.model.changedAttributes(), "isOrcidModeOn")){
        this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "orcidUIChange", this.model.get("isOrcidModeOn"));
      }
      this._persistModel();
    },

    isOrcidModeOn : function(){
      return this.model.get("isOrcidModeOn");
    },

    //XXX a quick hack
    _persistModel: function() {
      var beehive = this.getBeeHive();
      var storage = beehive.getService('PersistentStorage');
      if (storage) {
        storage.set('UserPreferences', this.model.attributes);
      }
    },

    /* general functions */

    //every time something in the collection changes
    // tell subscribing widgets that something has changed, and tell them which
    // endpoint the change belonged to
    //finally, check if logged in, might have to redirect to auth page/settings page
    broadcastChange : function(model){
      this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "user_info_change", model.get("target"), model.toJSON());
      this.redirectIfNecessary();
    },

    broadcastReset : function(){
      this.collection.each(function(model){
        this.getPubSub().publish(this.pubsub.USER_ANNOUNCEMENT, "user_info_change", model.get("target"), model.toJSON());
      }, this);
      this.redirectIfNecessary();
    },

    handleSuccessfulGET : function(response, status, jqXHR){
      var target = jqXHR.target;
      this.collection.get(target).set(response);
      //the change event on the collection will notify widgets
    },

    handleFailedGET : function(jqXHR, status, errorThrown){
      this.getPubSub().publish(this.pubsub.USER_ANNOUNCEMENT, "data_get_unsuccessful", jqXHR.target);
    },

    // so handleSuccessfulPOST can call the right callback depending on the target
    callbacks : {
      "TOKEN" : function changeTokenSuccess(response, status, jqXHR){
        this.collection.get("TOKEN").set(response);
        this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "data_post_successful", "TOKEN");
      },
      "CHANGE_EMAIL" : function ChangeEmailSuccess(response, status, jqXHR){
        this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "data_post_successful", "CHANGE_EMAIL");
      },
      "CHANGE_PASSWORD" : function changePasswordSuccess(response, status, jqXHR){
        this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "data_post_successful", "CHANGE_PASSWORD");
      },
      "DELETE" : function deleteAccountSuccess(response, status, jqXHR){
        this.getPubSub().publish(this.getPubSub().USER_ANNOUNCEMENT, "delete_account_successful", "DELETE");
        this.completeLogOut();
      },
      "USER_DATA" : function UserDataChange (response, status, jqXHR){
        //update the collection data with the response (which holds the changed key-value pairs)
        this.collection.get("USER_DATA").set(response);
      }
    },

    handleSuccessfulPOST : function(response, status, jqXHR) {
      this.callbacks[jqXHR.target].call(this, response, status, jqXHR);
    },

    buildAdditionalParameters : function() {
      //any extra info that needs to be sent in post or get requests
      //but not known about by the widget models goes here
      //this will be called by user.initialize
      var additional = {};
          additional.CHANGE_EMAIL = { verify_url : this.base_url + "/#user/account/verify/change-email"};

      this.additionalParameters = additional;
    },


    handleFailedPOST : function(jqXHR, status, errorThrown){
      var target = jqXHR.target;
      var pubsub = this.getPubSub();
      var error = (jqXHR.responseJSON && jqXHR.responseJSON.error) ? jqXHR.responseJSON.error : "error unknown";

      var message = 'User update was unsuccessful (' + error + ')';
      pubsub.publish(pubsub.USER_ANNOUNCEMENT, "data_post_unsuccessful", target);
      pubsub.publish(pubsub.ALERT, new ApiFeedback({code: 0, msg: message, type : "danger"}));
    },

   fetchData : function(target){
      this.composeRequest(target, "GET");
    },

    /*POST data to endpoint: accessible through facade*/
    postData: function (target, data, options) {
      //make sure it has a callback to access later
      if (!this.callbacks[target]){
        throw new Error("a POST request was made that doesn't have a success callback");
      }
      if (this.additionalParameters[target]){
        _.extend(data, this.additionalParameters[target]);
      }
      return this.composeRequest(target, "POST", data, options);
    },

    /*PUT data to pre-existing endpoint: accessible through facade */
    putData: function (target, data, options) {
      //make sure it has a callback to access later
      if (!this.callbacks[target]){
        throw new Error("a PUT request was made that doesn't have a success callback");
      }
      if (this.additionalParameters[target]){
        _.extend(data, this.additionalParameters[target]);
      }
      return this.composeRequest(target, "PUT", data, options);
    },

    /*return read-only copy of user model(s) for widgets: accessible through facade */
    getUserData : function(target){
      var data = {}, collection;
      if (target){
        data = _.omit(this.collection.get(target).toJSON(), "target");
        return JSON.parse(JSON.stringify(data));
      }
      else {
        /*return a data structure with the keys as the target title
         (e.g. "Target") and the values all values for the target, with the target itself removed
         */
        collection = this.collection.toJSON();
        _.each(collection, function(c){
          data[c.target] = _.omit(c, "target");
        });
        return JSON.parse(JSON.stringify(data));
      }
    },

    getUserName : function(){
        return  this.collection.get("USER").get("user");
    },

    isLoggedIn : function(){
        return !!this.collection.get("USER").get("user");
    },

    /*
    * POST an update to the myads user_data endpoint
    * (success will automatically update the user object's model of myads data)
    * */

    setMyADSData : function(data){
      return this.postData("USER_DATA", data);
    },

    /*
    * a convenience method for accessing the collection of user data
    * and only getting the myads data back, either all of it or specific values
    * */

    getMyADSData : function(keys){

      keys = keys && !_.isArray(keys) ? [keys] : keys;
      if (keys){
        return _.pick(this.getUserData("USER_DATA"), keys);
      }
      else {
        return this.getUserData("USER_DATA");
      }
    },

    /*
    * this function queries the myads open url configuration endpoint
    * and returns a promise that it resolves with the data
    * (it is only needed by the preferences widget)
    * */

    getOpenURLConfig : function(){
      var deferred = $.Deferred();

      function done (data){
        deferred.resolve(data);
      };

      function fail(data){
        deferred.reject(data);
      };

       var request = new ApiRequest({
          target : ApiTargets["OPENURL_CONFIGURATION"],
          options : {
            type: "GET",
            done: done,
            fail: fail
          }
        });

     this.getBeeHive().getService("Api").request(request);
     return deferred.promise();

    },

    /*
     * every time a csrf token is required, app storage will request a new token,
     * so it allows you to attach callbacks to the promise it returns
     * */
    sendRequestWithNewCSRF : function(callback){
      callback = _.bind(callback, this);
      this.getBeeHive().getObject("CSRFManager").getCSRF().done(callback);
    },


    composeRequest : function (target, method, data, options) {
      var request, endpoint;
      //using "endpoint" to mean the actual url string
      endpoint = ApiTargets[target];

      //get data from the relevant model based on the endpoint
      data = data || undefined;
      options = options || {};
      //allow caller to provide a done method if desired, otherwise go with the standard ones
      //handleSuccessFulPost is currently also being called for "put" method calls; I should change the name
      var done = options.done || (method == "GET" ? this.handleSuccessfulGET : this.handleSuccessfulPOST);
      var fail = options.fail || (method == "GET" ? this.handleFailedGET : this.handleFailedPOST);

      //it came from a form, needs to have a csrf token
      if (options.csrf){

        this.sendRequestWithNewCSRF(function(csrfToken){

          request = new ApiRequest({
            target : endpoint,
            options : {
              context : this,
              type: method,
              data: JSON.stringify(data),
              contentType : "application/json",
              headers : {'X-CSRFToken' :  csrfToken },
              done: done,
              fail : fail,
              //record the endpoint & data
              beforeSend: function(jqXHR, settings) {
                jqXHR.target = target;
                jqXHR.data = data;
              }
            }
          });
          this.getBeeHive().getService("Api").request(request);
        });
      }

      else {
        request = new ApiRequest({
          target : endpoint,
          options : {
            context : this,
            type: method,
            data: JSON.stringify(data),
            contentType : "application/json",
            done: done,
            fail : fail,
            //record the endpoint & data
            beforeSend: function(jqXHR, settings) {
              jqXHR.target = target;
              jqXHR.data = data;
            }
          }
        });
        this.getBeeHive().getService("Api").request(request);
      }

    },

    //check if  logged in/logged out state has changed
    redirectIfNecessary : function(){
      var pubsub = this.getPubSub();
      if (this.getBeeHive().getObject("MasterPageManager").currentChild === "AuthenticationPage" && this.isLoggedIn()){
        pubsub.publish(pubsub.NAVIGATE, "index-page");
      }
      else  if (this.getBeeHive().getObject("MasterPageManager").currentChild === "SettingsPage" && !this.isLoggedIn()){
        pubsub.publish(pubsub.NAVIGATE, "authentication-page");
      }
    },

    //this function is called immediately after the login is confirmed
    completeLogIn : function(){
        //fetch all user data
        var targets = this.collection.pluck("target");
        //don't get data from user endpoint, it's no longer supported
        targets = _.without(targets, "USER");
        _.each(targets, function(e){
          this.fetchData(e);
        }, this);
    },

    setUser : function(username){
      this.collection.get("USER").set("user", username);
      //fetch rest of data
      this.completeLogIn();
    },

   //this function is called immediately after the logout is confirmed
    completeLogOut : function(){
      // should the setting model be cleared?
      this.model.clear();
      //this clears the username at target = "USER", which is the cue that we are no longer signed in
      this.collection.reset(Config);
    },

    hardenedInterface: {
      completeLogIn : "sync user object with database",
      completeLogOut: "clear user object",
      isLoggedIn: "whether the user is logged in",
      postData: "POST new values to user endpoint (params: endpoint, data)",
      putData: "PUT new values to endpoint (params: endpoing, data)",
      getUserData: "get a copy of user data currently in the model for an endpoint, or all user data (params: optional endpoint)",
      getUserName: "get the user's email before the @",
      isOrcidModeOn : "figure out if user has Orcid mode activated",
      setOrcidMode : "set orcid ui on or off",
      setUser : "set the username to log the user in and fetch his/her info",

      getOpenURLConfig : "get list of openurl endpoints",
      setMyADSData : "",
      getMyADSData : ""
    }

  });

  _.extend(User.prototype, Hardened, Dependon.BeeHive, Dependon.App, Dependon.PubSub);

  return User;

});