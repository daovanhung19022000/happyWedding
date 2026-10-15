#!/usr/bin/env python3
"""Server dev: redirect /0/tên, /1/tên, /9/tên → index.html?mode=&to= (giống GitHub Pages)."""
from __future__ import annotations

import re
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

INVITE_RE = re.compile(r"^(.*)/(0|1|9)/([^/?#]+)/?$")


class WeddingHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = urllib.parse.unquote(parsed.path)
        match = INVITE_RE.match(path)
        if match:
            base, mode, guest_slug = match.group(1), match.group(2), match.group(3)
            guest = urllib.parse.unquote(guest_slug.replace("+", " "))
            query = urllib.parse.parse_qs(parsed.query)
            params = [("mode", mode), ("to", guest)]
            for key, values in query.items():
                if key not in ("mode", "to") and values:
                    params.append((key, values[0]))
            qs = urllib.parse.urlencode(params)
            location = f"{base or ''}/index.html?{qs}"
            self.send_response(302)
            self.send_header("Location", location)
            self.end_headers()
            return
        super().do_GET()


if __name__ == "__main__":
    port = 8080
    print(f"Serving at http://127.0.0.1:{port}/ (invite paths /0|1|9/tên supported)")
    HTTPServer(("127.0.0.1", port), WeddingHandler).serve_forever()
