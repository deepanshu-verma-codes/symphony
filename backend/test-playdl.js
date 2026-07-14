import play from 'play-dl';
const run = async () => {
  try {
    const info = await play.video_info('https://www.youtube.com/watch?v=5QsfJaAwEX4');
    console.log("Got info");
    const stream = await play.stream_from_info(info, { discordPlayerCompatibility: true });
    console.log("Stream URL:", stream.url ? "Exists" : "Missing");
    console.log("Stream type:", stream.type);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
