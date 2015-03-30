define([
    'js/widgets/authentication/widget',
    'js/bugutils/minimal_pubsub',
  ],

function(
  AuthenticationWidget,
  MinSub
  ){


  describe("Authentication Widget", function(){

    afterEach(function(){
      $("#test").empty();
    });

    it("should consist of a Marionette layout that shows the correct view based on the subview as set by the navigator ", function(){

      var minsub = new (MinSub.extend({
        request: function (apiRequest) {}
      }))({verbose: false});

      var hardened = minsub.beehive.getHardenedInstance();
      sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}})

      var a = new AuthenticationWidget();
      a.activate(hardened);
      $("#test").append(a.view.render().el);

      //should render nothing since there is no subview indicated in the view model
      expect($("#test").html()).to.eql('<div class="s-authentication-container row s-form-widget"><div class="form-container s-form-container col-sm-6 col-sm-offset-3">\n\n</div></div>');

      a.setSubView("login");

      expect($("#test").find(".log-in").length).to.eql(1);

      a.setSubView("register");

      expect($("#test").find(".register").length).to.eql(1);

      a.setSubView("reset-password-1");

      expect($("#test").find(".reset-password-1").length).to.eql(1);

      a.setSubView("reset-password-2");

      expect($("#test").find(".reset-password-2").length).to.eql(1);

    });

    it("should allow the user to navigate to other views using the buttons on the forms", function(){

      var minsub = new (MinSub.extend({
        request: function (apiRequest) {}
      }))({verbose: false});

      var hardened = minsub.beehive.getHardenedInstance();
      sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}})

      var a = new AuthenticationWidget();
      a.activate(hardened);

      var publishStub = sinon.stub(a.pubsub, "publish");

      $("#test").append(a.view.render().el);

      a.setSubView("login");

      $(".show-register").click();

      expect(publishStub.args[0]).to.eql([
        "[Router]-Navigate-With-Trigger",
        "authentication-page",
        {
          "subView": "register"
        }
      ]);

      a.setSubView("reset-password-1");

      $(".show-login").click();

      expect(publishStub.args[1]).to.eql([
        "[Router]-Navigate-With-Trigger",
        "authentication-page",
        {
          "subView": "login"
        }
      ]);

      a.setSubView("register");

      $(".show-login").click();

      expect(publishStub.args[1]).to.eql([
        "[Router]-Navigate-With-Trigger",
        "authentication-page",
        {
          "subView": "login"
        }
      ]);

    });

    it("should interactively validate form inputs, only allowing correctly filled forms to be submitted", function(){

      //testing only a single view-- is this ok?
      var minsub = new (MinSub.extend({
        request: function (apiRequest) {}
      }))({verbose: false});

      var hardened = minsub.beehive.getHardenedInstance();
      sinon.stub(hardened, "getObject", function(){return {getRecaptchaKey : function(){return "foo"}}})

      var a = new AuthenticationWidget();
      a.activate(hardened);
      $("#test").append(a.view.render().el);

      //testing form validation for register page
      a.setSubView("register");

      var triggerStub = sinon.stub(a.view, "trigger");

      $("#test").find("input[name=email]").val("foo");
      $("#test").find("input[name=email]").trigger("change");
      expect($("#test").find("input[name=email]").parent().hasClass("has-success")).to.be.false;
      expect($("#test").find("input[name=email]").parent().hasClass("has-error")).to.be.false;

      $("#test").find("input[name=email]").val("foo@goo.com");
      $("#test").find("input[name=email]").trigger("change");
      expect($("#test").find("input[name=email]").parent().hasClass("has-success")).to.be.true;
      expect($("#test").find("input[name=email]").parent().hasClass("has-error")).to.be.false;

      $("#test").find("input[name=password1]").val("1aaaa");
      $("#test").find("input[name=password1]").trigger("change");
      expect($("#test").find("input[name=password1]").parent().hasClass("has-success")).to.be.false;
      expect($("#test").find("input[name=password1]").parent().hasClass("has-error")).to.be.false;

      $("#test").find("input[name=password1]").val("1Aaaaa");
      $("#test").find("input[name=password1]").trigger("change");
      expect($("#test").find("input[name=password1]").parent().hasClass("has-success")).to.be.true;
      expect($("#test").find("input[name=password1]").parent().hasClass("has-error")).to.be.false;

      //premature submit should trigger error message instead of submitting the form,
      // and show error highlight on invalid fields

      $("#test").find("button[type=submit]").click();
      expect($("#test").find("button[type=submit]").hasClass("btn-success")).to.be.false;

      expect(triggerStub.callCount).to.eql(0);
      expect($("#test").find("input[name=password1]").parent().hasClass("has-success")).to.be.true;
      expect($("#test").find("input[name=password2]").parent().hasClass("has-error")).to.be.true;

      expect($("#test").find("input[name=password1]").parent().find(".help-block").hasClass("no-show")).to.be.true;
      expect($("#test").find("input[name=password2]").parent().find(".help-block").hasClass("no-show")).to.be.false;

      $("#test").find("input[name=password2]").val("1A");
      $("#test").find("input[name=password2]").trigger("change");

      expect($("#test").find("input[name=password2]").parent().hasClass("has-error")).to.be.true;

      $("#test").find("input[name=password2]").val("1Aaaaa");
      $("#test").find("input[name=password2]").trigger("change");

      expect($("#test").find("input[name=password2]").parent().hasClass("has-error")).to.be.false;

      //finally,  fake the g-recaptcha-response
      a.view.registerModel.set("g-recaptcha-response", "foo");
      expect($("#test").find("button[type=submit]").hasClass("btn-success")).to.be.true;

      $("#test").find("button[type=submit]").click();
      expect(triggerStub.callCount).to.eql(1);


    });




    it("should listen to USER_ANNOUNCEMENT and reset the models and, if there was an error, show the relevant form", function(){



    });

    it("should be able to show the correct form depending on the route", function(){


    });



  });

});