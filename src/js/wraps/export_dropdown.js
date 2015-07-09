define([
  'js/widgets/dropdown-menu/widget'

], function(

  DropdownWidget

  ){

  //config

  var links = [
    {href : '/export/bibtex' , description : 'in BibTEX' , navEvent: 'export', params : {format: "bibtex"}},
    {href : '/export/aastex' , description : 'in AASTex' , navEvent: 'export', params : {format: "aastex"}},
    {href : '/export/endnote' , description : 'in EndNote' , navEvent: 'export', params : {format: "endnote"}},
    {href : '/export/classic' , description : 'in ADS Classic' , navEvent: 'export', params : {format: "classic"}}

    // deactivated, needs the myads microservice
    //{href : '/export/query' , description : 'Export Query' , navEvent: 'export-query'}
  ];

  var btnType = "btn-primary-faded";
  var dropdownTitle = "Export";
  var iconClass = "icon-export";
  var rightAlign = true;
  var selectedOption = true;


  return function(){

    var Dropdown = new DropdownWidget({
      links : links,
      btnType: btnType,
      dropdownTitle : dropdownTitle,
      iconClass: iconClass,
      rightAlign : rightAlign,
      selectedOption : selectedOption
    });

    return Dropdown;
  }
});