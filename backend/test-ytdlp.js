import ytdlp from 'yt-dlp-exec';
ytdlp('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { dumpSingleJson: true, noWarnings: true })
  .then(info => console.log('Success:', info.title))
  .catch(err => console.error('Error:', err.message));
