import youtubedl from 'youtube-dl-exec';
youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { dumpSingleJson: true, noWarnings: true })
  .then(info => console.log('Success:', info.title))
  .catch(err => console.error('Error:', err.message));
