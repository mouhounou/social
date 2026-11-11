import sys; sys.path.insert(0, '.')
from lib import *
W, H = 1440, 3100
s = SVG(W, H)
A = s.add
A(R(0, 0, W, H, 0, C['page'], name='Page background'))

# ================= HERO =================
hero = []
HX, HY, HW, HH = 24, 24, 1392, 860
hero.append(R(HX, HY, HW, HH, 36, s.lg([(0, '#F4EFE6'), (1, '#E9E1D3')], 0, 0, 1, 1)))
# soft glow
hero.append(Ci(1080, 420, 420, s.rg([(0, '#FFFFFF', .55), (1, '#FFFFFF', 0)])))
# nav
nav = [logo(72, 56)]
links = ['Fonctionnalités', 'Tarifs', 'Témoignages', 'Ressources', 'Contact']
x = 470
for i, t in enumerate(links):
    nav.append(T(x, 81, t, 14, 600 if i == 0 else 500, C['ink'] if i == 0 else '#3E4640'))
    if i == 0: nav.append(Ci(x + tw(t, 14, 600) / 2, 93, 2.5, C['green']))
    x += tw(t, 14, 500) + 34
nav.append(R(1086, 52, 152, 44, 22, 'none', C['ink'], 1.2, op=None))
nav.append(I('users', 1106, 64, 18, C['ink']))
nav.append(T(1132, 80, 'Se connecter', 14, 600))
nav.append(R(1250, 52, 118, 44, 22, C['ink']))
nav.append(T(1309, 80, 'Essai gratuit', 14, 600, '#FFFFFF', anchor='middle'))
hero.append(s.g('Navigation', nav))

# left column
lc = []
b, bw = pill(80, 150, '', '#FFFFFF', C['ink'])
lc.append(R(80, 150, 330, 34, 17, '#FFFFFF', C['line2']))
lc.append(R(85, 155, 54, 24, 12, C['forest']))
lc.append(T(112, 171, 'NEW', 11, 700, C['lime'], anchor='middle', ls=0.6))
lc.append(T(150, 172, 'Suivi des livreurs en temps réel', 13, 500, '#3E4640'))
lc.append(I('arrowR', 384, 160, 14, C['ink'], 2))
for i, (t, col) in enumerate([('PILOTEZ VOTRE', C['ink']), ('E-COMMERCE SANS', C['forest2']), ('TURBULENCES.', C['ink'])]):
    y = 272 + i * 74
    if i == 2:
        lc.append(R(76, y - 22, tw('TURBULENCES', 68, 800, 'B', -1.5) + 10, 26, 6, C['lime']))
    lc.append(T(80, y, t, 68, 800, col, 'B', ls=-1.5))
sub = ['Commandes, livraisons, produits et statistiques : EcomPilot',
       'réunit toute votre boutique en ligne dans un seul cockpit.',
       'Pensé pour l’Afrique, en FCFA et compatible mobile money.']
for i, t in enumerate(sub):
    lc.append(T(80, 470 + i * 28, t, 18, 400, '#3E4640'))
# CTAs
lc.append(R(80, 562, 280, 60, 30, C['forest'], filt=s.shadow(10, 24, .22, (13, 59, 44))))
lc.append(T(108, 598, 'Démarrer gratuitement', 16, 600, '#FFFFFF'))
lc.append(Ci(330, 592, 22, C['lime']))
lc.append(I('arrowUR', 321, 583, 18, C['forest'], 2.2))
lc.append(R(372, 562, 196, 60, 30, '#FFFFFF', C['line2']))
lc.append(Ci(402, 592, 18, C['mint']))
lc.append(I('play', 395, 585, 14, C['forest'], 1.6, C['forest']))
lc.append(T(430, 597, 'Voir la démo', 15, 600))
lc.append(T(524, 597, '2 min', 13, 500, C['muted']))
lc.append(T(80, 664, 'Paiements intégrés :', 14, 600, C['ink']))
x = 80
for t, dot in [('Orange Money', '#FF7900'), ('Wave', '#1DC4F4'), ('MTN MoMo', '#FFCB05'), ('Moov Money', '#0066B3'), ('Cash à la livraison', C['green'])]:
    p, wdt = pill(x, 680, t, '#FFFFFF', C['ink'], 13, 500, 14, 34, dot)
    lc.append(p); x += wdt + 8
# trust card
lc.append(R(80, 748, 360, 96, 22, '#FFFFFF', filt=s.shadow(10, 30, .06)))
lc.append(T(104, 778, 'Ils nous font confiance', 13, 600, C['ink']))
tones = [('#8D5524', 'AK'), ('#C68642', 'MD'), ('#5C3A21', 'YT'), ('#E0AC69', 'FS'), ('#3B2219', '+')]
for i, (c, ini) in enumerate(tones):
    cx = 120 + i * 26
    lc.append(Ci(cx, 812, 17, c, '#FFFFFF', 2.5))
    if ini == '+': lc.append(T(cx, 816.5, '+2k', 10, 700, '#FFFFFF', anchor='middle'))
for i in range(5):
    lc.append(f'<g transform="translate({270 + i*18} 766) scale(0.62)"><path d="{ICONS["star"]}" fill="#F5A524"/></g>')
lc.append(T(270, 815, '2 500+', 24, 700, C['ink'], 'B'))
lc.append(T(270 + tw('2 500+', 24, 700, 'B') + 6, 815, 'boutiques', 13, 500, C['muted']))
lc.append(T(270, 833, 'Note moyenne 4,9 / 5', 12, 500, C['muted']))
hero.append(s.g('Hero / Texte', lc))

# right visual : cockpit stage
rv = []
SX, SY, SW, SH = 808, 136, 560, 700
rv.append(R(SX, SY, SW, SH, 32, s.lg([(0, '#145440'), (1, '#0A2E22')], 0, 0, .6, 1)))
rcx, rcy = SX + SW / 2, SY + SH / 2 + 20
cl = s.clip(SX, SY, SW, SH, 32)
rings = [Ci(rcx, rcy, r, 'none', '#FFFFFF', 1, op=.07) for r in (90, 170, 250, 330, 410)]
rings.append(L(SX, rcy, SX + SW, rcy, '#FFFFFF', 1, op=.05)); rings.append(L(rcx, SY, rcx, SY + SH, '#FFFFFF', 1, op=.05))
rings.append(Ci(rcx + 200, rcy - 150, 220, s.rg([(0, C['lime'], .22), (1, C['lime'], 0)])))
rings.append(P(f'M{SX+40} {SY+SH-60} C {SX+200} {SY+SH-150}, {SX+300} {SY+300}, {SX+SW-60} {SY+120}', stroke=C['lime'], sw=1.5, dash='2 8', op=.6))
rv.append(f'<g clip-path="url(#{cl})">' + ''.join(rings) + '</g>')
# rotating badge (top-right)
bx, by = SX + 6, SY + 26
rv.append(Ci(bx, by, 58, '#FFFFFF', filt=s.shadow(8, 24, .15)))
rv.append(Ci(bx, by, 49, 'none', C['line2'], 1, dash='3 4'))
rv.append(T(bx, by - 18, 'SUIVI', 10, 700, C['muted'], anchor='middle', ls=1.5))
rv.append(T(bx, by + 10, '24/7', 26, 800, C['forest'], 'B', anchor='middle'))
rv.append(T(bx, by + 28, 'EN DIRECT', 9, 700, C['muted'], anchor='middle', ls=1.2))
rv.append(Ci(bx - 26, by - 22, 4, C['green2']))

# main revenue card
mx, my, mw, mh = 852, 214, 420, 290
rv.append(R(mx, my, mw, mh, 24, '#FFFFFF', filt=s.shadow(20, 50, .25, (4, 20, 14))))
rv.append(T(mx + 24, my + 40, 'Chiffre d’affaires', 14, 600, C['muted']))
pl, _ = pill(mx + mw - 110, my + 22, 'Ce mois', C['cream'], C['ink'], 12, 600, 12, 28)
rv.append(pl); rv.append(I('chevD', mx + mw - 34, my + 29, 14, C['ink']))
rv.append(T(mx + 24, my + 88, '3 850 000', 40, 700, C['ink'], 'B', ls=-1))
rv.append(T(mx + 24 + tw('3 850 000', 40, 700, 'B', -1) + 8, my + 88, 'FCFA', 16, 600, C['muted']))
p, _ = pill(mx + 24, my + 104, '+12,4 %', C['mint'], C['green'], 12, 700, 10, 24)
rv.append(p); rv.append(T(mx + 108, my + 121, 'vs. mois dernier', 12, 500, C['muted']))
vals = [52, 70, 58, 86, 74, 104, 92]
days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
bw_, gap = 38, 18
for i, v in enumerate(vals):
    bx_ = mx + 24 + i * (bw_ + gap)
    h = v * 1.05
    by_ = my + 252 - h
    if i == 5:
        rv.append(R(bx_, by_, bw_, h, 12, s.lg([(0, C['green2']), (1, C['forest'])])))
        rv.append(R(bx_ - 18, by_ - 34, 74, 26, 8, C['ink']))
        rv.append(T(bx_ + bw_ / 2, by_ - 16, '214 500', 12, 700, '#FFFFFF', anchor='middle'))
    elif i == 6:
        rv.append(R(bx_, by_, bw_, h, 12, C['mint2']))
    else:
        rv.append(R(bx_, by_, bw_, h, 12, C['mint']))
    rv.append(T(bx_ + bw_ / 2, my + 274, days[i], 12, 500, C['muted2'], anchor='middle'))
rv = [s.g('Visuel / Scène', rv[:2])] + rv[2:]

# floating: new order
fx, fy, fw, fh = 744, 548, 300, 116
fo = [R(fx, fy, fw, fh, 20, '#FFFFFF', filt=s.shadow(16, 40, .22, (4, 20, 14)))]
fo.append(Ci(fx + 36, fy + 38, 20, '#C68642'))
fo.append(T(fx + 36, fy + 43, 'FD', 13, 700, '#FFFFFF', anchor='middle'))
fo.append(Ci(fx + 51, fy + 24, 6, C['orange'], '#FFFFFF', 2))
fo.append(T(fx + 66, fy + 34, 'Nouvelle commande', 14, 700, C['ink']))
fo.append(T(fx + 66, fy + 52, '#EP-2051 · Fatou Diallo', 12, 500, C['muted']))
fo.append(L(fx + 16, fy + 72, fx + fw - 16, fy + 72, C['line']))
fo.append(T(fx + 16, fy + 100, '45 000 FCFA', 16, 700, C['ink'], 'B'))
fo.append(T(fx + 118, fy + 99, 'via Wave', 12, 500, C['muted']))
p, pw = pill(0, 0, 'Payée', C['mint'], C['green'], 12, 600, 10, 24, C['green2'])
p, pw = pill(fx + fw - 16 - pw, fy + 84, 'Payée', C['mint'], C['green'], 12, 600, 10, 24, C['green2'])
fo.append(p)
rv.append(s.g('Carte / Nouvelle commande', fo))

# floating: delivery
dx, dy, dw, dh = 1040, 590, 300, 196
de = [R(dx, dy, dw, dh, 20, '#FFFFFF', filt=s.shadow(16, 40, .22, (4, 20, 14)))]
de.append(R(dx + 16, dy + 16, 40, 40, 12, C['lime']))
de.append(I('truck', dx + 25, dy + 25, 22, C['forest'], 1.8))
de.append(T(dx + 68, dy + 33, 'Livraison en cours', 14, 700))
de.append(T(dx + 68, dy + 51, 'Moussa K. · Moto #12', 12, 500, C['muted']))
# mini route
ry = dy + 92
de.append(R(dx + 16, dy + 70, dw - 32, 56, 14, C['cream']))
de.append(P(f'M{dx+40} {ry+8} C {dx+100} {ry-26}, {dx+150} {ry+30}, {dx+200} {ry} S {dx+250} {ry-14}, {dx+262} {ry}', stroke=C['forest'], sw=2.5, dash='1 6'))
de.append(P(f'M{dx+40} {ry+8} C {dx+100} {ry-26}, {dx+150} {ry+30}, {dx+176} {ry+9}', stroke=C['forest'], sw=3))
de.append(Ci(dx + 40, ry + 8, 6, C['forest']))
de.append(Ci(dx + 176, ry + 9, 9, C['lime'], C['forest'], 2.5))
de.append(f'<g transform="translate({dx+252} {ry-20})">' + P(ICONS['pin'], fill=C['orange'], stroke='#FFFFFF', sw=1.5).replace('<path', '<path transform="scale(0.85)"') + '</g>')
de.append(T(dx + 16, dy + 152, 'Cocody → Plateau', 13, 600))
de.append(T(dx + dw - 16, dy + 152, '12 min', 13, 700, C['green'], anchor='end'))
de.append(R(dx + 16, dy + 166, dw - 32, 6, 3, C['line']))
de.append(R(dx + 16, dy + 166, (dw - 32) * .68, 6, 3, s.lg([(0, C['green2']), (1, C['forest'])], 0, 0, 1, 0)))
rv.append(s.g('Carte / Livraison', de))

# floating: stock chip
kx, ky = 826, 716
st = [R(kx, ky, 196, 72, 18, '#FFFFFF', filt=s.shadow(12, 30, .2, (4, 20, 14)))]
st.append(R(kx + 14, ky + 14, 44, 44, 12, s.lg([(0, '#F29F67'), (1, '#C2410C')], 0, 0, 1, 1)))
for j in range(4):
    st.append(P(f'M{kx+14} {ky+22+j*10} q 11 -8 22 0 t 22 0', stroke='#FFFFFF', sw=2, op=.55))
st.append(T(kx + 70, ky + 32, 'Robe wax Adjoa', 13, 700))
st.append(T(kx + 70, ky + 50, 'Stock : 4 restants', 12, 600, C['orange']))
rv.append(s.g('Carte / Stock', st))
hero.append(s.g('Hero / Visuel', rv))
A(s.g('Section 1 · Hero', hero))

# ================= TRUST STRIP =================
tr = []
tr.append(T(W / 2, 950, 'PLUS DE 2 500 BOUTIQUES EN AFRIQUE DE L’OUEST PILOTENT LEURS VENTES AVEC ECOMPILOT', 12, 600, C['muted'], anchor='middle', ls=1.4))
brands = [('Kente&Co', 'B', 800), ('wax studio', 'I', 700), ('BAOBAB', 'B', 800), ('Teranga.shop', 'I', 600), ('Sahel Beauty', 'B', 600), ('NDAKO home', 'I', 700)]
total = sum(tw(b, 24, wt, f, -0.5) for b, f, wt in brands) + 72 * 5
x = (W - total) / 2
for b, f, wt in brands:
    tr.append(T(x, 1000, b, 24, wt, '#A7A196', f, ls=-0.5)); x += tw(b, 24, wt, f, -0.5) + 72
A(s.g('Section 2 · Confiance', tr))

# ================= FEATURES =================
fe = []
FY = 1080
fe.append(T(80, FY + 48, 'TOUT VOTRE BUSINESS,', 48, 800, C['ink'], 'B', ls=-1))
fe.append(T(80, FY + 100, 'UN SEUL COCKPIT.', 48, 800, C['forest2'], 'B', ls=-1))
fe.append(T(80, FY + 140, 'Quatre modules connectés pour vendre plus et perdre moins de temps.', 17, 400, C['muted']))
fe.append(T(1360, FY + 96, 'Fonctionnalités clés', 13, 600, C['muted'], anchor='end'))
fe.append(R(1128, FY + 110, 232, 4, 2, C['line']))
fe.append(R(1128, FY + 110, 58, 4, 2, C['forest']))
cards = [
    ('COMMANDES', 'bag', 'Centralisez les commandes de votre', 'site, WhatsApp et Instagram.', C['mint']),
    ('LIVRAISONS', 'truck', 'Assignez un livreur et suivez chaque', 'colis jusqu’au client, en direct.', '#F2E9DA'),
    ('PRODUITS', 'box', 'Catalogue, variantes et stock', 'synchronisés, alertes de rupture.', '#F8E4D8'),
    ('STATISTIQUES', 'chart', 'CA, marges et meilleures ventes', 'en temps réel, sans Excel.', C['forest']),
]
cw, ch, cy = 302, 412, FY + 184
for i, (title, ic, d1, d2, bg) in enumerate(cards):
    cx = 80 + i * (cw + 24)
    c = [R(cx, cy, cw, ch, 26, '#FFFFFF', C['line'])]
    ix, iy, iw, ih = cx + 10, cy + 10, cw - 20, 214
    c.append(R(ix, iy, iw, ih, 18, bg))
    if title == 'COMMANDES':
        rows = [('#EP-2051', 'Fatou D.', 'Payée', C['green'], '#FFFFFF'), ('#EP-2050', 'Koffi A.', 'En attente', C['amber'], '#FFFFFF'), ('#EP-2049', 'Awa S.', 'Livrée', C['forest'], '#FFFFFF')]
        for j, (ref, nm, stt, col, bgc) in enumerate(rows):
            ry_ = iy + 26 + j * 56
            c.append(R(ix + 18 + (j == 0) * -6, ry_, iw - 36 + (j == 0) * 12, 46, 12, '#FFFFFF', filt=s.shadow(6, 14, .08) if j == 0 else None))
            c.append(Ci(ix + 40, ry_ + 23, 12, ['#C68642', '#5C3A21', '#E0AC69'][j]))
            c.append(T(ix + 60, ry_ + 20, ref, 12, 700))
            c.append(T(ix + 60, ry_ + 36, nm, 11, 500, C['muted']))
            p, pw = pill(0, 0, stt, '#fff', col, 11, 600, 8, 22)
            p, pw = pill(ix + iw - 30 - pw, ry_ + 12, stt, {C['green']: C['mint'], C['amber']: C['amberbg'], C['forest']: C['mint2']}[col], col, 11, 600, 8, 22)
            c.append(p)
    elif title == 'LIVRAISONS':
        for k in range(6):
            c.append(L(ix + 20 + k * 52, iy, ix + k * 52 - 20, iy + ih, '#FFFFFF', 7, op=.75))
        c.append(L(ix, iy + 70, ix + iw, iy + 40, '#FFFFFF', 9, op=.75))
        c.append(L(ix, iy + 160, ix + iw, iy + 175, '#FFFFFF', 9, op=.75))
        c.append(P(f'M{ix+40} {iy+180} L {ix+90} {iy+120} L {ix+170} {iy+130} L {ix+220} {iy+60}', stroke=C['forest'], sw=4))
        c.append(Ci(ix + 40, iy + 180, 8, C['forest'], '#FFFFFF', 3))
        c.append(f'<g transform="translate({ix+206} {iy+24}) scale(1.2)">' + P(ICONS['pin'], fill=C['orange'], stroke='#FFFFFF', sw=1.5) + '</g>')
        c.append(R(ix + 70, iy + 90, 96, 28, 14, C['ink']))
        c.append(T(ix + 118, iy + 108, 'ETA 12 min', 11, 700, C['lime'], anchor='middle'))
    elif title == 'PRODUITS':
        for j, (g1, g2, nm, stock, pct) in enumerate([('#F29F67', '#C2410C', 'Robe wax', '24 en stock', .7), ('#2F9E6B', '#0D3B2C', 'Sac raphia', '4 restants', .15)]):
            px = ix + 18 + j * 128
            c.append(R(px, iy + 22, 116, 170, 14, '#FFFFFF', filt=s.shadow(6, 14, .07)))
            c.append(R(px + 8, iy + 30, 100, 84, 10, s.lg([(0, g1), (1, g2)], 0, 0, 1, 1)))
            for q in range(4):
                c.append(P(f'M{px+8} {iy+44+q*20} q 12.5 -9 25 0 t 25 0 t 25 0 t 25 0', stroke='#FFFFFF', sw=2, op=.45))
            c.append(T(px + 10, iy + 136, nm, 12, 700))
            c.append(T(px + 10, iy + 153, stock, 11, 600, C['red'] if pct < .3 else C['muted']))
            c.append(R(px + 10, iy + 166, 96, 5, 2.5, C['line']))
            c.append(R(px + 10, iy + 166, 96 * pct, 5, 2.5, C['red'] if pct < .3 else C['green2']))
    else:
        pts = [(0, 150), (40, 132), (80, 140), (120, 104), (160, 112), (200, 70), (240, 82), (262, 44)]
        d = 'M' + ' L'.join(f'{ix+10+a} {iy+b}' for a, b in pts)
        c.append(P(d + f' L{ix+272} {iy+ih} L{ix+10} {iy+ih} Z', fill=s.lg([(0, C['lime'], .35), (1, C['lime'], 0)])))
        for k in range(4):
            c.append(L(ix + 10, iy + 50 + k * 40, ix + iw - 10, iy + 50 + k * 40, '#FFFFFF', 1, '3 5', .12))
        c.append(P(d, stroke=C['lime'], sw=3))
        c.append(Ci(ix + 10 + 262, iy + 44, 6, C['lime'], C['forest'], 3))
        c.append(T(ix + 20, iy + 34, '+38 %', 26, 800, '#FFFFFF', 'B'))
        c.append(T(ix + 20, iy + 54, 'de ventes en 3 mois', 11, 500, '#FFFFFF', op=.7))
    # icon bubble
    c.append(Ci(cx + 46, cy + 224, 30, '#FFFFFF', C['line'], 1))
    c.append(I(ic, cx + 34, cy + 212, 24, C['forest'], 1.7))
    c.append(T(cx + 24, cy + 294, title, 19, 800, C['ink'], 'B', ls=.2))
    c.append(T(cx + 24, cy + 322, d1, 14, 400, C['muted']))
    c.append(T(cx + 24, cy + 342, d2, 14, 400, C['muted']))
    c.append(L(cx + 24, cy + 362, cx + cw - 24, cy + 362, C['line']))
    c.append(T(cx + 24, cy + 392, 'Découvrir', 14, 600))
    c.append(I('arrowR', cx + 24 + tw('Découvrir', 14, 600) + 8, cy + 380, 16, C['ink'], 2))
    fe.append(s.g(f'Carte fonctionnalité / {title.title()}', c))
A(s.g('Section 3 · Fonctionnalités', fe))

# ================= STATS BAND =================
sb = []
BY = 1740
sb.append(R(24, BY, 1392, 440, 36, s.lg([(0, '#0F4433'), (1, '#0A2B20')], 0, 0, 1, 1)))
cl2 = s.clip(24, BY, 1392, 440, 36)
sb.append(f'<g clip-path="url(#{cl2})">' + ''.join(Ci(1300, BY + 440, r, 'none', '#FFFFFF', 1, op=.06) for r in (120, 220, 320, 420)) + Ci(200, BY, 300, s.rg([(0, C['lime'], .14), (1, C['lime'], 0)])) + '</g>')
p, _ = pill(80, BY + 64, 'RÉSULTATS CLIENTS', '#FFFFFF1A', C['lime'], 11, 700, 12, 28)
sb.append(R(80, BY + 64, tw('RÉSULTATS CLIENTS', 11, 700, ls=1) + 24, 28, 14, '#FFFFFF', op=.1))
sb.append(T(92, BY + 82, 'RÉSULTATS CLIENTS', 11, 700, C['lime'], ls=1))
sb.append(T(80, BY + 148, 'Moins de tableurs,', 44, 800, '#FFFFFF', 'B', ls=-1))
sb.append(T(80, BY + 198, 'plus de ventes.', 44, 800, C['lime'], 'B', ls=-1))
for i, t in enumerate(['Nos marchands gagnent du temps dès la première', 'semaine et prennent leurs décisions sur des', 'chiffres fiables, pas sur des intuitions.']):
    sb.append(T(80, BY + 244 + i * 26, t, 16, 400, '#FFFFFF', op=.72))
# quote card
sb.append(R(80, BY + 330, 470, 70, 18, '#FFFFFF', op=.07))
sb.append(Ci(116, BY + 365, 20, '#C68642'))
sb.append(T(116, BY + 370, 'AK', 12, 700, '#FFFFFF', anchor='middle'))
sb.append(T(148, BY + 360, '« Je sais enfin où en est chaque colis. »', 14, 600, '#FFFFFF'))
sb.append(T(148, BY + 380, 'Aïcha Koné, fondatrice de Wax Studio · Abidjan', 12, 500, '#FFFFFF', op=.6))
stats = [('+38 %', 'de chiffre d’affaires', 'en moyenne après 3 mois'), ('6 h', 'gagnées chaque semaine', 'sur la gestion des commandes'), ('98 %', 'des colis suivis', 'jusqu’à la livraison')]
for i, (n, l1, l2) in enumerate(stats):
    sx = 680 + i * 236
    sb.append(R(sx, BY + 64, 220, 312, 24, '#FFFFFF', op=.06))
    sb.append(R(sx, BY + 64, 220, 312, 24, 'none', '#FFFFFF', 1, op=.1))
    sb.append(Ci(sx + 44, BY + 108, 20, C['lime']))
    sb.append(I(['trend', 'clock', 'shield'][i], sx + 34, BY + 98, 20, C['forest'], 2))
    sb.append(T(sx + 24, BY + 270, n, 56, 800, '#FFFFFF', 'B', ls=-1.5))
    sb.append(T(sx + 24, BY + 310, l1, 15, 600, '#FFFFFF'))
    sb.append(T(sx + 24, BY + 332, l2, 13, 400, '#FFFFFF', op=.6))
A(s.g('Section 4 · Résultats', sb))

# ================= STEPS =================
stp = []
SY2 = 2260
stp.append(T(W / 2, SY2 + 40, 'DÉCOLLAGE EN 3 ÉTAPES', 40, 800, C['ink'], 'B', anchor='middle', ls=-1))
stp.append(T(W / 2, SY2 + 76, 'Aucune compétence technique requise. Votre boutique est prête en moins de 10 minutes.', 16, 400, C['muted'], anchor='middle'))
steps = [('01', 'Créez votre boutique', 'Nom, logo, devise FCFA : c’est parti.'), ('02', 'Ajoutez vos produits', 'Importez votre catalogue en un clic.'), ('03', 'Encaissez et livrez', 'Mobile money, livreurs, suivi client.')]
sw_ = 400
for i, (n, t1, t2) in enumerate(steps):
    sx = 80 + i * (sw_ + 40)
    stp.append(R(sx, SY2 + 116, sw_, 120, 22, '#FFFFFF', C['line']))
    stp.append(R(sx + 20, SY2 + 136, 80, 80, 18, C['lime'] if i == 2 else C['cream']))
    stp.append(T(sx + 60, SY2 + 189, n, 32, 800, C['forest'], 'B', anchor='middle'))
    stp.append(T(sx + 122, SY2 + 170, t1, 18, 700, C['ink'], 'B'))
    stp.append(T(sx + 122, SY2 + 196, t2, 14, 400, C['muted']))
    if i < 2:
        stp.append(I('arrowR', sx + sw_ + 10, SY2 + 166, 20, C['muted2'], 1.8))
A(s.g('Section 5 · Étapes', stp))

# ================= CTA =================
ct = []
CY = 2560
ct.append(R(80, CY, 1280, 132, 28, C['cream']))
ct.append(Ci(146, CY + 66, 38, '#FFFFFF'))
ct.append(I('rocket', 132, CY + 52, 28, C['forest'], 1.7))
ct.append(T(204, CY + 60, 'Prêt à décoller ? 14 jours d’essai gratuit.', 22, 700, C['ink'], 'B'))
ct.append(T(204, CY + 86, 'Sans carte bancaire. Annulable à tout moment. Support WhatsApp inclus.', 14, 400, C['muted']))
ct.append(R(842, CY + 38, 330, 56, 28, '#FFFFFF', C['line2']))
ct.append(I('mail', 864, CY + 56, 20, C['muted2']))
ct.append(T(894, CY + 71, 'Votre adresse e-mail', 15, 400, C['muted2']))
ct.append(R(1184, CY + 38, 152, 56, 28, C['forest']))
ct.append(T(1260, CY + 71, 'Commencer', 15, 600, '#FFFFFF', anchor='middle'))
A(s.g('Section 6 · Appel à l’action', ct))

# ================= FOOTER =================
fo = []
FY2 = 2780
fo.append(logo(80, FY2))
for i, t in enumerate(['Le cockpit des e-commerçants africains :', 'commandes, livraisons, produits et', 'statistiques au même endroit.']):
    fo.append(T(80, FY2 + 70 + i * 22, t, 14, 400, C['muted']))
for i in range(4):
    fo.append(Ci(98 + i * 46, FY2 + 158, 18, '#FFFFFF', C['line2']))
soc = ['M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.5 7.5h.01',
       'M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2.5 4 5 4',
       'M3 12a9 9 0 1 1 3.5 7.1L3 20l1-3.4A9 9 0 0 1 3 12zM9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5z',
       'M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v7h3v-7h2.5l.5-3h-3V8a1 1 0 0 1 1-1h2V4z']
for i, d in enumerate(soc):
    fo.append(f'<g transform="translate({90 + i*46} {FY2+150}) scale(0.6667)"><path d="{d}" stroke="{C["ink"]}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>')
cols = [('Produit', ['Commandes', 'Livraisons', 'Produits & stock', 'Statistiques', 'Tarifs']),
        ('Entreprise', ['À propos', 'Carrières', 'Partenaires', 'Presse']),
        ('Aide', ['Centre d’aide', 'Guides vidéo', 'Statut du service', 'API'])]
for i, (h, items) in enumerate(cols):
    x = 520 + i * 180
    fo.append(T(x, FY2 + 20, h, 15, 700))
    for j, it in enumerate(items):
        fo.append(T(x, FY2 + 54 + j * 28, it, 14, 400, C['muted']))
fo.append(T(1080, FY2 + 20, 'Contact', 15, 700))
fo.append(T(1080, FY2 + 56, '+225 07 00 00 00 00', 18, 700, C['ink'], 'B'))
fo.append(T(1080, FY2 + 80, 'Lun – Sam · 8 h – 20 h (GMT)', 13, 400, C['muted']))
fo.append(T(1080, FY2 + 118, 'bonjour@ecompilot.app', 16, 600))
fo.append(T(1080, FY2 + 142, 'Abidjan · Dakar · Lomé', 13, 400, C['muted']))
fo.append(L(80, FY2 + 220, 1360, FY2 + 220, C['line']))
fo.append(T(80, FY2 + 256, '© 2026 EcomPilot. Tous droits réservés.', 13, 400, C['muted']))
x = 1360
for t in reversed(['Confidentialité', 'Conditions', 'Cookies']):
    fo.append(T(x, FY2 + 256, t, 13, 500, C['muted'], anchor='end')); x -= tw(t, 13, 500) + 28
A(s.g('Section 7 · Footer', fo))

open('../out/landing.svg', 'w').write(s.out('EcomPilot — Landing page'))
print('ok', H)
