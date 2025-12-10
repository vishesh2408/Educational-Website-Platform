const sanitizeHtml = require('sanitize-html');

function cleanHtml(inputHtml) {
  if (!inputHtml) return inputHtml;
  try {
    const options = {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','h4','h5','h6','img','iframe','figure','figcaption']),
      allowedAttributes: Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
        a: (sanitizeHtml.defaults.allowedAttributes.a || []).concat(['href','name','target','rel']),
        img: ['src','alt','width','height','loading'],
        iframe: ['src','allow','allowfullscreen','frameborder','loading']
      }),
      allowedIframeHostnames: ['www.youtube.com','youtube.com','player.vimeo.com','www.youtube-nocookie.com','youtube-nocookie.com']
    };
    return sanitizeHtml(inputHtml, options);
  } catch (e) {
    console.warn('sanitize-html failed during cleanHtml:', e.message);
    return inputHtml;
  }
}

const samples = [
  {
    name: 'script tag',
    html: '<p>Hello</p><script>alert("xss")</script>'
  },
  {
    name: 'img with onerror',
    html: '<p>Image</p><img src="/x.jpg" onerror="alert(1)" />'
  },
  {
    name: 'youtube iframe',
    html: '<p>Video:</p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>'
  },
  {
    name: 'bad iframe host',
    html: '<iframe src="https://evil.example.com/embed.js"></iframe>'
  },
  {
    name: 'javascript href',
    html: '<a href="javascript:alert(1)">click</a>'
  }
];

for (const s of samples) {
  console.log('---', s.name, '---');
  console.log('Input:');
  console.log(s.html);
  console.log('Cleaned:');
  console.log(cleanHtml(s.html));
  console.log('\n');
}
