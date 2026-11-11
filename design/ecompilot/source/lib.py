from PIL import ImageFont
from xml.sax.saxutils import escape
import os
FD = os.path.join(os.path.dirname(__file__), '..', 'fonts')
_cache = {}
def font(fam, w, size):
    key = (fam, w, size)
    if key not in _cache:
        name = ('Bric' if fam == 'B' else 'Inter') + f'-{w}.ttf'
        _cache[key] = ImageFont.truetype(os.path.join(FD, name), size)
    return _cache[key]
def tw(text, size, w=400, fam='I', ls=0):
    return font(fam, w, size).getlength(text) + ls * max(len(text) - 1, 0)

# palette
C = dict(
    ink='#0E1A14', forest='#0D3B2C', forest2='#14513D', green='#1C7A52', green2='#2F9E6B',
    lime='#D4F36B', mint='#E4F3EA', mint2='#CDE9D8', cream='#F3EEE5', cream2='#EAE3D6',
    page='#FAF8F4', card='#FFFFFF', line='#ECE7DE', line2='#E2DCD0', muted='#6E756F', muted2='#9AA19B',
    amber='#E89A12', amberbg='#FFF3D9', blue='#2F6FEB', bluebg='#E7EEFD', red='#E5484D', redbg='#FDECEC',
    orange='#FF7A45',
)

class SVG:
    def __init__(s, w, h):
        s.w, s.h = w, h; s.defs = []; s.body = []; s._id = 0
    def uid(s, p='id'):
        s._id += 1; return f'{p}{s._id}'
    def add(s, x): s.body.append(x); return x
    def g(s, name, inner, extra=''):
        return f'<g id="{escape(name)}"{extra}>' + ''.join(inner) + '</g>'
    def shadow(s, dy=8, blur=24, a=0.08, color=(14, 26, 20)):
        fid = s.uid('sh')
        r, g_, b = [c / 255 for c in color]
        s.defs.append(f'<filter id="{fid}" x="-30%" y="-30%" width="160%" height="180%" color-interpolation-filters="sRGB">'
            '<feFlood flood-opacity="0" result="BackgroundImageFix"/>'
            '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>'
            f'<feOffset dy="{dy}"/><feGaussianBlur stdDeviation="{blur/2}"/>'
            f'<feColorMatrix type="matrix" values="0 0 0 0 {r:.3f} 0 0 0 0 {g_:.3f} 0 0 0 0 {b:.3f} 0 0 0 {a} 0"/>'
            '<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>'
            '<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter>')
        return fid
    def lg(s, stops, x1=0, y1=0, x2=0, y2=1):
        gid = s.uid('lg')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{op}"' if op is not None else '') + '/>' for o, c, op in [(t + (None,))[:3] for t in stops])
        s.defs.append(f'<linearGradient id="{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>')
        return f'url(#{gid})'
    def rg(s, stops, cx=.5, cy=.5, r=.5):
        gid = s.uid('rg')
        st = ''.join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{op}"' if op is not None else '') + '/>' for o, c, op in [(t + (None,))[:3] for t in stops])
        s.defs.append(f'<radialGradient id="{gid}" cx="{cx}" cy="{cy}" r="{r}">{st}</radialGradient>')
        return f'url(#{gid})'
    def clip(s, x, y, w, h, r):
        cid = s.uid('clip')
        s.defs.append(f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>')
        return cid
    def out(s, title=''):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.w}" height="{s.h}" viewBox="0 0 {s.w} {s.h}" fill="none">'
                f'<title>{escape(title)}</title><defs>' + ''.join(s.defs) + '</defs>' + ''.join(s.body) + '</svg>')

def R(x, y, w, h, r=0, fill='none', stroke=None, sw=1, op=None, filt=None, name=None):
    a = f'<rect' + (f' id="{escape(name)}"' if name else '') + f' x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}"'
    if r: a += f' rx="{r:g}"'
    a += f' fill="{fill}"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None: a += f' opacity="{op}"'
    if filt: a += f' filter="url(#{filt})"'
    return a + '/>'
def Ci(cx, cy, r, fill='none', stroke=None, sw=1, op=None, filt=None, dash=None):
    a = f'<circle cx="{cx:g}" cy="{cy:g}" r="{r:g}" fill="{fill}"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}"'
    if dash: a += f' stroke-dasharray="{dash}"'
    if op is not None: a += f' opacity="{op}"'
    if filt: a += f' filter="url(#{filt})"'
    return a + '/>'
def P(d, fill='none', stroke=None, sw=1.5, op=None, cap='round', join='round', dash=None):
    a = f'<path d="{d}" fill="{fill}"'
    if stroke: a += f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="{cap}" stroke-linejoin="{join}"'
    if dash: a += f' stroke-dasharray="{dash}"'
    if op is not None: a += f' opacity="{op}"'
    return a + '/>'
def L(x1, y1, x2, y2, stroke, sw=1, dash=None, op=None):
    a = f'<line x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}" stroke="{stroke}" stroke-width="{sw}"'
    if dash: a += f' stroke-dasharray="{dash}"'
    if op is not None: a += f' opacity="{op}"'
    return a + '/>'
def T(x, y, text, size=14, w=400, fill='#0E1A14', fam='I', anchor='start', ls=0, op=None):
    family = 'Bricolage Grotesque' if fam == 'B' else 'Inter'
    if anchor == 'middle': x = x - tw(text, size, w, fam, ls) / 2
    elif anchor == 'end': x = x - tw(text, size, w, fam, ls)
    a = f'<text x="{x:.1f}" y="{y:g}" font-family="{family}" font-size="{size}" font-weight="{w}" fill="{fill}"'
    if ls: a += f' letter-spacing="{ls}"'
    if op is not None: a += f' opacity="{op}"'
    return a + f'>{escape(text)}</text>'

# 24x24 stroke icons (own drawings, lucide-like)
ICONS = {
 'grid': 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
 'bag': 'M6 7h12l1 13H5L6 7zM9 7V6a3 3 0 0 1 6 0v1',
 'box': 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9',
 'truck': 'M2 6h11v10H2zM13 9h4l4 4v3h-8M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
 'users': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-3.9 3.1-7 7-7s7 3.1 7 7M16 3.3a4 4 0 0 1 0 7.4M22 21c0-3-1.8-5.6-4.5-6.6',
 'chart': 'M4 20V10M10 20V4M16 20v-7M22 20H2',
 'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
 'help': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
 'logout': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
 'search': 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
 'bell': 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
 'mail': 'M3 5h18v14H3zM3 7l9 6 9-6',
 'arrowR': 'M5 12h14M13 6l6 6-6 6',
 'arrowUR': 'M7 17L17 7M8 7h9v9',
 'arrowL': 'M19 12H5M11 6l-6 6 6 6',
 'play': 'M7 4.5v15l12-7.5-12-7.5z',
 'calendar': 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
 'download': 'M12 3v12M7 10l5 5 5-5M4 21h16',
 'plus': 'M12 5v14M5 12h14',
 'check': 'M5 12.5l4.5 4.5L19 7.5',
 'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
 'wallet': 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l12-4v4M16 13.5h.01',
 'headset': 'M3 14v-2a9 9 0 0 1 18 0v2M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2zM18 17v1a3 3 0 0 1-3 3h-3',
 'pin': 'M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
 'trend': 'M3 17l6-6 4 4 8-8M15 7h6v6',
 'clock': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
 'dots': 'M5 12h.01M12 12h.01M19 12h.01',
 'filter': 'M3 5h18l-7 8v6l-4 2v-8L3 5z',
 'star': 'M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9L12 2.8z',
 'phone': 'M7 2h10v20H7zM11 18h2',
 'rocket': 'M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5',
 'chevD': 'M6 9l6 6 6-6',
 'sliders': 'M4 7h10M18 7h2M4 17h4M12 17h8M16 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
 'eye': 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
 'tag': 'M3 3h8l10 10-8 8L3 11V3zM7.5 7.5h.01',
}
def I(name, x, y, size=20, color='#0E1A14', sw=1.7, fill='none'):
    k = size / 24
    return (f'<g transform="translate({x:g} {y:g}) scale({k:.4f})">'
            f'<path d="{ICONS[name]}" fill="{fill}" stroke="{color}" stroke-width="{sw / k:.3f}" stroke-linecap="round" stroke-linejoin="round"/></g>')

def logo(x, y, s=1.0, dark=False):
    # mark: rounded square w/ lime paper plane, wordmark
    sz = 38 * s
    out = [R(x, y, sz, sz, 11 * s, C['lime'] if dark else C['forest'])]
    k = sz / 38
    plane = f'M{x+9*k:.1f} {y+19.5*k:.1f} L{x+29*k:.1f} {y+10*k:.1f} L{x+22.5*k:.1f} {y+29*k:.1f} L{x+18.6*k:.1f} {y+21.6*k:.1f} Z'
    out.append(P(plane, fill=C['forest'] if dark else C['lime']))
    out.append(P(f'M{x+18.6*k:.1f} {y+21.6*k:.1f} L{x+29*k:.1f} {y+10*k:.1f}', stroke=C['lime'] if dark else C['forest'], sw=1.6 * s))
    col = '#FFFFFF' if dark else C['ink']
    out.append(T(x + sz + 10 * s, y + 26 * s, 'EcomPilot', 22 * s, 800, col, 'B', ls=-0.4))
    return ''.join(out)

def pill(x, y, text, bg, fg, size=12, w=600, padx=10, h=24, dot=None):
    width = tw(text, size, w) + padx * 2 + (12 if dot else 0)
    o = [R(x, y, width, h, h / 2, bg)]
    tx = x + padx
    if dot:
        o.append(Ci(x + padx + 3, y + h / 2, 3, dot)); tx += 12
    o.append(T(tx, y + h / 2 + size * 0.36, text, size, w, fg))
    return ''.join(o), width

def fmt(n):
    return f'{n:,}'.replace(',', ' ')
