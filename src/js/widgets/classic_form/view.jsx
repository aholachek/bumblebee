define([

    "react"

], function(

    React

){

  var foo = React.createClass({

    render : function(){

      return (<div>{this.props.msg}</div>)
    }


  })

  return foo;

})