define(['underscore', 'jquery', 'backbone', 'marionette',
    'js/widgets/base/base_widget', 'hbs!./templates/social_media_template', 'config'],
  function(_, $, Backbone, Marionette, BaseWidget, socialMediaTemplate, conf){




  var SocialButtonView = Backbone.View.extend({

    template : socialMediaTemplate,

    initialize : function(){

    },

    render : function(){

    },

    makeFacebookLink : function(){

      return 'http://www.facebook.com/share.php?u=' + encodeURIComponent(document.location.origin+"/abs/" +bibcode);

    },

    makeMendeleyLink : function(){
      return 'http://www.mendeley.com/import/?url=' + encodeURIComponent(document.location.origin+"/abs/" +bibcode);

    }

//    makeTwitterLink : function(){
//      """Creates an url for twitter"""
//      solrdoc = solr.get_document(bibcode)
//      if not solrdoc:
//        abort(404)
//      if solrdoc.author:
//      status = '%s: ' % solrdoc.author[0]
//      else:
//      status = ''
//      if solrdoc.title:
//      status = '%s%s %s via @adsabs' % (status, solrdoc.title[0], '%s%s' %(config.MAIL_CONTENT_REDIRECT_BASE_URL, url_for('abs.abstract', bibcode=bibcode)))
//      return 'http://twitter.com/home/?status=%s' % quote_url(status)
//
//    },
//
//    makeScienceWiseLink : function(){
//      """Creates an url for sciencewise"""
//      solrdoc = solr.get_document(bibcode)
//      if not solrdoc:
//        abort(404)
//      ids = solrdoc.getattr_func('ids_data', field_to_json)
//      arxiv_id = []
//      if ids:
//      for id_ in ids:
//      if id_.get('description') =='arXiv':
//      arxiv_id.append(id_.get('identifier'))
//      if arxiv_id:
//      return 'http://sciencewise.info/bookmarks/%s/add' % quote_url(arxiv_id[0].strip('arXiv:'))
//      else:
//      abort(404)
//
//    }



  })

  var SocialButtonWidget = BaseWidget.extend({

    initialize : function(options){

    },

    loadBibcodeData : function(bibcode){

      this.view.render(bibcode);

    }
  })




})