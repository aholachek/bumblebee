/**
 * Created by alex on 5/23/14.
 */
define(['backbone', 'marionette', 'js/widgets/base/base_widget', 'hbs!./templates/layout_template',
    'hbs!./templates/nav_item_template', 'hbs!./templates/nav_container_template', 'hbs!./templates/title_template'],
  function (Backbone, Marionette, BaseWidget, layoutTemplate, navItemTemplate, navContainerTemplate, titleTemplate ) {
/*
    Example parameters:

    {title : "Test title",
     widgetTitleMapping: {"abstractOne": {
                              widget: abstractWidgetOne, default: true
                              },
                           "abstractTwo" : {
                               widget: abstractWidgetTwo
                               }
                          }
    }
    */

    var LayoutTitleView = Marionette.ItemView.extend({
      template : titleTemplate

    });

    var LayoutTitleModel = Backbone.Model.extend({

    });

    var NavItemView = Marionette.ItemView.extend({
      template : navItemTemplate,
      tagName : "li",
      className: "contents-nav list-group-item",
      events : {
        "click": "changeContent"
      },

      changeContent : function(){
        if(!this.model.get("show") === true){
          this.trigger("changeContent")
          this.model.set("show", !this.model.get("show"), "highlight-added")
        }
      },

      initialize : function(options){
        if (this.model.get("show")){
          this.$el.addClass("contents-nav-active")
        }
        this.listenTo(this.model, "change:show", this.handleActiveClass)
      },

      handleActiveClass : function(){
        if (this.model.get("show") === false){
          this.$el.removeClass("contents-nav-active")
          this.$el.addClass("list-group-item")

        }
        else {
          this.$el.removeClass("list-group-item")
          this.$el.addClass("contents-nav-active")

        }
      }


    });

    var NavCollectionView = Marionette.CompositeView.extend({

    template : navContainerTemplate,
    itemView : NavItemView,

    itemViewContainer : ".table-of-contents ul"

  });

  var NavModel = Backbone.Model.extend({
    defaults : function(){
      return {
        title : undefined,
        show : false
      }
    }

  });

  var NavCollection =  Backbone.Collection.extend({
    model : NavModel,

    initialize : function(options){
      this.on("change:show", this.limitChosen)
    },

    limitChosen : function(shownModel, val, flag){
      if (flag && flag == "highlight-added"){
      this.each(function(m){
        if (m != shownModel && m.get("show") == true ){
          m.set("show", false)
        }
      })
      }
    }
  });

  var LayoutWidget = Marionette.Layout.extend({

    template : layoutTemplate,

    //dict of widget constructors
    widgets : {},

    initialize : function(options){
      var titleJSON = [];

      _.each(options.widgetTitleMapping, function(v,k){
        titleJSON.push({title : k, show: v.default});
        this.widgets[k] = v.widget;
      }, this);


    this.defaultWidget = _.where(_.values(options.widgetTitleMapping), {default : true})[0].widget;

    this.navCollection = new NavCollection(titleJSON);
    this.navCollectionView = new NavCollectionView({collection : this.navCollection})

    if (options.title){
      layoutTitleModel = new LayoutTitleModel({layoutTitle : options.title});
      this.layoutTitleView = new LayoutTitleView({model : layoutTitleModel });

    }

    this.listenTo(this.navCollectionView, "itemview:changeContent", this.changeContent)

    },

    changeContent : function(){
      var v = arguments[0];
      var title = v.model.get("title");
      if(title !== this.currentViewTitle){
        this.content.show(this.widgets[title].getView())
        this.widgets[title].getView().delegateEvents()
        this.currentViewTitle = title;
      }

    },

    regions : {
      title : "#layout-title",
      nav : "#layout-nav",
      content : "#layout-content"
    },

    onRender : function(){

      this.nav.show(this.navCollectionView);
      this.content.show(this.defaultWidget.getView())
      this.currentViewTitle = this.defaultWidget.view.model.get("title")
      if (this.layoutTitleView){
        this.title.show(this.layoutTitleView)
      }

    },

    onClose : function(){
      console.log("CLOSING")
      _.each(this.widgets, function(w){
        w.close();
      }, this)

    }



  })
  return LayoutWidget;

})
