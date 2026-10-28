"""Verified Web Grounding retrieval, SSRF-guarded excerpt fetching, and HTML sanitization."""

from __future__ import annotations

import ipaddress
import logging
import re
import socket
from dataclasses import dataclass
from html import escape as html_escape
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpcore
import httpx

from core.config import settings
from services.ai_service import UntrustedDataBoundary, run_grounded_web_search

logger = logging.getLogger(__name__)

MAX_EXCERPT_CHARS = 4_000
MAX_REDIRECT_HOPS = 4
MAX_ATTRIBUTION_HTML_CHARS = 65_536

_ALLOWED_CONTENT_TYPES = frozenset({
    "text/html",
    "application/xhtml+xml",
    "text/plain",
})
_IGNORED_HTML_TAGS = frozenset({
    "script",
    "style",
    "noscript",
    "svg",
    "template",
})
_REDIRECT_STATUS_CODES = frozenset({301, 302, 303, 307, 308})
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_DANGEROUS_SCHEME_RE = re.compile(
    r"(?:javascript|vbscript|data\s*:\s*text/html)\s*:",
    re.IGNORECASE,
)
_SAFE_DATA_IMAGE_RE = re.compile(
    r"^data:image/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=\s]+$",
    re.IGNORECASE,
)
_UNSAFE_CSS_RE = re.compile(
    r"(?:[<>]|url\s*\(|javascript\s*:|vbscript\s*:|expression\s*\(|@import\b)",
    re.IGNORECASE,
)
_STRIP_SUBTREE_TAGS = frozenset({
    "script",
    "iframe",
    "object",
    "embed",
    "applet",
    "template",
    "form",
    "noscript",
})
_ALLOWED_WIDGET_TAGS = frozenset({
    "div",
    "span",
    "p",
    "a",
    "style",
    "svg",
    "path",
    "g",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "img",
    "strong",
    "em",
    "b",
    "i",
    "ul",
    "li",
    "br",
})
_VOID_WIDGET_TAGS = frozenset({"br", "img"})
_ALLOWED_WIDGET_ATTRS = frozenset({
    "class",
    "id",
    "style",
    "href",
    "target",
    "rel",
    "aria-label",
    "aria-hidden",
    "role",
    "title",
    "src",
    "alt",
    "width",
    "height",
    "viewbox",
    "fill",
    "stroke",
    "stroke-width",
    "d",
    "cx",
    "cy",
    "r",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "xmlns",
})


@dataclass(frozen=True)
class WebSource:
    eid: str
    url: str
    title: str
    domain: str
    excerpt: str


@dataclass(frozen=True)
class FetchedWebPage:
    final_url: str
    domain: str
    excerpt: str


class _VisibleTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._ignored_depth = 0
        self._chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in _IGNORED_HTML_TAGS:
            self._ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in _IGNORED_HTML_TAGS and self._ignored_depth > 0:
            self._ignored_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._ignored_depth == 0 and data:
            self._chunks.append(data)

    def get_text(self) -> str:
        raw = " ".join(self._chunks)
        cleaned = _CONTROL_CHARS_RE.sub(" ", raw)
        return re.sub(r"\s+", " ", cleaned).strip()


def build_search_prompt(question: str) -> str:
    """Build a search prompt derived strictly from the student's question only.

    Document text, selected passages, notes, filenames, and user identifiers
    are never accepted or included.
    """
    cleaned = question.strip()[:4000]
    if not cleaned:
        raise ValueError("A non-empty question is required for web search.")
    boundary = UntrustedDataBoundary()
    return (
        "Use Google Search to find authoritative, factual educational sources "
        "that directly answer the student's question.\n\n"
        f"{boundary.instruction}\n"
        f"Student question:\n{boundary.wrap(cleaned)}"
    )


def _is_disallowed_ip(
    address: ipaddress.IPv4Address | ipaddress.IPv6Address,
) -> bool:
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped is not None:
        if _is_disallowed_ip(address.ipv4_mapped):
            return True
    is_site_local = isinstance(address, ipaddress.IPv6Address) and address.is_site_local
    return (
        (not address.is_global)
        or is_site_local
        or address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


def _resolve_verified_public_ip(hostname: str, port: int = 443) -> str | None:
    """Resolve hostname via DNS and return the first public IP only if ALL records are public."""
    try:
        addrinfo = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except OSError:
        return None
    if not addrinfo:
        return None

    verified_ips: list[str] = []
    for _, _, _, _, sockaddr in addrinfo:
        host_ip = sockaddr[0].split("%", 1)[0]
        try:
            ip_obj = ipaddress.ip_address(host_ip)
        except ValueError:
            return None
        if _is_disallowed_ip(ip_obj):
            return None
        verified_ips.append(str(ip_obj))

    return verified_ips[0] if verified_ips else None


class _PublicDNSBackend(httpcore.SyncBackend):
    """Connects directly to the verified public IP to prevent TOCTOU DNS rebinding."""

    def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: float | None = None,
        local_address: str | None = None,
        socket_options=None,
    ) -> httpcore.NetworkStream:
        if port != 443:
            raise httpcore.ConnectError("Only port 443 is permitted for web grounding.")
        verified_ip = _resolve_verified_public_ip(host.strip().rstrip("."), port)
        if verified_ip is None:
            raise httpcore.ConnectError("Target host failed public-IP SSRF verification.")
        return super().connect_tcp(
            verified_ip,
            port,
            timeout=timeout,
            local_address=local_address,
            socket_options=socket_options,
        )


def _build_ssrf_safe_client() -> httpx.Client:
    timeout = settings.web_grounding_fetch_timeout_seconds
    transport = httpx.HTTPTransport(verify=True, trust_env=False)
    transport._pool = httpcore.ConnectionPool(
        ssl_context=httpx.create_ssl_context(verify=True, trust_env=False),
        network_backend=_PublicDNSBackend(),
    )
    return httpx.Client(
        transport=transport,
        follow_redirects=False,
        trust_env=False,
        timeout=timeout,
    )


def _validate_and_resolve_public_https_url(raw_url: str) -> tuple[str, str] | None:
    """Validate an https URL and verify all resolved DNS records are public global IPs."""
    candidate = raw_url.strip()
    if not candidate or len(candidate) > 2048:
        return None
    try:
        parsed = urlsplit(candidate)
        port = parsed.port
    except ValueError:
        return None

    if parsed.scheme.lower() != "https":
        return None
    if parsed.username or parsed.password:
        return None
    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname or port not in (None, 443):
        return None

    if _resolve_verified_public_ip(hostname, 443) is None:
        return None

    netloc = f"[{hostname}]" if ":" in hostname else hostname
    canonical_url = urlunsplit((
        "https",
        netloc,
        parsed.path or "/",
        parsed.query,
        "",
    ))
    if len(canonical_url) > 2048:
        return None
    display_domain = hostname.removeprefix("www.") or hostname
    return canonical_url, display_domain


def _extract_visible_text(raw_body: str, media_type: str) -> str:
    if media_type == "text/plain":
        cleaned = _CONTROL_CHARS_RE.sub(" ", raw_body)
        return re.sub(r"\s+", " ", cleaned).strip()[:MAX_EXCERPT_CHARS]
    parser = _VisibleTextExtractor()
    try:
        parser.feed(raw_body)
        parser.close()
    except Exception:
        return ""
    return parser.get_text()[:MAX_EXCERPT_CHARS]


def _sanitize_title(raw_title: str, fallback_domain: str) -> str:
    cleaned = _CONTROL_CHARS_RE.sub(" ", raw_title or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()[:240]
    if not cleaned or _DANGEROUS_SCHEME_RE.search(cleaned):
        return fallback_domain
    return cleaned


def _sanitize_widget_url(raw_value: str, *, allow_data_image: bool) -> str | None:
    cleaned = _CONTROL_CHARS_RE.sub("", raw_value or "").strip()
    if not cleaned:
        return None
    if allow_data_image and _SAFE_DATA_IMAGE_RE.match(cleaned):
        return cleaned
    try:
        parsed = urlsplit(cleaned)
        port = parsed.port
    except ValueError:
        return None
    if parsed.scheme.lower() != "https" or parsed.username or parsed.password:
        return None
    if not parsed.hostname or port not in (None, 443):
        return None
    return cleaned


class _AttributionHTMLSanitizer(HTMLParser):
    """Allowlist HTML serializer for Google Search attribution rendered in a sandboxed iframe."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._strip_depth = 0
        self._skip_style = False
        self._in_style = False
        self._svg_depth = 0
        self._open_tags: list[str] = []
        self._parts: list[str] = []

    def _sanitize_attrs(self, tag: str, attrs: list[tuple[str, str | None]]) -> str:
        rendered: list[str] = []
        for raw_name, raw_val in attrs:
            name = (raw_name or "").strip().lower()
            if not name or name.startswith("on") or name not in _ALLOWED_WIDGET_ATTRS:
                continue
            val = raw_val or ""
            if name in {"href", "xlink:href"}:
                safe_url = _sanitize_widget_url(val, allow_data_image=False)
                if safe_url is None:
                    continue
                val = safe_url
            elif name == "src":
                safe_url = _sanitize_widget_url(val, allow_data_image=True)
                if safe_url is None:
                    continue
                val = safe_url
            elif name == "style":
                if _UNSAFE_CSS_RE.search(val):
                    continue
            rendered.append(f'{name}="{html_escape(val, quote=True)}"')
        if tag == "a":
            rendered = [attr for attr in rendered if not attr.startswith("rel=")]
            rendered.append('rel="noopener noreferrer nofollow"')
        return (" " + " ".join(rendered)) if rendered else ""

    def _close_open_tag(self, popped: str) -> None:
        if popped == "style":
            self._in_style = False
        elif popped == "svg" and self._svg_depth > 0:
            self._svg_depth -= 1
        self._parts.append(f"</{popped}>")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lower = tag.lower()
        if lower in _STRIP_SUBTREE_TAGS:
            self._strip_depth += 1
            return
        if self._strip_depth > 0 or self._skip_style or lower not in _ALLOWED_WIDGET_TAGS:
            return
        if lower == "style":
            # Disallow <style> inside <svg> foreign-content to prevent HTML/SVG parser differentials.
            if self._svg_depth > 0 or self._in_style:
                self._skip_style = True
                return
            self._in_style = True
        elif lower == "svg":
            self._svg_depth += 1
        attr_str = self._sanitize_attrs(lower, attrs)
        if lower in _VOID_WIDGET_TAGS:
            self._parts.append(f"<{lower}{attr_str} />")
        else:
            self._open_tags.append(lower)
            self._parts.append(f"<{lower}{attr_str}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        lower = tag.lower()
        if (
            self._strip_depth > 0
            or self._skip_style
            or lower in _STRIP_SUBTREE_TAGS
            or lower not in _ALLOWED_WIDGET_TAGS
            or lower == "style"
        ):
            return
        attr_str = self._sanitize_attrs(lower, attrs)
        if lower in _VOID_WIDGET_TAGS or (self._svg_depth > 0 and lower != "svg"):
            self._parts.append(f"<{lower}{attr_str} />")
        else:
            self._parts.append(f"<{lower}{attr_str}></{lower}>")

    def handle_endtag(self, tag: str) -> None:
        lower = tag.lower()
        if lower == "style" and self._skip_style:
            self._skip_style = False
            return
        if lower in _STRIP_SUBTREE_TAGS:
            if self._strip_depth > 0:
                self._strip_depth -= 1
            return
        if (
            self._strip_depth > 0
            or self._skip_style
            or lower not in _ALLOWED_WIDGET_TAGS
            or lower in _VOID_WIDGET_TAGS
        ):
            return
        if lower not in self._open_tags:
            return
        while self._open_tags:
            popped = self._open_tags.pop()
            self._close_open_tag(popped)
            if popped == lower:
                break

    def handle_data(self, data: str) -> None:
        if self._strip_depth > 0 or self._skip_style or not data:
            return
        if self._in_style:
            if not _UNSAFE_CSS_RE.search(data):
                self._parts.append(data)
            return
        self._parts.append(html_escape(data, quote=False))

    def get_html(self) -> str:
        while self._open_tags:
            self._close_open_tag(self._open_tags.pop())
        return "".join(self._parts).strip()


def sanitize_search_attribution_html(raw_html: str | None) -> str | None:
    """Defense-in-depth allowlist sanitizer for Google Search attribution HTML."""
    if not raw_html or not raw_html.strip():
        return None
    sanitizer = _AttributionHTMLSanitizer()
    try:
        sanitizer.feed(raw_html[:MAX_ATTRIBUTION_HTML_CHARS])
        sanitizer.close()
    except Exception:
        return None
    cleaned = sanitizer.get_html()
    if not cleaned or len(cleaned) > MAX_ATTRIBUTION_HTML_CHARS:
        return None
    return cleaned


def fetch_excerpt(
    url: str,
    *,
    client: httpx.Client | None = None,
) -> FetchedWebPage | None:
    """Fetch a bounded text excerpt from a verified public https URL with SSRF protection."""
    max_bytes = settings.web_grounding_max_response_bytes
    owns_client = client is None
    active_client = client or _build_ssrf_safe_client()

    try:
        current_url = url
        for hop in range(MAX_REDIRECT_HOPS + 1):
            active_client.cookies.clear()
            validated = _validate_and_resolve_public_https_url(current_url)
            if validated is None:
                return None
            canonical_url, display_domain = validated

            with active_client.stream(
                "GET",
                canonical_url,
                headers={
                    "User-Agent": "StudFlowGroundingVerifier/1.0",
                    "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9",
                },
            ) as response:
                if response.status_code in _REDIRECT_STATUS_CODES:
                    if hop >= MAX_REDIRECT_HOPS:
                        return None
                    location = (response.headers.get("location") or "").strip()
                    if not location:
                        return None
                    current_url = urljoin(canonical_url, location)
                    continue

                if response.status_code != 200:
                    return None

                content_type_header = response.headers.get("content-type") or ""
                media_type = content_type_header.split(";", 1)[0].strip().lower()
                if media_type not in _ALLOWED_CONTENT_TYPES:
                    return None

                content_length = response.headers.get("content-length")
                if content_length is not None:
                    try:
                        if int(content_length) > max_bytes:
                            return None
                    except ValueError:
                        return None

                chunks: list[bytes] = []
                total_bytes = 0
                for chunk in response.iter_bytes():
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        return None
                    chunks.append(chunk)

                encoding = response.encoding or "utf-8"
                try:
                    decoded = b"".join(chunks).decode(encoding, errors="replace")
                except LookupError:
                    decoded = b"".join(chunks).decode("utf-8", errors="replace")

                excerpt = _extract_visible_text(decoded, media_type)
                if not excerpt:
                    return None

                return FetchedWebPage(
                    final_url=canonical_url,
                    domain=display_domain,
                    excerpt=excerpt,
                )
    except (httpx.HTTPError, OSError, ValueError):
        return None
    finally:
        if owns_client:
            active_client.close()

    return None


def retrieve_verified_web_sources(
    question: str,
) -> tuple[dict[str, WebSource], str | None]:
    """Run Gemini Search grounding, verify candidate URLs server-side, and build w_XX registry."""
    prompt = build_search_prompt(question)
    search_result = run_grounded_web_search(prompt)
    if not search_result.grounding_chunks:
        return {}, None

    max_sources = settings.web_grounding_max_sources
    max_attempts = max(max_sources * 2, 5)
    seen_final_urls: set[str] = set()
    verified_sources: list[tuple[str, str, str, str]] = []

    with _build_ssrf_safe_client() as client:
        for attempt_idx, chunk in enumerate(search_result.grounding_chunks):
            if len(verified_sources) >= max_sources or attempt_idx >= max_attempts:
                break
            fetched = fetch_excerpt(chunk.uri, client=client)
            if fetched is None or fetched.final_url in seen_final_urls:
                continue
            seen_final_urls.add(fetched.final_url)
            title = _sanitize_title(chunk.title, fetched.domain)
            verified_sources.append((
                fetched.final_url,
                title,
                fetched.domain,
                fetched.excerpt,
            ))

    if not verified_sources:
        return {}, None

    registry = {
        f"w_{index:02d}": WebSource(
            eid=f"w_{index:02d}",
            url=final_url,
            title=title,
            domain=domain,
            excerpt=excerpt,
        )
        for index, (final_url, title, domain, excerpt) in enumerate(verified_sources, start=1)
    }
    attribution_html = sanitize_search_attribution_html(
        search_result.search_entry_point_html
    )
    return registry, attribution_html
