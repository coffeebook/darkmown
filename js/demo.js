/*
darkmown.js is a CoffeeScript port of Markdown
Copyright (c) 2012 Denis Ciccale (@tdecs)
https://github.com/dciccale/darkmown

Original Markdown Copyright (c) 2004-2005 John Gruber
http://daringfireball.net/projects/markdown/

Inspired by showdown.js
https://github.com/coreyti/showdown
*/
(function(){var m;this.Darkmown=m={converter:function(){var v,m,h,o,p,i,j,k,n,l,w,q,r,x,y,F,G,H,I,J,K,L,M,z,A,N,B,O,P,Q,C,s,D,t,u,R,E;v=function(){function a(){}a.prototype.set=function(a,b){return this["s_"+a]=b};a.prototype.get=function(a){return this["s_"+a]};return a}();k=new v;j=new v;p=[];i=0;w=q="";this.makeHtml=function(a){if(!a)return"";if(q!==a)q=a;else if(q===a)return w;a=a.replace(/~/g,"~T").replace(/\$/g,"~D").replace(/\r\n/g,"\n").replace(/\r/g,"\n");a=y("\n\n"+a+"\n\n");a=a.replace(/^[ \t]+$/mg,"");a=C(a);a=R(a);a=t(a);a=E(a);return w=a=a.replace(/~D/g,"$$").replace(/~T/g,"~")};o=function(a,c){return"~E"+c.charCodeAt(0)+"E"};m=function(a){var c;if(!a)return"";c=a.length;return a.replace(/(?:["'*()[\]:]|~D)/g,function(b,d){return"~D"===b?"%24":":"===b&&(d===c-1||/[0-9\/]/.test(a.charAt(d+1)))?":":"%"+b.charCodeAt(0).toString(16)})};h=function(a,c,b){c="(["+c.replace(/([\[\]\\])/g,"\\$1")+"])";b&&(c="\\\\"+c);return a.replace(RegExp(c,"g"),o)};B=function(a){a=a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return h(a,"*_{}[]\\",!1)};s=function(a){return a.replace(/^(\t|[\s]{1,4})/gm,"~0").replace(/~0/g,"")};y=function(a){var c,b;if(!/\t/.test(a))return a;b=["    ","   ","  "," "];c=0;return a.replace(/[\n\t]/g,function(a,e){var g;if("\n"===a)return c=e+1,a;g=(e-c)%4;c=e+1;return b[g]})};n=function(a){a=a.replace(/(^\n+|\n+$)/g,"");return"\n\n~K"+(p.push(a)-1)+"K\n\n"};I=function(a){return a=(a+"~0").replace(/(?:\n\n|^)((?:(?:[\x20]{4}|\t).*\n+)+)(\n*[\x20]{0,3}[^\t\n]|(?=~0))/g,function(a,b,d){a=B(s(b));a=y(a);a=a.replace(/^\n+/g,"").replace(/\n+$/g,"");return n("<pre><code>"+a+"\n</code></pre>")+d}).replace(/~0/,"")};J=function(a){return a=a.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,function(a,b,d,e){e=e.replace(/^[\s\t]*|[\s\t]*$/g,"");e=B(e);return b+"<code>"+e+"</code>"})};M=function(a){return a.replace(/([\W_]|^)(\*\*|__)(?=\S)([^\r]*?\S[\*_]*)\2([\W_]|$)/g,"$1<strong>$3</strong>$4").replace(/([\W_]|^)(\*|_|\/\/)(?=\S)([^\r\*_\/\/]*?\S)\2([\W_]|$)/g,"$1<em>$3</em>$4")};P=function(a){return a=a.replace(/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>)/gi,function(a){var b;b=a.replace(/(.)<\/?code>(?=.)/g,"$1`");return h(b,"!"===a.charAt(1)?"\\`*_/":"\\`*_")})};N=function(a){return a.replace(/\\(\\)/g,o).replace(/\\([`*_{}\[\]()>#+-.!])/g,o)};x=function(a,c,b,d,e,g,S,f){a=b;d=d.toLowerCase();f||(f="");if(""===e)if(""===d&&(d=a.toLowerCase().replace(/\s?\n/g," ")),void 0!==k.get(d))e=k.get(d),void 0!==j.get(d)&&(f=j.get(d));else return c;a=a.replace(/"/g,"&quot;");e=h(e,"*_");c='<img src="'+e+'" alt="'+a+'"';f=f.replace(/"/g,"&quot;");f=h(f,"*_");return c+(' title="'+f+'" />')};L=function(a){return a.replace(/(!\[(.*?)\][\s]?(?:\n[\s]*)?\[(.*?)\])()()()()/g,x).replace(/(!\[(.*?)\]\s?\([\s\t]*()<?(\S+?)>?[\s\t]*((['"])(.*?)\6[\s\t]*)?\))/g,x)};r=function(a,c,b,d,e,g,S,f){void 0===f&&(f="");a=b.replace(/:\/\//g,"&#58;//");d=d.toLowerCase();if(""===e)if(""===d&&(d=a.toLowerCase().replace(/\s?\n/g," ")),void 0!==k.get(d))e=k.get(d),void 0!==j.get(d)&&(f=j.get(d));else if(-1<c.search(/\(\s*\)$/m))e="";else return c;e=m(e);e=h(e,"*_");/(https?|ftp|dict):\/\//.test(e)||(e="http://"+e);c='<a href="'+e+'"';""!==f&&(f=f.replace(/"/g,"&quot;"),f=h(f,"*_"),c+=' title="'+f+'"');return c+(">"+a+"</a>")};F=function(a){return a.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][\s]?(?:\n[\s]*)?\[(.*?)\])()()()()/g,r).replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([\s\t]*()<?((?:\([^)]*\)|[^()])*?)>?[\s\t]*((['"])(.*?)\6[\s\t]*)?\))/g,r).replace(/(\[([^\[\]]+)\])()()()()()/g,r)};E=function(a){return a=a.replace(/~E(\d+)E/g,function(a,b){var d;d=parseInt(b,10);return String.fromCharCode(d)})};O=function(a){var c,b;c=function(a){a=a.charCodeAt(0);return"0123456789ABCDEF".charAt(a>>4)+"0123456789ABCDEF".charAt(a&15)};b=[function(a){return"&#"+a.charCodeAt(0)+";"},function(a){return"&#x"+c(a)+";"},function(a){return a}];a=("mailto:"+a).replace(/./g,function(a){var c;"@"===a?a=b[Math.floor(2*Math.random())](a):":"!==a&&(c=Math.random(),a=0.9<c?b[2](a):0.45<c?b[1](a):b[0](a));return a});return a=('<a href="'+a+'">'+a+"</a>").replace(/">.+:/g,'">')};G=function(a){var c,b,d,e;d=a.split(/\n/);c=function(a,b){return/(^|\s+)<(a|i|ul)/.test(b)?b:d[a]=d[a].replace(/(>\n)?((https?|ftp|dict):\/\/|www\.)[^'">\s\<]+/gi,function(a,b,c){b=a;"www."===c&&(b="http://"+b);return'<a href="'+b+'">'+a+"</a>"})};if(0<d.length){a=0;for(e=d.length;a<e;a++)b=d[a],c(a,b)}return a=d.join("\n").replace(/(?:mailto:)?([\-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)/gi,function(a,b){return O(E(b))})};A=function(a){return a.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;").replace(/<(?![a-z\/?\$!])/gi,"&lt;")};u=function(a){a=J(a);a=P(a);a=N(a);a=L(a);a=F(a);a=G(a);a=A(a);a=M(a);return a.replace(/\s\s+\n/g," <br />\n")};K=function(a){return a=a.replace(RegExp("^(\\#{1,6})[\\s\\t]*(.+?)[\\s\\t]*\\#*\\n+","gm"),function(a,b,d){a=b.length;return n("<h"+a+">"+u(d)+"</h"+a+">")})};z=function(a){var c,a=a+"~0";c=/^(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/gm;i?a=a.replace(c,function(a,c,e){a=c;e=-1<e.search(/[*+-]/g)?"ul":"ol";a=a.replace(/\n{2,}/g,"\n\n\n");a=D(a);a=a.replace(/\s+$/,"");return"<"+e+">"+a+"</"+e+">\n"}):(c=/(\n\n|^\n?)(([\s]{0,3}([*+-]|\d+[.])[\s\t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![\s\t]*(?:[*+-]|\d+[.])[\s\t]+)))/g,a=a.replace(c,function(a,c,e,g){a=e;g=-1<g.search(/[*+-]/g)?"ul":"ol";a=a.replace(/\n{2,}/g,"\n\n\n");a=D(a);return c+"<"+g+">\n"+a+"</"+g+">\n"}));return a=a.replace(/~0/,"")};t=function(a){var c,a=K(a);c=n("<hr />");a=a.replace(/^[\s]{0,2}([\s]?\*|\-|\_[\s]?){3,}[\t]*$/gm,c);a=z(a);a=I(a);a=H(a);a=C(a);return Q(a)};D=function(a){i+=1;a=a.replace(/\n{2,}$/,"\n");a=(a+"~0").replace(/(\n)?(^[\s\t]*)([*+-]|\d+[.])[\s\t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[\s\t]+))/gm,function(a,b,d,e,g){a=g;b||-1<a.search(/\n{2,}/)?a=t(s(a)):(a=z(s(a)),a=a.replace(/\n$/,""),a=u(a));return"<li>"+a+"</li>\n"}).replace(/~0/g,"");i-=1;return a};H=function(a){return a=a.replace(/((^[\s\t]*>[\s\t]?.+\n(.+\n)*\n*)+)/gm,function(a,b){var d;d=b.replace(/^[\s\t]*>[\s\t]?/gm,"~0").replace(/~0/g,"").replace(/^[\s\t]+$/gm,"");d=t(d);d=d.replace(/(^|\n)/g,"$1  ").replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,function(a,b){return b.replace(/^\s\s/mg,"~0").replace(/~0/g,"")});return n("<blockquote>\n"+d+"\n</blockquote>")})};Q=function(a){var c,b,d,e,a=a.replace(/^\n+/g,"").replace(/\n+$/g,"");c=a.split(/\n{2,}/g);a=[];d=0;for(e=c.length;d<e;d++)b=c[d],0<=b.search(/~K(\d+)K/g)?a.push(b):0<=b.search(/\S/)&&(b=u(b),b=b.replace(/\n/g,"<br />").replace(/^([\s\t]*)/g,"<p>"),b+="</p>",a.push(b));d=0;for(e=a.length;d<e;d++)for(;0<=a[d].search(/~K(\d+)K/);)c=p[RegExp.$1],c=c.replace(/\$/g,"$$$$"),a[d]=a[d].replace(/~K\d+K/,c);return a.join("\n\n")};R=function(a){return a=a.replace(/^[\s]{0,3}\[(.+)\]:[\s\t]*\n?[\s\t]*<?(\S+?)>?(?=\s|$)[\s\t]*\n?[\s\t]*((\n*)["(](.+?)[")][\s\t]*)?(?:\n+|$)/gm,function(a,b,d,e,g,h){b=b.toLowerCase();k.set(b,A(d));if(g)return e;h&&j.set(b,h.replace(/"/g,"&quot;"));return""})};C=function(a){var c,b;c=RegExp("^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\\b[^\\r]*?\\n<\\/\\2>[ \\t]*(?=\\n+))","gm");b=RegExp("^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math)\\b[^\\r]*?.*<\\/\\2>[ \\t]*(?=\\n+)\\n)","gm");return a.replace(c,l).replace(b,l).replace(/\n[\s]{0,3}((<(hr)\b([^<>])*?\/?>)[\s\t]*(?=\n{2,}))/g,l).replace(/\n\n[\s]{0,3}(<!(--(?:|(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>[\s\t]*(?=\n{2,}))/g,l).replace(/(?:\n\n)([\s]{0,3}(?:<([?%])[^\r]*?\2>)[\s\t]*(?=\n{2,}))/g,l)};l=function(a,c){var b;b=c.replace(/^\n+/,"").replace(/\n+$/g,"");return"\n\n~K"+(p.push(b)-1)+"K\n\n"};return this}};"function"===typeof define&&("object"===typeof define.amd&&define.amd)&&define(function(){return m})}).call(this);

// bootstrap-dropdown
!function(c){function f(){c(g).parent().removeClass("open")}var g='[data-toggle="dropdown"]',d=function(b){var a=c(b).on("click.dropdown.data-api",this.toggle);c("html").on("click.dropdown.data-api",function(){a.parent().removeClass("open")})};d.prototype={constructor:d,toggle:function(){var b=c(this),a;if(!b.is(".disabled, :disabled"))return a=b.attr("data-target"),a||(a=(a=b.attr("href"))&&a.replace(/.*(?=#[^\s]*$)/,"")),a=c(a),a.length||(a=b.parent()),b=a.hasClass("open"),f(),b||a.toggleClass("open"),!1}};c.fn.dropdown=function(b){return this.each(function(){var a=c(this),e=a.data("dropdown");e||a.data("dropdown",e=new d(this));"string"==typeof b&&e[b].call(a)})};c.fn.dropdown.Constructor=d;c(function(){c("html").on("click.dropdown.data-api",f);c("body").on("click.dropdown",".dropdown form",function(b){b.stopPropagation()}).on("click.dropdown.data-api",g,d.prototype.toggle)})}(window.jQuery);

// demo script
(function () {
  var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/markdown");

    var converter = new Darkmown.converter()
    var $userInput = $('#editor')
    var $renderedResult = $('#rendered_result')
    var $htmlResult = $('#html_result')
    var previews = {
      live_preview: $('#live_preview'),
      html_preview: $('#html_preview')
    }

    var showResult = function () {
      var value = editor.getSession().getDocument().getValue();
      var html = converter.makeHtml(value);
      var escapedHtml = html.replace(/>/g, "&gt")
        .replace(/</g, "&lt")
        .replace(/\n{2,}/g, "<br/><br/>");

      $renderedResult.html(html);
      $htmlResult.html(escapedHtml);
    };

    var activePreview = null
    var lastActive = null

    $('#select_preview').on('click', 'a', function (ev) {
      ev.preventDefault();
      var $this = $(this);
      var show = $this.data('show');

      if (activePreview && activePreview[0].id === show) {
        return;
      }

      if (lastActive) {
        lastActive.removeClass('active');
      }

      lastActive = $(this).parent().addClass('active');

      activePreview = previews[show].show();
      previews[$this.data('hide')].hide();
    })
      .find('a').first().click();

    $userInput.keyup(showResult);

    showResult();

}());
