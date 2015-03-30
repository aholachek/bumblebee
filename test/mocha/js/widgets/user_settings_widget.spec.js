define([
  'js/widgets/user_settings/widget',
  'js/bugutils/minimal_pubsub',
  'js/components/user',
  'js/components/session'
], function(
  UserSettings,
  MinSub,
  User,
  Session

  ){

  describe("User Settings Widget", function(){

    afterEach(function(){
      $("#test").empty();
    });


    it("should consist of a Marionette layout that shows the correct subview based on the model with the 'active' attr in its navCollection", function(){

      var u = new UserSettings();

      $("#test").append(u.render().el );

      var minsub = new (MinSub.extend({
        request: function (apiRequest) {}
      }))({verbose: false});

      var hardened = minsub.beehive.getHardenedInstance();
      sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}})

      var u = new UserSettings();
      u.activate(hardened);
      $("#test").append(u.view.render().el);

      //initial view should be empty
      //the subview is set by the navigator

      expect($("#test .content-container").html().trim()).to.eql('');

      u.setSubView("email");
      expect($("#test .content-container").find(".change-email").length).to.eql(1);

      u.setSubView("password");
      expect($("#test .content-container").find(".change-password").length).to.eql(1);

      u.setSubView("token");
      expect($("#test .content-container").find(".change-token").length).to.eql(1);

      u.setSubView("preferences");
      expect($("#test .content-container").find(".change-preferences").length).to.eql(1);

      u.setSubView("delete");
      expect($("#test .content-container").find(".delete-account").length).to.eql(1);


    });

      it("should allow the user to navigate to other options using the side nav", function(){

        var u = new UserSettings();

        $("#test").append(u.render().el );

        var minsub = new (MinSub.extend({
          request: function (apiRequest) {}
        }))({verbose: false});

        var hardened = minsub.beehive.getHardenedInstance();
        sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}});

        var u = new UserSettings();

        u.activate(hardened);
        var publishStub = sinon.stub(u.pubsub, "publish");
        $("#test").append(u.view.render().el);

        //get widget to render
        u.setSubView("email");

        var subViews = ["preferences", "email", "password", "token", "delete"];

        _.each(subViews,function(href){

          $("#test a[data-subpage=" + href + "]").click();

        });

        for (i = 0; i < subViews.length; i++ ){

          expect(publishStub.args[i]).to.eql([ "[Router]-Navigate-With-Trigger", "settings-page",  { "subView": subViews[i]} ]);

        }

      });


      it("should interactively validate form inputs, only allowing correctly filled forms to be submitted", function(){

        //testing only a single view-- is this ok?
        var minsub = new (MinSub.extend({
          request: function (apiRequest) {}
        }))({verbose: false});

        var hardened = minsub.beehive.getHardenedInstance();
        sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}})

        var u = new UserSettings();
        u.activate(hardened);
        $("#test").append(u.view.render().el);

        //testing form validation for change password page
        u.setSubView("password");

        var triggerStub = sinon.stub(u.view, "trigger");

        $("#test").find("input[name=old_password]").val("foo");
        $("#test").find("input[name=old_password]").trigger("change");
        expect($("#test").find("input[name=old_password]").parent().hasClass("has-success")).to.be.false;
        expect($("#test").find("input[name=old_password]").parent().hasClass("has-error")).to.be.false;

        $("#test").find("input[name=old_password]").val("Foooo5");
        $("#test").find("input[name=old_password]").trigger("change");
        expect($("#test").find("input[name=old_password]").parent().hasClass("has-success")).to.be.true;
        expect($("#test").find("input[name=old_pasword]").parent().hasClass("has-error")).to.be.false;

        $("#test").find("input[name=new_password1]").val("boo");
        $("#test").find("input[name=new_password1]").trigger("change");
        expect($("#test").find("input[name=new_password1]").parent().hasClass("has-success")).to.be.false;
        expect($("#test").find("input[name=new_password1]").parent().hasClass("has-error")).to.be.false;

        $("#test").find("input[name=new_password1]").val("Boooo3");
        $("#test").find("input[name=new_password1]").trigger("change");
        expect($("#test").find("input[name=new_password1]").parent().hasClass("has-success")).to.be.true;
        expect($("#test").find("input[name=new_password1]").parent().hasClass("has-error")).to.be.false;

        //premature submit should trigger error message instead of submitting the form,
        // and show error highlight on invalid fields
        expect($("#test").find("button[type=submit]").hasClass("btn-success")).to.be.false;
        $("#test").find("button[type=submit]").click();

        expect(triggerStub.callCount).to.eql(0);

        expect($("#test").find("input[name=new_password1]").parent().hasClass("has-success")).to.be.true;
        expect($("#test").find("input[name=new_password2]").parent().hasClass("has-error")).to.be.true;

        expect($("#test").find("input[name=new_password1]").parent().find(".help-block").hasClass("no-show")).to.be.true;
        expect($("#test").find("input[name=new_password2]").parent().find(".help-block").hasClass("no-show")).to.be.false;

        $("#test").find("input[name=new_password2]").val("Boo");
        $("#test").find("input[name=new_password2]").trigger("change");

        expect($("#test").find("input[name=new_password2]").parent().hasClass("has-error")).to.be.true;

        $("#test").find("input[name=new_password2]").val("Boooo3");
        $("#test").find("input[name=new_password2]").trigger("change");

        expect($("#test").find("input[name=new_password2]").parent().hasClass("has-error")).to.be.false;

        //finally,  fake the g-recaptcha-response
        u.subViewModels.changePasswordModel.set("g-recaptcha-response", "foo");
        expect($("#test").find("button[type=submit]").hasClass("btn-success")).to.be.true;

        $("#test").find("button[type=submit]").click();
        expect(triggerStub.callCount).to.eql(1);

      });

   it("should listen to submit clicks and call the user's postData method", function(){

     var minsub = new (MinSub.extend({
       request: function (apiRequest) {}
     }))({verbose: false});

     var hardened = minsub.beehive.getHardenedInstance();
     var postDataSpy = sinon.spy();
     sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}, postData: postDataSpy}})

     var u = new UserSettings();
     u.activate(hardened);
     $("#test").append(u.view.render().el);

     //testing form validation for change password page
     u.setSubView("password");

     $("#test").find("input[name=old_password]").val("Foooo5");
     $("#test").find("input[name=old_password]").trigger("change");

     $("#test").find("input[name=new_password1]").val("Boooo3");
     $("#test").find("input[name=new_password1]").trigger("change");

     $("#test").find("input[name=new_password2]").val("Boooo3");
     $("#test").find("input[name=new_password2]").trigger("change");

     $("#test").find("button[type=submit]").click();

     expect(postDataSpy.callCount).to.eql(1);
     expect(JSON.stringify(postDataSpy.args[0])).to.eql('["CHANGE_PASSWORD",{"old_password":"Foooo5","new_password1":"Boooo3","new_password2":"Boooo3"}]');

   });

  it("should listen to the USER_ANNOUNCMENT and re-render with the proper data", function(){

    var minsub = new (MinSub.extend({
      request: function (apiRequest) {}
    }))({verbose: false});

    var hardened = minsub.beehive.getHardenedInstance();
    var postDataSpy = sinon.spy();
    sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}, postData: postDataSpy}})

    var u = new UserSettings();
    u.activate(hardened);
    $("#test").append(u.view.render().el);

  });

  });

});