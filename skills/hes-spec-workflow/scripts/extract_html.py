"""Extract local HES HTML visible text; no network, dependencies or writes."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import sys


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.hidden += 1
        if tag in ("p", "div", "br", "li", "tr", "pre", "h1", "h2", "h3", "h4"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.hidden = max(0, self.hidden - 1)
        if tag in ("p", "div", "li", "tr", "pre", "h1", "h2", "h3", "h4"):
            self.parts.append("\n")
        elif tag in ("td", "th"):
            self.parts.append(" | ")

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)

    def text(self):
        return "\n".join(line.strip() for line in "".join(self.parts).splitlines() if line.strip())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="UTF-8 HTML file or directory")
    args = parser.parse_args()
    source = args.source
    if source.is_dir():
        files = sorted(p for p in source.iterdir() if p.is_file() and p.suffix.lower() in (".html", ".htm"))
    elif source.is_file() and source.suffix.lower() in (".html", ".htm"):
        files = [source]
    else:
        parser.error("source must be an existing HTML file or directory")
    if not files:
        parser.error("no HTML files found")
    sys.stdout.reconfigure(encoding="utf-8")
    for file in files:
        try:
            doc = VisibleText()
            doc.feed(file.read_text(encoding="utf-8-sig"))
            doc.close()
        except (OSError, UnicodeError) as exc:
            parser.exit(1, f"Cannot read {file}: {exc}\n")
        print(f"\nSOURCE: {file.as_posix()}\n{doc.text()}")


if __name__ == "__main__":
    main()
