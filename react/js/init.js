function highlightCode() {
  var nodes = document.querySelectorAll("script[type='text/code']");
  for (var i = 0; i < nodes.length; i++) {
    var script = nodes[i];
    var text = script.text
      .trim()
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");

    var pre = document.createElement("pre");
    pre.className = script.className;
    var code = document.createElement("code");
    code.innerHTML = text;
    pre.appendChild(code);

    script.parentElement.replaceChild(pre, script);
    hljs.configure({
      languages: ["javascript", "html"]
    });
    hljs.highlightBlock(pre);
  }
}

Reveal.initialize({
  width: 1000,
  height: 750,
  margin: 0.05,
  controls: false,
  progress: true,
  history: true,
  center: false,
  slideNumber: true,
  overview: false,

  theme: Reveal.getQueryHash().theme || 'danford', // available themes are in /css/theme
  transition: Reveal.getQueryHash().transition || 'none', // default/cube/page/concave/zoom/linear/fade/none

  dependencies: [
    { src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
    { src: '//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.4/highlight.min.js', async: true, callback: highlightCode },
  ]
});
