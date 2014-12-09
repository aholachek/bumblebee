define([
  'js/widgets/recommender/widget',
  'js/components/json_response'

], function (
  RecommenderWidget,
  JsonResponse
  ) {

  describe("Recommender Widget", function (){

    var testData = {"paper": "2010MNRAS.409.1719J", "recommendations": [
      {"bibcode": "1998ApJ...509..212S", "author": "Strong,+", "title": "Propagation of Cosmic-Ray Nucleons in the Galaxy"},
      {"bibcode": "1998ApJ...493..694M", "author": "Moskalenko,+", "title": "Production and Propagation of Cosmic-Ray Positrons and Electrons"},
      {"bibcode": "2007ARNPS..57..285S", "author": "Strong,+", "title": "Cosmic-Ray Propagation and Interactions in the Galaxy"},
      {"bibcode": "2011ApJ...737...67M", "author": "Murphy,+", "title": "Calibrating Extinction-free Star Formation Rate Diagnostics with 33 GHz Free-free Emission in NGC 6946"},
      {"bibcode": "1971JGR....76.7445R", "author": "Rygg,+", "title": "Balloon measurements of cosmic ray protons and helium over half a solar cycle 1965-1969"},
      {"bibcode": "1997ApJ...481..205H", "author": "Hunter,+", "title": "EGRET Observations of the Diffuse Gamma-Ray Emission from the Galactic Plane"},
      {"bibcode": "1978MNRAS.182..147B", "author": "Bell,+", "title": "The acceleration of cosmic rays in shock fronts - I."}
    ]};

    afterEach(function(){

      $("#test").empty();
    })

    it("should display a list of recommended articles", function(){

      var r = new RecommenderWidget();

      $("#test").append(r.render().el);

      r.processResponse(new JsonResponse(testData));

      expect($("#test").find("li").length).to.eql(7);

      expect($("#test").find("li:first").text().trim()).to.eql('Propagation of Cosmic-Ray Nucleons in the Galaxy;\n        Strong,+');
      expect($("#test").find("li:first").attr("title")).to.eql("1998ApJ...509..212S");


    })


    it("should link directly to the abstract pages in Bumblebee", function(){

      var r = new RecommenderWidget();

      $("#test").append(r.render().el);

      r.processResponse(new JsonResponse(testData));

      expect($("#test").find("li:first a").attr("href")).to.eql("#abs/1998ApJ...509..212S");

      expect($("#test").find("li:last a").attr("href")).to.eql("#abs/1978MNRAS.182..147B");


    });


    it("should have a help popover", function(){

      var r = new RecommenderWidget();

      $("#test").append(r.render().el);

      r.processResponse(new JsonResponse(testData));

      expect($("#test").find("i.icon-help").data("content")).to.eql('These recommendations are based on a number of factors, including text similarity, citations, and co-readership information.')



    });

    it("extends from BaseWidget and can communicate with pubsub and its page controller through loadBibcodeData function", function(){

      var r = new RecommenderWidget();

      r.pubsub = {DELIVERING_REQUEST : "foo", publish : sinon.spy()}

      expect(r.loadBibcodeData).to.be.instanceof(Function);

      r.loadBibcodeData("fakeBibcode");

      var apiRequest = r.pubsub.publish.args[0][1];

      expect(apiRequest.toJSON().target).to.eql("services/recommender/fakeBibcode");
      expect(apiRequest.toJSON().query.toJSON()).to.eql({});




    })




  })


})