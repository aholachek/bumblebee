define(['js/widgets/facet/factory' ], function ( FacetFactory) {

  return function() {
    var widget = FacetFactory.makeBasicCheckboxFacet({
      facetField: "keyword_facet",
      facetTitle: "Keywords",
      openByDefault: true,
      logicOptions: {single: ['limit to', 'exclude'], 'multiple': ['and', 'or', 'exclude']}
    });
    return widget;
  };

});