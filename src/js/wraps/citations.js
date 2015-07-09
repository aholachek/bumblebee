
define([
    'underscore',
    'js/widgets/list_of_things/details_widget'
  ],

  function (  _,  ListOfThingsWidget) {

    var Widget = ListOfThingsWidget.extend({
      queryOperator : "citations",
      sortOrder : "date desc",
      description : "Papers which cite",
      operator : true

    });

    return Widget;

  });
