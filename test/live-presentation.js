require(['js/components/beehive', 'js/services/pubsub', 'js/components/query_mediator',
  'js/services/api', 'jquery', 'underscore', 'js/widgets/search_bar/search_bar_widget',
  'js/widgets/results_render/results_render_widget', 'js/widgets/facet/facet-widget',
  'js/widgets/query_info/query_info_widget', 'js/widgets/tabs/tabs_widget'
], function (BeeHive, PubSub, QueryMediator, Api, $, _, SearchBar, ResultsRender, facetFactory, QueryInfoWidget, TabsWidget) {

  var beehive = new BeeHive();
  beehive.addService('PubSub', new PubSub());
  beehive.addService('Api', new Api());
  var queryMediator = new QueryMediator();
  queryMediator.activate(beehive);

  var queryInfo = new QueryInfoWidget();

  var s = new SearchBar();
  var r = new ResultsRender({pagination: {rows: 40, start: 0}});
  var c = facetFactory.makeGraphFacet({
    facetName     : "citation_count",
    userFacingName: "Citations",
    xAxisTitle    : "Citation Count",
    openByDefault : true,
  });

  var a = facetFactory.makeHierarchicalCheckboxFacet({
    facetName     : "author",
    userFacingName: "Authors",
    openByDefault : true,
    preprocess    : ["titleCase", "removeSlash"]
  })
  var keywords = facetFactory.makeBasicCheckboxFacet({
    facetName     : "keyword",
    userFacingName: "Keywords",
    openByDefault : false,
    preprocess    : ["titleCase", "removeSlash"]
  })

  var database = facetFactory.makeBasicCheckboxFacet({
    facetName     : "database",
    userFacingName: "Databases",
    openByDefault : true,
    preprocess    : "titleCase",
  })
  var data = facetFactory.makeBasicCheckboxFacet({
    facetName     : "data",
    userFacingName: "Data",
    openByDefault : false,
    preprocess    : "allCaps",
  })

  var vizier = facetFactory.makeBasicCheckboxFacet({
    facetName     : "vizier",
    userFacingName: "Vizier Tables",
    openByDefault : false,
    preprocess    : "allCaps",
  })

  var pub = facetFactory.makeBasicCheckboxFacet({
    facetName     : "bibstem",
    userFacingName: "Publications",
    openByDefault : false,
    preprocess    : "allCaps",
    multiLogic    : ["or", "exclude"]
  })
  var bibgroup = facetFactory.makeBasicCheckboxFacet({
    facetName     : "bibgroup",
    userFacingName: "Bib Groups",
    openByDefault : false,
    preprocess    : "allCaps",
    multiLogic    : ["or", "exclude"]
  })

  var grants = facetFactory.makeHierarchicalCheckboxFacet({
    facetName     : "grant",
    userFacingName: "Grants",
    openByDefault : false,
    preprocess    : ["allCaps", "removeSlash"],
    multiLogic    : ["or", "exclude"]
  })

  var refereed = facetFactory.makeBasicCheckboxFacet({
    facetName     : "property",
    userFacingName: "Refereed Status",
    openByDefault : true,
    multiLogic    : "fullSet",
    extractFacets : function (facets) {
      var returnList = [];
      _.each(facets, function (d, i) {
        if (d === "refereed") {
          returnList.push("Refereed", facets[i + 1])
        }
        else if (d === "notrefereed") {
          returnList.push("Non-Refereed", facets[i + 1])
        }
      })
      return returnList
    }
  })

  var y = facetFactory.makeGraphFacet({
    facetName     : "year",
    userFacingName: "Year",
    xAxisTitle    : "Year",
    openByDefault : true,
  });

  queryInfo.activate(beehive.getHardenedInstance())
  s.activate(beehive.getHardenedInstance())
  r.activate(beehive.getHardenedInstance())
  c.activate(beehive.getHardenedInstance())
  a.activate(beehive.getHardenedInstance())
  y.activate(beehive.getHardenedInstance())
  database.activate(beehive.getHardenedInstance())
  keywords.activate(beehive.getHardenedInstance())
  pub.activate(beehive.getHardenedInstance())
  bibgroup.activate(beehive.getHardenedInstance())
  data.activate(beehive.getHardenedInstance())
  vizier.activate(beehive.getHardenedInstance())
  grants.activate(beehive.getHardenedInstance())
  refereed.activate(beehive.getHardenedInstance())

  $("#top").append(s.getView().render().el)

  $("#middle").append(r.getView().render().el)

  $("#left").append(a.getView().render().el)
  $("#left").append(database.getView().render().el)
  $("#left").append(refereed.getView().render().el)
  $("#left").append(keywords.getView().render().el)
  $("#left").append(pub.getView().render().el)
  $("#left").append(bibgroup.getView().render().el)
  $("#left").append(data.getView().render().el)
  $("#left").append(vizier.getView().render().el)
  $("#left").append(grants.getView().render().el)

  var tabs = new TabsWidget({tabs: [
    {title: "Years", view: y.getView(), id: "year-dist", default : true},
    {title : "Citations", view: c.getView(), id: "citations-dist"}
  ]})

  var tabs2 = new TabsWidget({
    tabs : [{title: "Your Query", view:queryInfo.getView(), id : "your-query", default:true  }]
  })
  console.log()

  $("#right").append(tabs.render().el)

  $("#right").append(tabs2.render().el)





})
