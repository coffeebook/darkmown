$ ->
  converter = new Darkmown.converter()
  $userInput = $('#user_input')
  $renderedResult = $('#rendered_result')
  $htmlResult = $('#html_result')

  showResult = (html) ->
    value = $userInput.val()
    html = converter.makeHtml(value);
    $renderedResult.html(html);
    $htmlResult.val(html.replace(/>/g, ">\n").replace(/</g, "\n<").replace(/\n{2,}/g, "\n\n"));

  $userInput.keyup ->
    showResult()

  showResult()