(function() {

  $(function() {
    var $htmlResult, $renderedResult, $userInput, converter, showResult;
    converter = new Darkmown.converter();
    $userInput = $('#user_input');
    $renderedResult = $('#rendered_result');
    $htmlResult = $('#html_result');
    showResult = function(html) {
      var value;
      value = $userInput.val();
      html = converter.makeHtml(value);
      $renderedResult.html(html);
      return $htmlResult.val(html.replace(/>/g, ">\n").replace(/</g, "\n<").replace(/\n{2,}/g, "\n\n"));
    };
    $userInput.keyup(function() {
      return showResult();
    });
    return showResult();
  });

}).call(this);
