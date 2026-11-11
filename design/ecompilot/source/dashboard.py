import sys, math, random; sys.path.insert(0, '.')
from lib import *
W, H = 1440, 1160
s = SVG(W, H); A = s.add
A(R(0, 0, W, H, 0, '#E9E5DD', name='Fond'))
PANEL = '#F8F6F1'
# ---------------- SIDEBAR ----------------
sb = [R(16, 16, 248, H - 32, 24, PANEL)]
sb.append(logo(40, 44))
sb.append(T(40, 128, 'MENU', 11, 600, C['muted2'], ls=1.2))
menu = [('grid', 'Tableau de bord', None), ('bag', 'Commandes', '75'), ('box', 'Produits', None), ('truck', 'Livraisons', None), ('users', 'Clients', None), ('chart', 'Statistiques', None)]
for i, (ic, t, badge) in enumerate(menu):
    y = 146 + i * 48
    if i == 0:
        sb.append(R(28, y, 220, 44, 12, '#FFFFFF', filt=s.shadow(4, 12, .06)))
        sb.append(R(16, y + 8, 4, 28, 2, C['forest']))
    sb.append(I(ic, 44, y + 12, 20, C['forest'] if i == 0 else '#737A74', 1.8))
    sb.append(T(76, y + 27, t, 14, 600 if i == 0 else 500, C['ink'] if i == 0 else '#5E655F'))
    if badge:
        sb.append(R(206, y + 12, 30, 20, 10, C['forest']))
        sb.append(T(221, y + 26, badge, 11, 700, C['lime'], anchor='middle'))
sb.append(T(40, 460, 'GÉNÉRAL', 11, 600, C['muted2'], ls=1.2))
for i, (ic, t) in enumerate([('settings', 'Paramètres'), ('help', 'Aide & support'), ('logout', 'Déconnexion')]):
    y = 478 + i * 48
    sb.append(I(ic, 44, y + 12, 20, '#737A74', 1.8))
    sb.append(T(76, y + 27, t, 14, 500, '#5E655F'))
# store switcher
sb.append(R(28, 650, 220, 64, 16, '#FFFFFF', C['line']))
sb.append(R(40, 662, 40, 40, 12, s.lg([(0, '#F29F67'), (1, '#C2410C')], 0, 0, 1, 1)))
sb.append(T(60, 688, 'WS', 13, 800, '#FFFFFF', 'B', anchor='middle'))
sb.append(T(92, 678, 'Wax Studio', 14, 700))
sb.append(T(92, 696, 'Abidjan · Plan Pro', 12, 500, C['muted']))
sb.append(I('chevD', 222, 674, 16, C['muted']))
# mobile app card
my = H - 16 - 24 - 230
sb.append(R(28, my, 220, 230, 20, s.lg([(0, '#145440'), (1, '#071F17')], 0, 0, 1, 1)))
cl = s.clip(28, my, 220, 230, 20)
sb.append(f'<g clip-path="url(#{cl})">' + ''.join(Ci(248, my + 230, r, 'none', '#FFFFFF', 1, op=.08) for r in (40, 80, 120, 160, 200)) + Ci(60, my, 120, s.rg([(0, C['lime'], .25), (1, C['lime'], 0)])) + '</g>')
sb.append(Ci(60, my + 40, 18, C['lime']))
sb.append(I('phone', 51, my + 31, 18, C['forest'], 2))
sb.append(T(44, my + 100, 'EcomPilot Mobile', 18, 700, '#FFFFFF', 'B'))
sb.append(T(44, my + 124, 'Validez vos commandes', 13, 400, '#FFFFFF', op=.7))
sb.append(T(44, my + 142, 'où que vous soyez.', 13, 400, '#FFFFFF', op=.7))
sb.append(R(44, my + 166, 188, 42, 21, C['lime']))
sb.append(I('download', 94, my + 178, 18, C['forest'], 2))
sb.append(T(118, my + 192, 'Télécharger', 14, 700, C['forest']))
A(s.g('Sidebar', sb))

# ---------------- MAIN PANEL ----------------
MX, MW = 276, 1148
A(R(MX, 16, MW, H - 32, 24, PANEL, name='Panneau principal'))
X0, X1 = MX + 28, MX + MW - 28   # 304 .. 1396
# topbar
tb = []
tb.append(R(X0, 36, 420, 48, 24, '#FFFFFF', C['line']))
tb.append(I('search', X0 + 18, 50, 20, C['muted']))
tb.append(T(X0 + 48, 65, 'Rechercher une commande, un client…', 14, 400, C['muted2']))
tb.append(R(X0 + 362, 48, 44, 24, 8, C['cream']))
tb.append(T(X0 + 384, 64, '⌘ K', 11, 600, C['muted'], anchor='middle'))
for j, ic in enumerate(['mail', 'bell']):
    cx = 1110 + j * 56
    tb.append(Ci(cx, 60, 24, '#FFFFFF', C['line']))
    tb.append(I(ic, cx - 10, 50, 20, C['ink']))
tb.append(Ci(1176, 50, 4.5, C['orange'], '#FFFFFF', 2))
tb.append(Ci(1232, 60, 24, '#8D5524'))
tb.append(T(1232, 65, 'AK', 14, 700, '#FFFFFF', anchor='middle'))
tb.append(Ci(1249, 77, 6, C['green2'], PANEL, 2.5))
tb.append(T(1266, 56, 'Aïcha Koné', 15, 700))
tb.append(T(1266, 75, 'aicha@waxstudio.ci', 12, 500, C['muted']))
A(s.g('Barre supérieure', tb))

# header
hd = []
hd.append(T(X0, 150, 'Tableau de bord', 36, 700, C['ink'], 'B', ls=-0.8))
hd.append(T(X0, 178, 'Bonjour Aïcha, voici le bilan de Wax Studio pour novembre 2026.', 15, 400, C['muted']))
bx = X1
w3 = tw('Nouvelle commande', 14, 600) + 64
hd.append(R(bx - w3, 124, w3, 48, 24, C['forest'], filt=s.shadow(8, 18, .2, (13, 59, 44))))
hd.append(I('plus', bx - w3 + 20, 138, 20, '#FFFFFF', 2.2))
hd.append(T(bx - w3 + 46, 153, 'Nouvelle commande', 14, 600, '#FFFFFF'))
bx -= w3 + 12
w2 = tw('Exporter', 14, 600) + 62
hd.append(R(bx - w2, 124, w2, 48, 24, '#FFFFFF', C['line2']))
hd.append(I('download', bx - w2 + 20, 138, 20, C['ink']))
hd.append(T(bx - w2 + 46, 153, 'Exporter', 14, 600))
bx -= w2 + 12
w1 = tw('Novembre 2026', 14, 600) + 84
hd.append(R(bx - w1, 124, w1, 48, 24, '#FFFFFF', C['line2']))
hd.append(I('calendar', bx - w1 + 20, 138, 20, C['ink']))
hd.append(T(bx - w1 + 48, 153, 'Novembre 2026', 14, 600))
hd.append(I('chevD', bx - 30, 140, 16, C['muted']))
A(s.g('En-tête', hd))

# KPI cards
GAP = 18
CW = (X1 - X0 - 3 * GAP) / 4
KY, KH = 200, 160
kpis = [
    ('Chiffre d’affaires', '3 850 000', 'FCFA', '+12,4 %', 'vs. octobre', True, 'wallet'),
    ('Commandes reçues', '520', 'commandes', '+8,2 %', 'vs. octobre', False, 'bag'),
    ('Commandes livrées', '385', 'livrées', '74 %', 'taux de livraison', False, 'truck'),
    ('Commandes en attente', '75', 'à traiter', '12', 'urgentes > 48 h', False, 'clock'),
]
for i, (lab, val, unit, ch, note, hi, ic) in enumerate(kpis):
    x = X0 + i * (CW + GAP)
    k = []
    if hi:
        k.append(R(x, KY, CW, KH, 22, s.lg([(0, '#1C7A52'), (1, '#0A2E22')], 0, 0, 1, 1), filt=s.shadow(12, 26, .22, (13, 59, 44))))
        cl = s.clip(x, KY, CW, KH, 22)
        k.append(f'<g clip-path="url(#{cl})">' + ''.join(Ci(x + CW, KY + KH, r, 'none', '#FFFFFF', 1, op=.09) for r in (50, 95, 140, 185)) + '</g>')
    else:
        k.append(R(x, KY, CW, KH, 22, '#FFFFFF', C['line']))
    fg = '#FFFFFF' if hi else C['ink']
    sub = '#FFFFFF' if hi else C['muted']
    k.append(T(x + 20, KY + 43, lab, 15, 600, fg))
    k.append(Ci(x + CW - 36, KY + 38, 17, 'none', '#FFFFFF' if hi else C['line2'], 1.2, op=.5 if hi else None))
    k.append(I('arrowUR', x + CW - 44, KY + 30, 16, '#FFFFFF' if hi else C['ink'], 1.8))
    k.append(T(x + 20, KY + 108, val, 38 if hi else 42, 700, fg, 'B', ls=-1))
    k.append(T(x + 20 + tw(val, 38 if hi else 42, 700, 'B', -1) + 8, KY + 108, unit, 14, 600, sub, op=.75 if hi else None))
    if i == 3:
        pb, pc = C['amberbg'], C['amber']
    elif i == 2:
        pb, pc = C['mint'], C['green']
    else:
        pb, pc = (C['lime'], C['forest']) if hi else (C['mint'], C['green'])
    pw = tw(ch, 12, 700) + (32 if i < 2 else 20)
    k.append(R(x + 20, KY + 124, pw, 24, 12, pb))
    if i < 2:
        k.append(I('trend', x + 28, KY + 130, 12, pc, 2.4))
        k.append(T(x + 44, KY + 140.5, ch, 12, 700, pc))
    else:
        k.append(T(x + 30, KY + 140.5, ch, 12, 700, pc))
    k.append(T(x + 28 + pw, KY + 140.5, note, 12, 500, sub, op=.75 if hi else None))
    A(s.g(f'KPI / {lab}', k))

# ---------------- SALES CHART ----------------
RY, RH = 378, 344
CHW = 720
ch = [R(X0, RY, CHW, RH, 22, '#FFFFFF', C['line'])]
ch.append(T(X0 + 24, RY + 40, 'Évolution des ventes', 18, 700, C['ink'], 'B'))
ch.append(T(X0 + 24, RY + 62, 'Chiffre d’affaires quotidien en FCFA', 13, 400, C['muted']))
# tabs
tx = X0 + CHW - 24
tabs = ['Jour', 'Semaine', 'Mois']
tws = [tw(t, 13, 600) + 28 for t in tabs]
tot = sum(tws) + 8
ch.append(R(tx - tot, RY + 24, tot, 36, 18, C['cream']))
xx = tx - tot + 4
for t, w_ in zip(tabs, tws):
    if t == 'Jour':
        ch.append(R(xx, RY + 28, w_, 28, 14, '#FFFFFF', filt=s.shadow(2, 6, .08)))
    ch.append(T(xx + w_ / 2, RY + 47, t, 13, 600, C['ink'] if t == 'Jour' else C['muted'], anchor='middle'))
    xx += w_
# legend
ch.append(Ci(X0 + 30, RY + 92, 5, C['green']))
ch.append(T(X0 + 42, RY + 96.5, 'Novembre', 12, 600, C['ink']))
ch.append(L(X0 + 120, RY + 92, X0 + 136, RY + 92, C['muted2'], 2, '3 3'))
ch.append(T(X0 + 142, RY + 96.5, 'Octobre', 12, 500, C['muted']))
# data
random.seed(7)
base = []
for d in range(30):
    wd = (d + 6) % 7  # 1 nov 2026 is Sunday -> index 6
    v = 100 + 18 * math.sin(d / 4.2) + d * 1.4 + (38 if wd in (4, 5) else 0) + random.uniform(-14, 14)
    base.append(v)
tot_ = sum(base)
vals = [round(v / tot_ * 3850000 / 500) * 500 for v in base]
vals[-1] += 3850000 - sum(vals)
prev = [v * random.uniform(.78, .95) for v in vals]
gx0, gx1 = X0 + 72, X0 + CHW - 24
gy0, gy1 = RY + 120, RY + RH - 44
ymax = 200000
for k in range(5):
    v = k * 50000
    y = gy1 - (gy1 - gy0) * v / ymax
    ch.append(L(gx0, y, gx1, y, C['line'], 1, None if k == 0 else '4 4'))
    ch.append(T(gx0 - 14, y + 4, '0' if v == 0 else f'{v//1000}k', 11, 500, C['muted2'], anchor='end'))
def pts(arr):
    return [(gx0 + (gx1 - gx0) * i / 29, gy1 - (gy1 - gy0) * v / ymax) for i, v in enumerate(arr)]
def smooth(p):
    d = f'M{p[0][0]:.1f} {p[0][1]:.1f}'
    for i in range(1, len(p)):
        x0_, y0_ = p[i - 1]; x1_, y1_ = p[i]
        p0 = p[i - 2] if i > 1 else p[i - 1]; p3 = p[i + 1] if i < len(p) - 1 else p[i]
        c1 = (x0_ + (x1_ - p0[0]) / 6, y0_ + (y1_ - p0[1]) / 6)
        c2 = (x1_ - (p3[0] - x0_) / 6, y1_ - (p3[1] - y0_) / 6)
        d += f' C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {x1_:.1f} {y1_:.1f}'
    return d
pc, pp = pts(vals), pts(prev)
dc = smooth(pc)
ch.append(P(dc + f' L{gx1} {gy1} L{gx0} {gy1} Z', fill=s.lg([(0, C['green2'], .28), (1, C['green2'], 0)])))
ch.append(P(smooth(pp), stroke=C['muted2'], sw=1.8, dash='4 5'))
ch.append(P(dc, stroke=C['green'], sw=3))
for d_ in (0, 7, 14, 21, 29):
    ch.append(T(pc[d_][0], gy1 + 24, f'{d_+1} nov.', 11, 500, C['muted2'], anchor='middle'))
pk = max(range(30), key=lambda i: vals[i])
px_, py_ = pc[pk]
ch.append(L(px_, py_, px_, gy1, C['forest'], 1.2, '3 3'))
ch.append(Ci(px_, py_, 9, C['lime'], op=.6))
ch.append(Ci(px_, py_, 5.5, C['forest'], '#FFFFFF', 2.5))
jours = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
lbl = f'{jours[pk % 7]} {pk+1} nov.'
ttw = 150
tx_ = px_ - ttw - 16
ch.append(R(tx_, py_ - 8, ttw, 52, 12, C['ink'], filt=s.shadow(6, 14, .2)))
ch.append(T(tx_ + 14, py_ + 13, lbl, 11, 500, '#FFFFFF', op=.65))
ch.append(T(tx_ + 14, py_ + 33, f'{fmt(vals[pk])} FCFA', 14, 700, '#FFFFFF'))
A(s.g('Graphique des ventes', ch))
PEAK = vals[pk]

# ---------------- ORDER STATUS GAUGE ----------------
GX = X0 + CHW + GAP; GW = X1 - GX
gg = [R(GX, RY, GW, RH, 22, '#FFFFFF', C['line'])]
gg.append(T(GX + 24, RY + 40, 'Statut des commandes', 18, 700, C['ink'], 'B'))
gg.append(Ci(GX + GW - 36, RY + 34, 17, 'none', C['line2'], 1.2))
gg.append(I('dots', GX + GW - 46, RY + 24, 20, C['ink'], 2.6))
gcx, gcy, gr = GX + GW / 2, RY + 218, 112
segs = [(385, C['forest']), (60, C['green2']), (75, C['lime'])]
tot = 520
gapd = 4  # degrees gap
a0 = 180
def arc(a_start, a_end, r):
    x1_, y1_ = gcx + r * math.cos(math.radians(a_start)), gcy - r * math.sin(math.radians(a_start))
    x2_, y2_ = gcx + r * math.cos(math.radians(a_end)), gcy - r * math.sin(math.radians(a_end))
    large = 1 if abs(a_start - a_end) > 180 else 0
    return f'M{x1_:.2f} {y1_:.2f} A{r} {r} 0 {large} 1 {x2_:.2f} {y2_:.2f}'
gg.append(P(arc(180, 0, gr), stroke=C['cream'], sw=30, cap='round'))
cur = 180
for n, col in segs:
    span = 180 * n / tot
    gg.append(P(arc(cur - gapd / 2 if cur != 180 else cur, cur - span + gapd / 2 if cur - span > 0.5 else 0, gr), stroke=col, sw=30, cap='round' if col != C['green2'] else 'butt'))
    cur -= span
gg.append(T(gcx, gcy - 26, '74 %', 40, 700, C['ink'], 'B', anchor='middle', ls=-1))
gg.append(T(gcx, gcy - 2, 'livrées sur 520 commandes', 12, 500, C['muted'], anchor='middle'))
ly = RY + 262
items = [('Livrées', '385', C['forest']), ('En cours', '60', C['green2']), ('En attente', '75', C['lime'])]
iw = (GW - 48 - 16) / 3
for j, (t, n, col) in enumerate(items):
    ix = GX + 24 + j * (iw + 8)
    gg.append(R(ix, ly, iw, 58, 14, C['page'], C['line']))
    gg.append(Ci(ix + 16, ly + 20, 5, col, C['forest'] if col == C['lime'] else None, 1))
    gg.append(T(ix + 27, ly + 24, t, 12, 500, C['muted']))
    gg.append(T(ix + 12, ly + 47, n, 18, 700, C['ink'], 'B'))
A(s.g('Statut des commandes', gg))

# ---------------- ORDERS TABLE ----------------
TY = RY + RH + GAP
TH = H - 16 - 24 - TY
tb = [R(X0, TY, CHW, TH, 22, '#FFFFFF', C['line'])]
tb.append(T(X0 + 24, TY + 40, 'Dernières commandes', 18, 700, C['ink'], 'B'))
tb.append(T(X0 + 24 + tw('Dernières commandes', 18, 700, 'B') + 10, TY + 40, '· 520 ce mois', 13, 500, C['muted']))
bw_ = tw('Voir tout', 13, 600) + 40
tb.append(R(X0 + CHW - 24 - bw_, TY + 18, bw_, 34, 17, '#FFFFFF', C['line2']))
tb.append(T(X0 + CHW - 24 - bw_ + 14, TY + 40, 'Voir tout', 13, 600))
tb.append(I('arrowR', X0 + CHW - 24 - 24, TY + 28, 14, C['ink'], 2))
fw_ = tw('Filtrer', 13, 600) + 46
tb.append(R(X0 + CHW - 24 - bw_ - 8 - fw_, TY + 18, fw_, 34, 17, '#FFFFFF', C['line2']))
tb.append(I('sliders', X0 + CHW - 24 - bw_ - 8 - fw_ + 12, TY + 27, 16, C['ink']))
tb.append(T(X0 + CHW - 24 - bw_ - 8 - fw_ + 34, TY + 40, 'Filtrer', 13, 600))
cols = [('COMMANDE', 0), ('CLIENT', 92), ('DATE', 266), ('MONTANT', 362), ('PAIEMENT', 470), ('STATUT', 576)]
hy = TY + 68
tb.append(R(X0 + 12, hy, CHW - 24, 32, 10, C['page']))
for t, ox in cols:
    tb.append(T(X0 + 24 + ox, hy + 20.5, t, 11, 600, C['muted2'], ls=.6))
orders = [
    ('#EP-2051', 'Fatou Diallo', 'Cocody', '30 nov. · 14:32', 45000, 'Wave', 'En attente', '#C68642'),
    ('#EP-2050', 'Koffi Agbo', 'Marcory', '30 nov. · 12:08', 128500, 'Orange Money', 'En cours', '#5C3A21'),
    ('#EP-2049', 'Awa Sangaré', 'Plateau', '30 nov. · 10:47', 32000, 'MTN MoMo', 'Livrée', '#E0AC69'),
    ('#EP-2048', 'Yao Kouassi', 'Yopougon', '29 nov. · 18:21', 76000, 'À la livraison', 'Livrée', '#8D5524'),
    ('#EP-2047', 'Mariam Touré', 'Bingerville', '29 nov. · 16:55', 54500, 'Wave', 'Annulée', '#3B2219'),
]
stc = {'En attente': (C['amberbg'], C['amber']), 'En cours': (C['bluebg'], C['blue']), 'Livrée': (C['mint'], C['green']), 'Annulée': (C['redbg'], C['red'])}
paydot = {'Wave': '#1DC4F4', 'Orange Money': '#FF7900', 'MTN MoMo': '#FFCB05', 'À la livraison': C['green']}
rh = (TY + TH - 12 - (hy + 32)) / len(orders)
for j, (ref, nm, city, dt, amt, pay, stt, tone) in enumerate(orders):
    ry = hy + 32 + j * rh
    cy = ry + rh / 2
    if j: tb.append(L(X0 + 24, ry, X0 + CHW - 24, ry, C['line']))
    tb.append(T(X0 + 24, cy + 4.5, ref, 13, 600, C['ink']))
    tb.append(Ci(X0 + 24 + 92 + 15, cy, 15, tone))
    ini = ''.join(p[0] for p in nm.split()[:2])
    tb.append(T(X0 + 24 + 92 + 15, cy + 4, ini, 10, 700, '#FFFFFF', anchor='middle'))
    tb.append(T(X0 + 24 + 92 + 38, cy - 2, nm, 13, 600))
    tb.append(T(X0 + 24 + 92 + 38, cy + 14, city, 11, 500, C['muted']))
    tb.append(T(X0 + 24 + 266, cy + 4.5, dt, 12, 500, C['muted']))
    tb.append(T(X0 + 24 + 362, cy + 4.5, f'{fmt(amt)} F', 13, 700, C['ink']))
    tb.append(Ci(X0 + 24 + 470 + 3, cy, 3.5, paydot[pay]))
    tb.append(T(X0 + 24 + 470 + 12, cy + 4.5, pay, 12, 500, '#3E4640'))
    b_, f_ = stc[stt]
    p, pw = pill(X0 + 24 + 576, cy - 12, stt, b_, f_, 11, 600, 10, 24, f_)
    tb.append(p)
A(s.g('Tableau des dernières commandes', tb))

# ---------------- RIGHT COLUMN: OBJECTIVE + TOP PRODUCTS ----------------
OX, OW = GX, GW
oh = 158
ob = [R(OX, TY, OW, oh, 22, s.lg([(0, '#145440'), (1, '#071F17')], 0, 0, 1, 1))]
cl = s.clip(OX, TY, OW, oh, 22)
ob.append(f'<g clip-path="url(#{cl})">' + ''.join(Ci(OX + OW, TY, r, 'none', '#FFFFFF', 1, op=.08) for r in (40, 80, 120, 160, 200)) + Ci(OX + OW - 40, TY + 20, 120, s.rg([(0, C['lime'], .22), (1, C['lime'], 0)])) + '</g>')
ob.append(T(OX + 22, TY + 34, 'Objectif de novembre', 14, 600, '#FFFFFF', op=.8))
ob.append(T(OX + OW - 22, TY + 34, '77 %', 14, 700, C['lime'], anchor='end'))
ob.append(T(OX + 22, TY + 76, '3 850 000', 30, 700, '#FFFFFF', 'B', ls=-.8))
ob.append(T(OX + 22 + tw('3 850 000', 30, 700, 'B', -.8) + 8, TY + 76, '/ 5 000 000 FCFA', 13, 500, '#FFFFFF', op=.6))
segs_n = 28
sw_ = (OW - 44 - (segs_n - 1) * 3) / segs_n
for q in range(segs_n):
    on = q < round(segs_n * .77)
    ob.append(R(OX + 22 + q * (sw_ + 3), TY + 94, sw_, 22, 3, C['lime'] if on else '#FFFFFF', op=None if on else .14))
ob.append(T(OX + 22, TY + 140, 'Encore 1 150 000 FCFA pour atteindre l’objectif', 12, 500, '#FFFFFF', op=.65))
A(s.g('Objectif mensuel', ob))

py0 = TY + oh + GAP
ph = TY + TH - py0
pr = [R(OX, py0, OW, ph, 22, '#FFFFFF', C['line'])]
pr.append(T(OX + 22, py0 + 36, 'Top produits', 16, 700, C['ink'], 'B'))
pr.append(T(OX + OW - 22, py0 + 36, 'Ventes', 12, 500, C['muted'], anchor='end'))
prods = [('Robe wax Adjoa', '18 500 F', 112, '#F29F67', '#C2410C'), ('Sac raphia Néné', '24 000 F', 86, '#2F9E6B', '#0D3B2C'), ('Sandales cuir Kita', '15 000 F', 64, '#E0AC69', '#8D5524')]
rh2 = (ph - 56) / 3
for j, (nm, pz, n, g1, g2) in enumerate(prods):
    yy = py0 + 52 + j * rh2
    pr.append(R(OX + 22, yy, 40, 40, 10, s.lg([(0, g1), (1, g2)], 0, 0, 1, 1)))
    for q in range(2):
        pr.append(P(f'M{OX+22} {yy+14+q*12} q 5 -4 10 0 t 10 0 t 10 0 t 10 0', stroke='#FFFFFF', sw=1.6, op=.45))
    pr.append(T(OX + 74, yy + 17, nm, 13, 600))
    pr.append(T(OX + 74, yy + 34, pz, 12, 500, C['muted']))
    pr.append(T(OX + OW - 22, yy + 17, str(n), 14, 700, C['ink'], 'B', anchor='end'))
    pr.append(R(OX + OW - 22 - 70, yy + 28, 70, 5, 2.5, C['line']))
    pr.append(R(OX + OW - 22 - 70, yy + 28, 70 * n / 112, 5, 2.5, C['green2']))
A(s.g('Top produits', pr))

open('../out/dashboard.svg', 'w').write(s.out('EcomPilot — Dashboard'))
print('ok', sum(vals), PEAK, TH, rh, ph)
