"""Pull Medium stories into the Jekyll blog at build time.

Reads `medium_username` from _config.yml, downloads that account's public RSS
feed, and writes one stub post per story to _posts/medium/. Each stub carries
`external_url`, so the blog cards link straight to Medium and the generated
page just redirects there.

Runs in the GitHub Actions build (see .github/workflows/pages.yml). The stubs
are not committed — they're regenerated on every build, so new Medium stories
show up within a day. Any network or parsing problem is logged and skipped so
the site still deploys.
"""

import email.utils
import html
import json
import re
import shutil
import sys
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "_posts" / "medium"
CONTENT_NS = "{http://purl.org/rss/1.0/modules/content/}encoded"


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def html_to_text(markup: str) -> str:
    parser = _TextExtractor()
    parser.feed(markup or "")
    return re.sub(r"\s+", " ", html.unescape(" ".join(parser.parts))).strip()


def summarize(text: str, limit: int = 180) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",.;:–— ")
    return cut + "…"


def read_config() -> str:
    return (ROOT / "_config.yml").read_text(encoding="utf-8")


def medium_username(config: str) -> str:
    match = re.search(r"^medium_username:\s*['\"]?([\w.@-]*)", config, re.M)
    return match.group(1).lstrip("@") if match else ""


def medium_hidden(config: str) -> list:
    """Story IDs listed under `medium_hide: [...]` in _config.yml."""
    match = re.search(r"^medium_hide:\s*(\[.*?\])", config, re.M)
    if not match:
        return []
    try:
        return [str(story_id).strip() for story_id in json.loads(match.group(1)) if str(story_id).strip()]
    except ValueError:
        print("::warning::Could not read medium_hide in _config.yml; expected a list like [\"103c46c2288e\"].")
        return []


def main() -> int:
    config = read_config()
    user = medium_username(config)
    hidden = medium_hidden(config)
    if not user:
        print("medium_username not set in _config.yml; skipping Medium import.")
        return 0

    url = f"https://medium.com/feed/@{user}"
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (portfolio build)"})
        with urllib.request.urlopen(request, timeout=30) as response:
            feed = ET.fromstring(response.read())
    except Exception as exc:  # network errors, HTTP errors, bad XML
        print(f"::warning::Could not load Medium feed {url}: {exc}. Building without Medium posts.")
        return 0

    shutil.rmtree(OUT_DIR, ignore_errors=True)
    OUT_DIR.mkdir(parents=True)

    count = 0
    for item in feed.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").split("?")[0]
        published = item.findtext("pubDate")
        if not (title and link and published):
            continue
        guid = item.findtext("guid") or ""
        if any(story_id in link or story_id in guid for story_id in hidden):
            print(f"Skipping hidden Medium story: {title}")
            continue

        date = email.utils.parsedate_to_datetime(published)
        text = html_to_text(item.findtext(CONTENT_NS) or item.findtext("description") or "")
        read_time = max(1, round(len(text.split()) / 200))
        slug = re.sub(r"-[0-9a-f]{8,}$", "", link.rstrip("/").rsplit("/", 1)[-1]) or "story"

        front_matter = {
            "title": title,
            "date": date.strftime("%Y-%m-%d %H:%M:%S %z"),
            "description": summarize(text),
            "external_url": link,
            "badge": "Medium",
            "read_time": read_time,
            "source": "medium",
            "sitemap": False,
        }
        # JSON values are valid YAML, which keeps quoting safe for any title.
        lines = ["---"] + [f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in front_matter.items()] + ["---", ""]
        path = OUT_DIR / f"{date:%Y-%m-%d}-medium-{slug}.md"
        path.write_text("\n".join(lines), encoding="utf-8")
        count += 1

    print(f"Imported {count} Medium post(s) from @{user}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
