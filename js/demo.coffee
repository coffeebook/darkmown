define((require) ->
  "use strict"

  require("ace/lib/fixoldbrowsers")

  ace = require("ace/ace")
  editor = ace.edit('editor')
  theme = require("ace/theme/monokai")
  editor.setTheme(theme)
  editorSession = editor.getSession()
  MarkdownMode = require("ace/mode/markdown").Mode
  editorSession.setMode(new MarkdownMode())
  editorSession.setUseWrapMode(true)
  editor.focus()

  require('js/bootstrap-dropdown')
  require('js/darkmown')
  $ ->
    converter = new Darkmown.converter()
    $userInput = $('#editor')
    $renderedResult = $('#rendered_result')
    $htmlResult = $('#html_result')
    previews = {
      live_preview: $('#live_preview'),
      html_preview: $('#html_preview')
    }

    showResult = () ->
      value = editorSession.getDocument().getValue()
      html = converter.makeHtml(value)
      $renderedResult.html(html)
      $htmlResult.html(html.replace(/>/g, "&gt").replace(/</g, "&lt").replace(/\n{2,}/g, "<br/><br/>"))

    activePreview = null
    lastActive = null
    $('#select_preview').on('click', 'a', (ev) ->
      ev.preventDefault();
      $this = $(this)
      show = $this.data('show')
      if (activePreview && activePreview[0].id == show)
        return
      if (lastActive)
        lastActive.removeClass('active')
      lastActive = $(this).parent().addClass('active')

      activePreview = previews[show].show()
      previews[$this.data('hide')].hide()
    ).find('a').first().click()

    $userInput.keyup(showResult)

    showResult()
)