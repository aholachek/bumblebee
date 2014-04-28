define(['marionette', 'backbone', 'underscore', 'js/components/api_request', 'js/components/api_query',
    'js/widgets/base/base_widget', 'hbs!./templates/item-template', 'hbs!./templates/list-template'
  ],

  function(Marionette, Backbone, _, ApiRequest, ApiQuery, BaseWidget, ItemTemplate, ListTemplate) {

    var ItemModel = Backbone.Model.extend({

    });

    var ListCollection = Backbone.Collection.extend({

      model: ItemModel,

      //this function takes the output of apiResponse.toJSON() and builds individual models for 
      //the collection.
      parse: function(raw) {
        var docs = raw.response.docs;
        var highlights = raw.highlighting;

        docs = _.map(docs, function(d) {
          var id = d.id;
          var h = (function() {

            var hl = highlights[id];
            var finalList = [];
            //adding abstract,title, etc highlights to one big list
            _.each(hl, function(val, key) {
              finalList.push(val);
            });
            finalList = _.flatten(finalList);

            return {
              "highlights": finalList
            }
          }());

          return _.extend(d, h);
        });

        return docs;

      }

    });

    var ResultsItemView = Marionette.ItemView.extend({

      initialize: function() {},

      template: ItemTemplate,

      events: {
        'click .view-more': 'toggleExtraInfo'
      },

      toggleExtraInfo: function(e) {
        e.preventDefault();
        this.$(".more-info").toggleClass("hide");
        if (this.$(".more-info").hasClass("hide")){
          this.$(".view-more").text("more info...")
        }
        else{
          this.$(".view-more").text("hide info")
        }
      }

    });

    var ResultsListView = Marionette.CompositeView.extend({
      template: ListTemplate,
      itemView: ResultsItemView,
      itemViewContainer: "#results"

    });


    var ResultsListController = BaseWidget.extend({


      initialize: function(options) {

        this.collection = new ListCollection();
        this.view = new ResultsListView({
          collection: this.collection
        });

        BaseWidget.prototype.initialize.call(this, options)
      },

      composeRequest: function(apiQuery) {
        var q = this.customizeQuery({
          "hl": "true",
          "hl.fl": "title,abstract"
        });

        return new ApiRequest({
          target: 'search',
          query: q
        });
      },

      processResponse: function(apiResponse) {

        this.collection.reset(apiResponse.toJSON(), {
          parse: true
        })

      },

    });

    return ResultsListController;

  });
