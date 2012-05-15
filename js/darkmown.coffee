###
darkmown.js is a CoffeeScript port of Markdown
Copyright (c) 2012 Denis Ciccale (@tdecs)
https://github.com/dciccale/darkmown

Original Markdown Copyright (c) 2004-2005 John Gruber
http://daringfireball.net/projects/markdown/

Inspired by showdown.js
https://github.com/coreyti/showdown
###


Darkmown = {}

# # # # # # # # # # # # # # # # # # # # # # # # # # #

# Converter object
Darkmown.converter = ->

  # g_urls and g_titles allow arbitrary user-entered strings as keys. This
  # caused an exception (and hence stopped the rendering) when the user entered
  # e.g. [push] or [__proto__]. Adding a prefix to the actual key prevents this
  # (since no builtin property starts with "s_"). See
  # http://meta.stackoverflow.com/questions/64655/strange-wmd-bug
  class SafeHash
    set: (key, value) ->
      this["s_" + key] = value;

    get: (key) ->
      return this["s_" + key];

  # # # # # # # # # # # # # # # # # # # # # # # # # # #
  # Globals

  g_urls = new SafeHash()
  g_titles = new SafeHash()
  g_html_blocks = []
  g_list_level = 0
  prev_text = ''
  prev_html = ''

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  @makeHtml = (text) ->
    ## return empty string if no text provided
    if !text
      return ''

    # prevent parsing the same text
    if prev_text != text
      prev_text = text
    else if prev_text == text
      return prev_html


    # Main function. The order in which other subs are called here is
    # essential. Link and image substitutions need to happen before
    # _EscapeSpecialCharsWithinTagAttributes(), so that any *'s or _'s in the <a>
    # and <img> tags get encoded.

    text = text
      # attacklab: Replace ~ with ~T
      # This lets us use tilde as an escape char to avoid md5 hashes
      # The choice of character is arbitray; anything that isn't
      # magic in Markdown will work.
      .replace(/~/g, "~T")

      # attacklab: Replace $ with ~D
      # RegExp interprets $ as a special character
      # when it's in a replacement string
      .replace(/\$/g, "~D")

      # Standardize line endings
      .replace(/\r\n/g, "\n") # DOS to Unix
      .replace(/\r/g, "\n")   # Mac to Unix

    # Make sure text begins and ends with a couple of newlines:
    text = "\n\n" + text + "\n\n"

    # Convert all tabs to spaces
    text = _Detab(text)

    # Strip any lines consisting only of spaces and tabs.
    # This makes subsequent regex easier to write, because we can
    # match consecutive blank lines with /\n+/ instead of something
    # like /[\s\t]*\n+/
    text = text.replace(/^[ \t]+$/mg, "")

    #Turn block-level HTML blocks into hash entries
    text = _HashHTMLBlocks(text)

    # Strip link definitions, store in hashes
    text = _StripLinkDefinitions(text)

    text = _RunBlockGamut(text)

    text = _UnescapeSpecialChars(text)

    text = text
      # attacklab: Restore dollar signs
      .replace(/~D/g, "$$")

      # attacklab: Restore tildes
      .replace(/~T/g, "~")

      # restore globals
      # g_html_blocks = g_titles = g_urls = null;

      prev_html = text

      return text

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  escapeCharacters_callback = (wholeMatch, m1) ->
    charCodeToEscape = m1.charCodeAt(0)
    "~E" + charCodeToEscape + "E"

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  encodeProblemUrlChars = (url) ->
    # hex-encodes some unusual "problem" chars in URLs to avoid URL detection problems
    _problemUrlChars = /(?:["'*()[\]:]|~D)/g;

    if !url
      return "";

    len = url.length

    return url.replace(_problemUrlChars, (match, offset) ->
        if match == "~D" # escape for dollar
          return "%24"
        if match == ":"
          if offset == len - 1 || /[0-9\/]/.test(url.charAt(offset + 1))
            return ":"
        return "%" + match.charCodeAt(0).toString(16)
    )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  escapeCharacters = (text, charsToEscape, afterBackslash) ->
    regexString = "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])"

    if (afterBackslash)
      regexString = "\\\\" + regexString

    regex = new RegExp(regexString, "g")
    text = text.replace(regex, escapeCharacters_callback)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _EncodeCode = (text) ->
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    text = escapeCharacters(text, "\*_{}[]\\", false)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _Outdent = (text) ->
    # Remove one level of line-leading tabs or spaces

    # attacklab: hack around Konqueror 3.5.4 bug:
    # "----------bug".replace(/^-/g,"") == "bug"
    text = text
      .replace(/^(\t|[\s]{1,4})/gm, "~0")

      # attacklab: clean up hack
      .replace(/~0/g, "")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _Detab = (text) ->
    if !/\t/.test(text)
      return text

    spaces = ["    ", "   ", "  ", " "]
    skew = 0

    text.replace(/[\n\t]/g, (match, offset) ->
        if match == "\n"
            skew = offset + 1
            return match
        v = (offset - skew) % 4
        skew = offset + 1
        return spaces[v]
    )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  hashBlock = (text) ->
    text = text.replace(/(^\n+|\n+$)/g, "")
    "\n\n~K" + (g_html_blocks.push(text) - 1) + "K\n\n"

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoCodeBlocks = (text) ->
    # Process Markdown `<pre><code>` blocks.
    text += "~0"

    text = text
      .replace(///
        (?:\n\n|^)             # $1 = the code block -- one or more lines, starting with a space/tab
        (
          (?:(?:[\x20]{4}|\t)  # Lines must start with a tab or a tab-width of spaces
            .*\n+
          )+
        )
        (\n*[\x20]{0,3}[^ \t\n]|(?=~0))
        ///g, (wholeMatch, m1, m2) ->
          codeblock = m1
          nextChar = m2

          codeblock = _EncodeCode(_Outdent(codeblock))
          codeblock = _Detab(codeblock)
          codeblock = codeblock
            .replace(/^\n+/g, "")
            .replace(/\n+$/g, "")

          codeblock = "<pre><code>" + codeblock + "\n</code></pre>"

          return hashBlock(codeblock) + nextChar
        )
      .replace(/~0/, "")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoCodeSpans = (text) ->
    text = text.replace(///
      (^|[^\\])  # Character before opening ` can't be a backslash
      (`+)       # $2 = Opening run of `
      (          # $3 = The code block
        [^\r]*?
        [^`]     # attacklab: work around lack of lookbehind
      )
      \2         # Matching closer
      (?!`)
      ///gm, (wholeMatch, m1, m2, m3, m4) ->
        m3 = m3.replace(/^[\s\t]*|[\s\t]*$/g, "")  # trim
        m3 = _EncodeCode(m3)
        return m1 + "<code>" + m3 + "</code>"
      )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoItalicsAndBold = (text) ->
    # <strong> must go first:
    text = text
      .replace(/([\W_]|^)(\*\*|__)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g, "$1<strong>$3</strong>$4")
      .replace(/([\W_]|^)(\*|_)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g, "$1<em>$3</em>$4")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _EscapeSpecialCharsWithinTagAttributes = (text) ->
    # Within tags -- meaning between < and > -- encode [\ ` * _] so they
    # don't conflict with their use in Markdown for code, italics and strong.

    # Build a regex to find HTML tags and comments.  See Friedl's
    # "Mastering Regular Expressions", 2nd Ed., pp. 200-201.

    # SE: changed the comment part of the regex
    text = text.replace(/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>)/gi, (wholeMatch) ->
      tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, "$1`")
      # also escape slashes in comments to prevent autolinking there -- http://meta.stackoverflow.com/questions/95987
      tag = escapeCharacters(tag, if wholeMatch.charAt(1) == "!" then "\\`*_/" else "\\`*_")
    )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _EncodeBackslashEscapes = (text) ->
    #   Parameter:  String.
    #   Returns: The string, with after processing the following backslash escape sequences.

    # attacklab: The polite way to do this is with the new
    # escapeCharacters() function:
    #
    #     text = escapeCharacters(text,"\\",true);
    #     text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
    #
    # ...but we're sidestepping its use of the (slow) RegExp constructor
    # as an optimization for Firefox.  This function gets called a LOT.
    text = text
      .replace(/\\(\\)/g, escapeCharacters_callback)
      .replace(/\\([`*_{}\[\]()>#+-.!])/g, escapeCharacters_callback)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  writeImageTag = (wholeMatch, m1, m2, m3, m4, m5, m6, m7) ->
    whole_match = m1
    alt_text = m2
    link_id = m3.toLowerCase()
    url = m4
    title = m7

    if !title
      title = ""

    if url == ""
      if link_id == ""
        link_id = alt_text.toLowerCase().replace(/\s?\n/g, " ")

      url = "#" + link_id

      if g_urls.get(link_id) != undefined
        url = g_urls.get(link_id)
        if g_titles.get(link_id) != undefined
          title = g_titles.get(link_id)
      else
        return whole_match

    alt_text = alt_text.replace(/"/g, "&quot;")
    url = escapeCharacters(url, "*_")
    result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\""
    title = title.replace(/"/g, "&quot;")
    title = escapeCharacters(title, "*_")
    result +=  " title=\"" + title + "\" />"

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoImages = (text) ->
    text = text
      .replace(/(!\[(.*?)\][\s]?(?:\n[\s]*)?\[(.*?)\])()()()()/g, writeImageTag)
      .replace(/(!\[(.*?)\]\s?\([\s\t]*()<?(\S+?)>?[\s\t]*((['"])(.*?)\6[\s\t]*)?\))/g, writeImageTag)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  writeAnchorTag = (wholeMatch, m1, m2, m3, m4, m5, m6, m7) ->
    m7 = "" if m7 == undefined

    whole_match = m1
    link_text = m2.replace(/:\/\//g, "&#58;//") # to prevent auto-linking withing the link
    link_id = m3.toLowerCase()
    url = m4
    title = m7

    if url == ""
      if link_id == ""
        # lower-case and turn embedded newlines into spaces
        link_id = link_text.toLowerCase().replace(/\s?\n/g, " ")

      url = "#" + link_id

      if g_urls.get(link_id) != undefined
        url = g_urls.get(link_id)
        if g_titles.get(link_id) != undefined
          title = g_titles.get(link_id)
      else
        if whole_match.search(/\(\s*\)$/m) > -1
          # Special case for explicit empty url
          url = ""
        else
          return whole_match

    url = encodeProblemUrlChars(url)
    url = escapeCharacters(url, "*_")

    # add http:// if no protocol defined
    if (!/(https?|ftp|dict):\/\//.test(url))
      url = 'http://' + url

    result = "<a href=\"" + url + "\""

    if title != ""
      title = title.replace(/"/g, "&quot;")
      title = escapeCharacters(title, "*_")
      result += " title=\"" + title + "\""

    result += ">" + link_text + "</a>"

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoAnchors = (text) ->
    # Turn Markdown link shortcuts into XHTML <a> tags.

    # First, handle reference-style links: [link text] [id]
    text = text
      .replace(///
        (                 # wrap whole match in $1
          \[
          (
            (?:
              \[[^\]]*\]  # allow brackets nested one level
              |
              [^\[\]]     # or anything else
              )*
          )
          \]
          [\s]?           # one optional space
          (?:\n[\s]*)?    # one optional newline followed by spaces
          \[
          (.*?)           # id = $3
          \]
        )()()()()         # pad remaining backreferences
        ///g, writeAnchorTag)

      # Next, inline-style links: [link text](url "optional title")
      .replace(///
        (                   # wrap whole match in $1
          \[
            (
              (?:
                \[[^\]]*\]  # allow brackets nested one level
                |
                [^\[\]]     # or anything else
              )*
            )
            \]
            \(              # literal paren
            [\s\t]*
            ()              # no id, so leave $3 empty
            <?(             # href = $4
              (?:
                \([^)]*\)   # allow one level of (correctly nested) parens (think MSDN)
                |
                [^()]
              )*
            ?)>?
            [\s\t]*
            (               # $5
              (['"])        # quote char = $6
              (.*?)         # Title = $7
              \6            # matching quote
              [\s\t]*       # ignore any spaces/tabs between closing quote and )
            )?              # title is optional
          \)
        )
        ///g, writeAnchorTag)

      # Last, handle reference-style shortcuts: [link text]
      # These must come last in case you've also got [link test][1]
      # or [link test](/foo)
      .replace(///
        (             # wrap whole match in $1
          \[
          ([^\[\]]+)  # link text = $2; can't contain '[' or ']'
          \]
        )
        ()()()()()    # pad rest of backreferences
        ///g, writeAnchorTag)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _UnescapeSpecialChars = (text) ->
    # Swap back in all the special characters we've hidden.
    text = text.replace(/~E(\d+)E/g, (wholeMatch, m1) ->
      charCodeToReplace = parseInt(m1, 10)
      return String.fromCharCode(charCodeToReplace)
    )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _EncodeEmailAddress = (addr) ->
    char2hex = (ch) ->
      hexDigits = '0123456789ABCDEF'
      dec = ch.charCodeAt(0)
      return (hexDigits.charAt(dec>>4) + hexDigits.charAt(dec&15))

    encode = [
     (ch) -> return "&#" + ch.charCodeAt(0) + ";",
     (ch) -> return "&#x" + char2hex(ch) + ";",
     (ch) -> return ch
    ]

    addr = "mailto:" + addr

    addr = addr.replace(/./g, (ch) ->
      if ch == "@"
        ch = encode[Math.floor(Math.random() * 2)](ch)
      else if ch != ":"
        r = Math.random()
        ch = if r > .9
              encode[2](ch)
            else if r > .45
              encode[1](ch)
            else
              encode[0](ch)
      return ch
    )

    addr = "<a href=\"" + addr + "\">" + addr + "</a>"
    addr = addr.replace(/">.+:/g, "\">")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoAutoLinks = (text) ->
    # split by lines
    urls = text.split(/\n/)

    # replacer
    replaceUrls = (i, url) ->
      # check if already has a link
      if (/(^|\s+)<(a|i|ul)/).test(url)
        return url

      urls[i] = urls[i].replace(///
          (>\n)?
          (
            (https?|ftp|dict)://     # m2 protocol
            |
            www\.                    # match wwww.
          )
          [^'">\s\<]+                # domain name
          ///gi, (wholeMatch, m1, m2) ->
          link = wholeMatch

          # add default protocol if missing
          if m2 == 'www.'
            link = 'http://' + link

          return "<a href=\"" + link + "\">" + wholeMatch + "</a>"
        )

    # replace urls
    if urls.length > 0
      replaceUrls i, url for url, i in urls

    # join text again
    text = urls
      .join('\n')
      # replace links
      .replace(/(?:mailto:)?([\-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)/gi, (wholeMatch, m1) ->
        return _EncodeEmailAddress(_UnescapeSpecialChars(m1))
      )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _EncodeAmpsAndAngles = (text) ->
    # Smart processing for ampersands and angle brackets that need to be encoded.
    # Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
    # http://bumppo.net/projects/amputator/
    text = text
      .replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;")
      # // Encode naked <'s
      .replace(/<(?![a-z\/?\$!])/gi, "&lt;")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _RunSpanGamut = (text) ->
    text = _DoCodeSpans(text)
    text = _EscapeSpecialCharsWithinTagAttributes(text)
    text = _EncodeBackslashEscapes(text)
    text = _DoImages(text)
    text = _DoAnchors(text)
    text = _DoAutoLinks(text)
    text = _EncodeAmpsAndAngles(text)
    text = _DoItalicsAndBold(text)
    text = text.replace(/\s\s+\n/g, " <br />\n")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoHeaders = (text) ->
    # atx-style headers only:
    # # Header 1
    # ## Header 2
    # ## Header 2 with closing hashes ##
    # ...
    # ###### Header 6
    text = text
      .replace(///
        ^(\#{1,6})  # $1 = string of #'s
        [\s\t]*
        (.+?)       # $2 = Header text
        [\s\t]*
        \#*         # optional closing #'s (not counted)
        \n+
        ///gm, (wholeMatch, m1, m2) ->
          h_level = m1.length
          hashBlock("<h" + h_level + ">" + _RunSpanGamut(m2) + "</h" + h_level + ">")
      )

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoLists = (text) ->
    text += "~0"

    whole_list = /^(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/gm

    if g_list_level
      text = text.replace(whole_list, (wholeMatch, m1, m2) ->
        list = m1
        list_type = if m2.search(/[*+-]/g) > -1 then "ul" else "ol"
        list = list.replace(/\n{2,}/g, "\n\n\n")
        result = _ProcessListItems(list)
        result = result.replace(/\s+$/, "")
        result = "<" + list_type + ">" + result + "</" + list_type + ">\n"
        return result
      )
    else
      whole_list = /(\n\n|^\n?)(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/g
      text = text.replace(whole_list, (wholeMatch, m1, m2, m3) ->
        runup = m1
        list = m2
        list_type = if m3.search(/[*+-]/g) > -1 then "ul" else "ol"
        list = list.replace(/\n{2,}/g, "\n\n\n")
        result = _ProcessListItems(list)
        result = runup + "<" + list_type + ">\n" + result + "</" + list_type + ">\n"
        return result
      )

    text = text.replace(/~0/, "")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _RunBlockGamut = (text) ->
    #
    # These are all the transformations that form block-level
    # tags like paragraphs, headers, and list items.
    #
    text = _DoHeaders(text)

    # Do Horizontal Rules:
    key = hashBlock("<hr />")

    text = text.replace(/^[\s]{0,2}([\s]?\*|\-|\_[\s]?){3,}[\t]*$/gm, key)
    text = _DoLists(text)
    text = _DoCodeBlocks(text)
    text = _DoBlockQuotes(text)

    # We already ran _HashHTMLBlocks() before, in Markdown(), but that
    # was to escape raw HTML in the original Markdown source. This time,
    # we're escaping the markup we've just created, so that we don't wrap
    # <p> tags around block-level tags.
    text = _HashHTMLBlocks(text)
    text = _FormParagraphs(text)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _ProcessListItems = (list_str) ->
    g_list_level += 1
    list_str = list_str.replace(/\n{2,}$/, "\n")
    list_str += "~0"
    list_str = list_str
      .replace(/(\n)?(^[\s\t]*)([*+-]|\d+[.])[\s\t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[\s\t]+))/gm, (wholeMatch, m1, m2, m3, m4) ->
        item = m4
        leading_line = m1
        leading_space = m2

        if leading_line || (item.search(/\n{2,}/) > -1)
          item = _RunBlockGamut(_Outdent(item))
        else
          item = _DoLists(_Outdent(item))
          item = item.replace(/\n$/, "");
          item = _RunSpanGamut(item)

        return "<li>" + item + "</li>\n"
      )
      .replace(/~0/g, "")

    g_list_level -= 1
    return list_str

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _DoBlockQuotes = (text) ->
    text = text.replace(/((^[\s\t]*>[\s\t]?.+\n(.+\n)*\n*)+)/gm, (wholeMatch, m1) ->
      bq = m1
        .replace(/^[\s\t]*>[\s\t]?/gm, "~0")
        .replace(/~0/g, "")
        .replace(/^[\s\t]+$/gm, "")
      bq = _RunBlockGamut(bq)

      bq = bq
        .replace(/(^|\n)/g, "$1  ")
        .replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, (wholeMatch, m1) ->
          pre = m1
            .replace(/^\s\s/mg, "~0")
            .replace(/~0/g, "")
        )

      return hashBlock("<blockquote>\n" + bq + "\n</blockquote>")
    )
    return text

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _FormParagraphs = (text) ->
    text = text
      .replace(/^\n+/g, "")
      .replace(/\n+$/g, "")

    grafs = text.split(/\n{2,}/g)
    grafsOut = []

    for i in grafs
      str = i

      if str.search(/~K(\d+)K/g) >= 0
        grafsOut.push(str)
      else if str.search(/\S/) >= 0
        str = _RunSpanGamut(str)
        str = str
          .replace(/\n/g,"<br />")        #  render newlines
          .replace(/^([\s\t]*)/g, "<p>")
        str += "</p>"
        grafsOut.push(str)


    for j in grafsOut
      while grafsOut[_j].search(/~K(\d+)K/) >= 0
        blockText = g_html_blocks[RegExp.$1]
        blockText = blockText.replace(/\$/g, "$$$$")
        grafsOut[_j] = grafsOut[_j].replace(/~K\d+K/, blockText)

    return grafsOut.join("\n\n")

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _StripLinkDefinitions = (text) ->
    # Strips link definitions from text, stores the URLs and titles in hash references

    # Link defs are in the form: ^[id]: url "optional title"
    text = text.replace(///
        ^[\s]{0,3}\[(.+)\]:  # id = $1  attacklab: g_tab_width - 1
        [\s\t]*
        \n?                  # maybe *one* newline
        [\s\t]*
        <?(\S+?)>?           # url = $2
        (?=\s|$)             # lookahead for whitespace instead of the lookbehind removed below
        [\s\t]*
        \n?                  # maybe one newline
        [\s\t]*
        (                    # (potential) title = $3
          (\n*)              # any lines skipped = $4 attacklab: lookbehind removed
          ["(]
          (.+?)              # title = $5
          [")]
          [\s\t]*
        )?                   # title is optional
        (?:\n+|$)
        ///gm, (wholeMatch, m1, m2, m3, m4, m5) ->
      m1 = m1.toLowerCase()
      g_urls.set(m1, _EncodeAmpsAndAngles(m2)) # Link IDs are case-insensitive

      if m4
        # found blank lines, so it's not a title.
        # put back the parenthetical statement we stole.
        return m3;
      else if m5
        g_titles.set(m1, m5.replace(/"/g, "&quot;"));

      # Completely remove the definition from the text
      return "";
    )

    return text

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  _HashHTMLBlocks = (text) ->

    # Hashify HTML blocks:
    # We only want to do this for block-level HTML tags, such as headers,
    # lists, and tables. That's because we still want to wrap <p>s around
    # "paragraphs" that are wrapped in non-block-level tags, such as anchors,
    # phrase emphasis, and spans. The list of tags we're looking for is
    # hard-coded:
    block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del"
    block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math"

    # First, look for nested blocks, e.g.:
    #   <div>
    #     <div>
    #     tags for inner block must be indented.
    #     </div>
    #   </div>
    #
    # The outermost tags must start at the left margin for this to match, and
    # the inner nested divs must be indented.
    # We need to do this before the next, more liberal match, because the next
    # match will start at the first `<div>` and stop at the first `</div>`.

    # attacklab: This regex can be expensive when it fails.

    ###
      text = text.replace(/
          (                       # save in $1
              ^                   # start of line  (with /m)
              <(block_tags_a)     # start tag = $2
              \b                  # word break
                                  # attacklab: hack around khtml/pcre bug...
              [^\r]*?\n           # any number of lines, minimally matching
              </\2>               # the matching end tag
              [\s\t]*              # trailing spaces/tabs
              (?=\n+)             # followed by a newline
          )                       # attacklab: there are sentinel newlines at end of document
      /gm,function(){...}};
     ###
    regex_tags_a = new RegExp("^(<(" + block_tags_a + ")\\b[^\\r]*?\\n<\\/\\2>[ \\t]*(?=\\n+))", "gm")
    regex_tags_b = new RegExp("^(<(" + block_tags_b + ")\\b[^\\r]*?.*<\\/\\2>[ \\t]*(?=\\n+)\\n)", "gm")

    text = text
      .replace(regex_tags_a, hashElement)
      .replace(regex_tags_b, hashElement)
      .replace(///
        \n              # Starting after a blank line
        [\s]{0,3}
        (               # save in $1
          (<(hr)        # start tag = $2
            \b          # word break
            ([^<>])*?
            /?>)        # the matching end tag
            [\s\t]*
            (?=\n{2,})
          )             # followed by a blank line
        ///g, hashElement)
      .replace(///
        \n\n                                         # Starting after a blank line
        [\s]{0,3}                                    # attacklab: g_tab_width - 1
        (                                            # save in $1
          <!
          (--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)  # see http://www.w3.org/TR/html-markup/syntax.html#comments and http://meta.stackoverflow.com/q/95256
          >
          [\s\t]*
          (?=\n{2,}))                                # followed by a blank line
        ///g, hashElement)
      .replace(///
        (?:
          \n\n         # Starting after a blank line
        )
        (              # save in $1
          [\s]{0,3}    # attacklab: g_tab_width - 1
          (?:
            <([?%])    # $2
            [^\r]*?
            \2>
          )
          [\s\t]
          *(?=\n{2,})  # followed by a blank line
        )
        ///g, hashElement)

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  hashElement = (wholeMatch, m1) ->
    blockText = m1
      # Undo double lines
      .replace(/^\n+/, "")

      # strip trailing blank lines
      .replace(/\n+$/g, "")

    # Replace the element text with a marker ("~KxK" where x is its key)
    blockText = "\n\n~K" + (g_html_blocks.push(blockText) - 1) + "K\n\n"

  # # # # # # # # # # # # # # # # # # # # # # # # # # #

  return this

# expose Darkmown to global object
@.Darkmown = Darkmown

if (typeof define == 'function' && typeof define.amd == 'object' && define.amd)
  define( -> Darkmown )