const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseLink, videoEmbed } = require("../src/utils/media");

describe("liens des médias", () => {
  it("n'accepte que les liens http(s)", () => {
    assert.equal(parseLink("https://exemple.fr/photo.jpg").href, "https://exemple.fr/photo.jpg");
    assert.ok(parseLink("  http://exemple.fr/a.png  "));
    for (const bad of [
      "",
      "pas un lien",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "file:///etc/passwd",
      "s3://seau/photo.jpg",
      "ftp://exemple.fr/a.png",
      "https://user:mdp@exemple.fr/a.png",
      `https://exemple.fr/${"a".repeat(2100)}`,
      { href: "https://exemple.fr" },
    ]) {
      assert.equal(parseLink(bad), null, String(bad).slice(0, 40));
    }
  });

  it("reconnaît les vidéos YouTube", () => {
    const embed = { provider: "youtube", url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" };
    for (const link of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ",
    ]) {
      assert.deepEqual(videoEmbed(link), embed, link);
    }
    assert.equal(videoEmbed("https://www.youtube.com/watch?v=court"), null);
    assert.equal(videoEmbed("https://www.youtube.com/@chaine"), null);
  });

  it("reconnaît les vidéos Vimeo, y compris non répertoriées", () => {
    assert.deepEqual(videoEmbed("https://vimeo.com/76979871"), {
      provider: "vimeo",
      url: "https://player.vimeo.com/video/76979871",
    });
    assert.equal(videoEmbed("https://vimeo.com/channels/staffpicks/76979871").url, "https://player.vimeo.com/video/76979871");
    assert.equal(videoEmbed("https://vimeo.com/76979871/8272103f6e").url, "https://player.vimeo.com/video/76979871?h=8272103f6e");
    assert.equal(videoEmbed("https://player.vimeo.com/video/76979871?h=8272103f6e").url, "https://player.vimeo.com/video/76979871?h=8272103f6e");
    assert.equal(videoEmbed("https://vimeo.com/about"), null);
  });

  it("reconnaît les vidéos Dailymotion", () => {
    const url = "https://www.dailymotion.com/embed/video/x8abc12";
    assert.deepEqual(videoEmbed("https://www.dailymotion.com/video/x8abc12"), { provider: "dailymotion", url });
    assert.equal(videoEmbed("https://www.dailymotion.com/video/x8abc12_titre-de-la-video").url, url);
    assert.equal(videoEmbed("https://dai.ly/x8abc12").url, url);
    assert.equal(videoEmbed("https://geo.dailymotion.com/player.html?video=x8abc12").url, url);
    assert.equal(videoEmbed("https://www.dailymotion.com/video/<script>"), null);
  });

  it("laisse les autres liens à récupérer comme fichiers", () => {
    assert.equal(videoEmbed("https://exemple.fr/clip.mp4"), null);
    assert.equal(videoEmbed("https://www.tiktok.com/@a/video/123"), null);
    assert.equal(videoEmbed("pas un lien"), null);
  });
});
