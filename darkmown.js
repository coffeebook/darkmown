
/*
# darkmown.js is a CoffeeScript port of Markdown
# Copyright (c) 2012 Denis Ciccale (@tdecs)
# https://github.com/dciccale/darkmown
#
# Original Markdown Copyright (c) 2004-2005 John Gruber
# http://daringfireball.net/projects/markdown/
#
# Inspired by showdown.js
# https://github.com/coreyti/showdown
*/

(function() {
  var Darkmown;

  if (typeof exports === "object" && typeof require === "function") {
    Darkmown = exports;
  } else {
    Darkmown = {};
  }

  Darkmown.converter = function() {
    var SafeHash, encodeProblemUrlChars, escapeCharacters, escapeCharacters_callback, g_html_blocks, g_list_level, g_titles, g_urls, hashBlock, hashElement, prev_html, prev_text, writeAnchorTag, writeImageTag, _Detab, _DoAnchors, _DoAutoLinks, _DoBlockQuotes, _DoCodeBlocks, _DoCodeSpans, _DoHeaders, _DoImages, _DoItalicsAndBold, _DoLists, _EncodeAmpsAndAngles, _EncodeBackslashEscapes, _EncodeCode, _EncodeEmailAddress, _EscapeSpecialCharsWithinTagAttributes, _FormParagraphs, _HashHTMLBlocks, _Outdent, _ProcessListItems, _RunBlockGamut, _RunSpanGamut, _StripLinkDefinitions, _UnescapeSpecialChars;
    SafeHash = (function() {

      function SafeHash() {}

      SafeHash.prototype.set = function(key, value) {
        return this["s_" + key] = value;
      };

      SafeHash.prototype.get = function(key) {
        return this["s_" + key];
      };

      return SafeHash;

    })();
    g_urls = new SafeHash();
    g_titles = new SafeHash();
    g_html_blocks = [];
    g_list_level = 0;
    prev_text = '';
    prev_html = '';
    this.makeHtml = function(text) {
      if (!text) return '';
      if (prev_text !== text) {
        prev_text = text;
      } else if (prev_text === text) {
        return prev_html;
      }
      text = text.replace(/~/g, "~T").replace(/\$/g, "~D").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      text = "\n\n" + text + "\n\n";
      text = _Detab(text);
      text = text.replace(/^[\s\t]+$/mg, "");
      text = _HashHTMLBlocks(text);
      text = _StripLinkDefinitions(text);
      text = _RunBlockGamut(text);
      text = _UnescapeSpecialChars(text);
      text = text.replace(/~D/g, "$$").replace(/~T/g, "~");
      /*
              left = text.slice(0, matchIndex)
              right = text.slice(matchIndex)
              if left.match(/<[^>]+$/) && right.match(/^[^>]*>/)
                return wholeMatch
      
      
              href = wholeMatch.replace(/^www/, "http://www")
              return "<a href='" + href + "'>" + wholeMatch + "</a>"
            )
      */
      prev_html = text;
      return text;
    };
    escapeCharacters_callback = function(wholeMatch, m1) {
      var charCodeToEscape;
      charCodeToEscape = m1.charCodeAt(0);
      return "~E" + charCodeToEscape + "E";
    };
    encodeProblemUrlChars = function(url) {
      var len, _problemUrlChars;
      _problemUrlChars = /(?:["'*()[\]:]|~D)/g;
      if (!url) return "";
      len = url.length;
      return url.replace(_problemUrlChars, function(match, offset) {
        if (match === "~D") return "%24";
        if (match === ":") {
          if (offset === len - 1 || /[0-9\/]/.test(url.charAt(offset + 1))) {
            return ":";
          }
        }
        return "%" + match.charCodeAt(0).toString(16);
      });
    };
    escapeCharacters = function(text, charsToEscape, afterBackslash) {
      var regex, regexString;
      regexString = "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])";
      if (afterBackslash) regexString = "\\\\" + regexString;
      regex = new RegExp(regexString, "g");
      return text = text.replace(regex, escapeCharacters_callback);
    };
    _EncodeCode = function(text) {
      text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return text = escapeCharacters(text, "\*_{}[]\\", false);
    };
    _Outdent = function(text) {
      return text = text.replace(/^(\t|[\s]{1,4})/gm, "~0").replace(/~0/g, "");
    };
    _Detab = function(text) {
      var skew, spaces;
      if (!/\t/.test(text)) return text;
      spaces = ["    ", "   ", "  ", " "];
      skew = 0;
      return text.replace(/[\n\t]/g, function(match, offset) {
        var v;
        if (match === "\n") {
          skew = offset + 1;
          return match;
        }
        v = (offset - skew) % 4;
        skew = offset + 1;
        return spaces[v];
      });
    };
    hashBlock = function(text) {
      text = text.replace(/(^\n+|\n+$)/g, "");
      return "\n\n~K" + (g_html_blocks.push(text) - 1) + "K\n\n";
    };
    _DoCodeBlocks = function(text) {
      text += "~0";
      return text = text.replace(/(?:\n\n|^)((?:(?:[]{4}|\t).*\n+)+)(\n*[]{0,3}[^\t\n]|(?=~0))/g, function(wholeMatch, m1, m2) {
        var codeblock, nextChar;
        codeblock = m1;
        nextChar = m2;
        codeblock = _EncodeCode(_Outdent(codeblock));
        codeblock = _Detab(codeblock);
        codeblock = codeblock.replace(/^\n+/g, "").replace(/\n+$/g, "");
        codeblock = "<pre><code>" + codeblock + "\n</code></pre>";
        return hashBlock(codeblock) + nextChar;
      }).replace(/~0/, "");
    };
    _DoCodeSpans = function(text) {
      return text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm, function(wholeMatch, m1, m2, m3, m4) {
        var c;
        c = m3;
        c = c.replace(/^([\s\t]*)/g, "").replace(/[\s\t]*$/g, "");
        c = _EncodeCode(c);
        return m1 + "<code>" + c + "</code>";
      });
    };
    _DoItalicsAndBold = function(text) {
      return text = text.replace(/([\W_]|^)(\*\*|__)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g, "$1<strong>$3</strong>$4").replace(/([\W_]|^)(\*|_)(?=\S)([^\r\*_]*?\S)\2([\W_]|$)/g, "$1<em>$3</em>$4");
    };
    _EscapeSpecialCharsWithinTagAttributes = function(text) {
      return text = text.replace(/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>)/gi, function(wholeMatch) {
        var tag;
        tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, "$1`");
        return tag = escapeCharacters(tag, wholeMatch.charAt(1) === "!" ? "\\`*_/" : "\\`*_");
      });
    };
    _EncodeBackslashEscapes = function(text) {
      return text = text.replace(/\\(\\)/g, escapeCharacters_callback).replace(/\\([`*_{}\[\]()>#+-.!])/g, escapeCharacters_callback);
    };
    writeImageTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
      var alt_text, link_id, result, title, url, whole_match;
      whole_match = m1;
      alt_text = m2;
      link_id = m3.toLowerCase();
      url = m4;
      title = m7;
      if (!title) title = "";
      if (url === "") {
        if (link_id === "") {
          link_id = alt_text.toLowerCase().replace(/\s?\n/g, " ");
        }
        url = "#" + link_id;
        if (g_urls.get(link_id) !== void 0) {
          url = g_urls.get(link_id);
          if (g_titles.get(link_id) !== void 0) title = g_titles.get(link_id);
        } else {
          return whole_match;
        }
      }
      alt_text = alt_text.replace(/"/g, "&quot;");
      url = escapeCharacters(url, "*_");
      result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";
      title = title.replace(/"/g, "&quot;");
      title = escapeCharacters(title, "*_");
      return result += " title=\"" + title + "\" />";
    };
    _DoImages = function(text) {
      return text = text.replace(/(!\[(.*?)\][\s]?(?:\n[\s]*)?\[(.*?)\])()()()()/g, writeImageTag).replace(/(!\[(.*?)\]\s?\([\s\t]*()<?(\S+?)>?[\s\t]*((['"])(.*?)\6[\s\t]*)?\))/g, writeImageTag);
    };
    writeAnchorTag = function(wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
      var link_id, link_text, result, title, url, whole_match;
      if (m7 === void 0) m7 = "";
      whole_match = m1;
      link_text = m2.replace(/:\/\//g, "&#58;//");
      link_id = m3.toLowerCase();
      url = m4;
      title = m7;
      if (url === "") {
        if (link_id === "") {
          link_id = link_text.toLowerCase().replace(/\s?\n/g, " ");
        }
        url = "#" + link_id;
        if (g_urls.get(link_id) !== void 0) {
          url = g_urls.get(link_id);
          if (g_titles.get(link_id) !== void 0) title = g_titles.get(link_id);
        } else {
          if (whole_match.search(/\(\s*\)$/m) > -1) {
            url = "";
          } else {
            return whole_match;
          }
        }
      }
      url = encodeProblemUrlChars(url);
      url = escapeCharacters(url, "*_");
      if (!/(https?|ftp|dict):\/\//.test(url)) url = 'http://' + url;
      result = "<a href=\"" + url + "\"";
      if (title !== "") {
        title = title.replace(/"/g, "&quot;");
        title = escapeCharacters(title, "*_");
        result += " title=\"" + title + "\"";
      }
      return result += ">" + link_text + "</a>";
    };
    _DoAnchors = function(text) {
      return text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][\s]?(?:\n[\s]*)?\[(.*?)\])()()()()/g, writeAnchorTag).replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([\s\t]*()<?((?:\([^)]*\)|[^()])*?)>?[\s\t]*((['"])(.*?)\6[\s\t]*)?\))/g, writeAnchorTag).replace(/(\[([^\[\]]+)\])()()()()()/g, writeAnchorTag);
    };
    _UnescapeSpecialChars = function(text) {
      return text = text.replace(/~E(\d+)E/g, function(wholeMatch, m1) {
        var charCodeToReplace;
        charCodeToReplace = parseInt(m1, 10);
        return String.fromCharCode(charCodeToReplace);
      });
    };
    _EncodeEmailAddress = function(addr) {
      var char2hex, encode;
      char2hex = function(ch) {
        var dec, hexDigits;
        hexDigits = '0123456789ABCDEF';
        dec = ch.charCodeAt(0);
        return hexDigits.charAt(dec >> 4) + hexDigits.charAt(dec & 15);
      };
      encode = [
        function(ch) {
          return "&#" + ch.charCodeAt(0) + ";";
        }, function(ch) {
          return "&#x" + char2hex(ch) + ";";
        }, function(ch) {
          return ch;
        }
      ];
      addr = "mailto:" + addr;
      addr = addr.replace(/./g, function(ch) {
        var r;
        if (ch === "@") {
          ch = encode[Math.floor(Math.random() * 2)](ch);
        } else if (ch !== ":") {
          r = Math.random();
          ch = r > .9 ? encode[2](ch) : r > .45 ? encode[1](ch) : encode[0](ch);
        }
        return ch;
      });
      addr = "<a href=\"" + addr + "\">" + addr + "</a>";
      return addr = addr.replace(/">.+:/g, "\">");
    };
    _DoAutoLinks = function(text) {
      var i, replaceUrls, url, urls, _len;
      urls = text.split(/\n/);
      replaceUrls = function(i, url) {
        if (/(^|\s+)<(a|i|ul)/.test(url)) return url;
        return urls[i] = urls[i].replace(/(>\n)?((https?|ftp|dict):\/\/|www\.)[^'">\s]+/gi, function(wholeMatch, m1, m2) {
          var link;
          link = wholeMatch;
          if (m2 === 'www.') {
            link = 'http://' + link;
            link = link.replace(/[<>]/g, '');
            wholeMatch = wholeMatch.replace(/[<>]/g, '');
          }
          return "<a href=\"" + link + "\">" + wholeMatch + "</a>";
        });
      };
      if (urls.length > 0) {
        for (i = 0, _len = urls.length; i < _len; i++) {
          url = urls[i];
          replaceUrls(i, url);
        }
      }
      return text = urls.join('\n').replace(/(?:mailto:)?([\-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)/gi, function(wholeMatch, m1) {
        return _EncodeEmailAddress(_UnescapeSpecialChars(m1));
      });
    };
    _EncodeAmpsAndAngles = function(text) {
      return text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;").replace(/<(?![a-z\/?\$!])/gi, "&lt;");
    };
    _RunSpanGamut = function(text) {
      text = _DoCodeSpans(text);
      text = _EscapeSpecialCharsWithinTagAttributes(text);
      text = _EncodeBackslashEscapes(text);
      text = _DoImages(text);
      text = _DoAnchors(text);
      text = _DoAutoLinks(text);
      text = _EncodeAmpsAndAngles(text);
      text = _DoItalicsAndBold(text);
      return text = text.replace(/\s\s+\n/g, " <br />\n");
    };
    _DoHeaders = function(text) {
      return text = text.replace(RegExp("^(\\#{1,6})[\\s\\t]*(.+?)[\\s\\t]*\\#*\\n+", "gm"), function(wholeMatch, m1, m2) {
        var h_level;
        h_level = m1.length;
        return hashBlock("<h" + h_level + ">" + _RunSpanGamut(m2) + "</h" + h_level + ">");
      });
    };
    _DoLists = function(text) {
      var whole_list;
      text += "~0";
      whole_list = /^(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/gm;
      if (g_list_level) {
        text = text.replace(whole_list, function(wholeMatch, m1, m2) {
          var list, list_type, result;
          list = m1;
          list_type = m2.search(/[*+-]/g) > -1 ? "ul" : "ol";
          list = list.replace(/\n{2,}/g, "\n\n\n");
          result = _ProcessListItems(list);
          result = result.replace(/\s+$/, "");
          result = "<" + list_type + ">" + result + "</" + list_type + ">\n";
          return result;
        });
      } else {
        whole_list = /(\n\n|^\n?)(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/g;
        text = text.replace(whole_list, function(wholeMatch, m1, m2, m3) {
          var list, list_type, result, runup;
          runup = m1;
          list = m2;
          list_type = m3.search(/[*+-]/g) > -1 ? "ul" : "ol";
          list = list.replace(/\n{2,}/g, "\n\n\n");
          result = _ProcessListItems(list);
          result = runup + "<" + list_type + ">\n" + result + "</" + list_type + ">\n";
          return result;
        });
      }
      return text = text.replace(/~0/, "");
    };
    _RunBlockGamut = function(text) {
      var key;
      text = _DoHeaders(text);
      key = hashBlock("<hr />");
      text = text.replace(/^[\s]{0,2}([\s]?\*|\-|\_[\s]?){3,}[\t]*$/gm, key);
      text = _DoLists(text);
      text = _DoCodeBlocks(text);
      text = _DoBlockQuotes(text);
      text = _HashHTMLBlocks(text);
      return text = _FormParagraphs(text);
    };
    _ProcessListItems = function(list_str) {
      g_list_level += 1;
      list_str = list_str.replace(/\n{2,}$/, "\n");
      list_str += "~0";
      list_str = list_str.replace(/(\n)?(^[\s\t]*)([*+-]|\d+[.])[\s\t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[\s\t]+))/gm, function(wholeMatch, m1, m2, m3, m4) {
        var item, leading_line, leading_space;
        item = m4;
        leading_line = m1;
        leading_space = m2;
        if (leading_line || (item.search(/\n{2,}/) > -1)) {
          item = _RunBlockGamut(_Outdent(item));
        } else {
          item = _DoLists(_Outdent(item));
          item = item.replace(/\n$/, "");
          item = _RunSpanGamut(item);
        }
        return "<li>" + item + "</li>\n";
      }).replace(/~0/g, "");
      g_list_level -= 1;
      return list_str;
    };
    _DoBlockQuotes = function(text) {
      text = text.replace(/((^[\s\t]*>[\s\t]?.+\n(.+\n)*\n*)+)/gm, function(wholeMatch, m1) {
        var bq;
        bq = m1.replace(/^[\s\t]*>[\s\t]?/gm, "~0").replace(/~0/g, "").replace(/^[\s\t]+$/gm, "");
        bq = _RunBlockGamut(bq);
        bq = bq.replace(/(^|\n)/g, "$1  ").replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, function(wholeMatch, m1) {
          var pre;
          return pre = m1.replace(/^\s\s/mg, "~0").replace(/~0/g, "");
        });
        return hashBlock("<blockquote>\n" + bq + "\n</blockquote>");
      });
      return text;
    };
    _FormParagraphs = function(text) {
      var blockText, grafs, grafsOut, i, j, str, _i, _j, _len, _len2;
      text = text.replace(/^\n+/g, "").replace(/\n+$/g, "");
      grafs = text.split(/\n{2,}/g);
      grafsOut = [];
      for (_i = 0, _len = grafs.length; _i < _len; _i++) {
        i = grafs[_i];
        str = i;
        if (str.search(/~K(\d+)K/g) >= 0) {
          grafsOut.push(str);
        } else if (str.search(/\S/) >= 0) {
          str = _RunSpanGamut(str);
          str = str.replace(/\n/g, "<br />").replace(/^([\s\t]*)/g, "<p>");
          str += "</p>";
          grafsOut.push(str);
        }
      }
      for (_j = 0, _len2 = grafsOut.length; _j < _len2; _j++) {
        j = grafsOut[_j];
        while (grafsOut[_j].search(/~K(\d+)K/) >= 0) {
          blockText = g_html_blocks[RegExp.$1];
          blockText = blockText.replace(/\$/g, "$$$$");
          grafsOut[_j] = grafsOut[_j].replace(/~K\d+K/, blockText);
        }
      }
      return grafsOut.join("\n\n");
    };
    _StripLinkDefinitions = function(text) {
      text = text.replace(/^[\s]{0,3}\[(.+)\]:[\s\t]*\n?[\s\t]*<?(\S+?)>?(?=\s|$)[\s\t]*\n?[\s\t]*((\n*)["(](.+?)[")][\s\t]*)?(?:\n+|$)/gm, function(wholeMatch, m1, m2, m3, m4) {
        m1 = m1.toLowerCase();
        g_urls.set(m1, _EncodeAmpsAndAngles(m2));
        if (m4) {
          return m3;
        } else if (m5) {
          g_titles.set(m1, m5.replace(/"/g, "&quot;"));
        }
        return "";
      });
      return text;
    };
    _HashHTMLBlocks = function(text) {
      var block_tags_a, block_tags_b, regex_tags_a, regex_tags_b;
      block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del";
      block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math";
      /*
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
      */
      regex_tags_a = new RegExp("^(<(" + block_tags_a + ")\\b[^\\r]*?\\n<\\/\\2>[ \\t]*(?=\\n+))", "gm");
      regex_tags_b = new RegExp("^(<(" + block_tags_b + ")\\b[^\\r]*?.*<\\/\\2>[ \\t]*(?=\\n+)\\n)", "gm");
      return text = text.replace(regex_tags_a, hashElement).replace(regex_tags_b, hashElement).replace(/\n[\s]{0,3}((<(hr)\b([^<>])*?\/?>)[\s\t]*(?=\n{2,}))/g, hashElement).replace(/\n\n[\s]{0,3}(<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>[\s\t]*(?=\n{2,}))/g, hashElement).replace(/(?:\n\n)([\s]{0,3}(?:<([?%])[^\r]*?\2>)[\s\t]*(?=\n{2,}))/g, hashElement);
    };
    hashElement = function(wholeMatch, m1) {
      var blockText;
      blockText = m1.replace(/^\n+/, "").replace(/\n+$/g, "");
      return blockText = "\n\n~K" + (g_html_blocks.push(blockText) - 1) + "K\n\n";
    };
    return this;
  };

  this.Darkmown = Darkmown;

}).call(this);
