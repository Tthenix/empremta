# Uso: python generar_qr.py "<URL>" <nombre_salida> [ruta_favicon.svg]
# Requiere: pip install segno cairosvg
# Corrección de errores H, módulos cuadrados y esquinas oscuras: legible a pleno sol y en celulares viejos.
import segno, re, cairosvg, sys
URL=sys.argv[1]; OUT=sys.argv[2]; FAV=sys.argv[3] if len(sys.argv)>3 else "../web/favicon.svg"
q=segno.make(URL, error='h')
mat=q.matrix; n=len(mat); border=4; mod=20
size=(n+2*border)*mod
c=n/2; hole=n*0.28
rects=[]
def in_finder(r,cc):
    return (r<7 and cc<7) or (r<7 and cc>=n-7) or (r>=n-7 and cc<7)
for r,row in enumerate(mat):
    for cc,v in enumerate(row):
        if not v or in_finder(r,cc): continue
        if abs(r+0.5-c)<hole/2+0.5 and abs(cc+0.5-c)<hole/2+0.5: continue
        x=(cc+border)*mod; y=(r+border)*mod
        rects.append(f'<rect x="{x+0.5}" y="{y+0.5}" width="{mod-1}" height="{mod-1}" />')
def finder(r0,c0):
    x=(c0+border)*mod; y=(r0+border)*mod
    return (f'<rect x="{x+mod/2}" y="{y+mod/2}" width="{6*mod}" height="{6*mod}" fill="none" stroke="#1F4E79" stroke-width="{mod}"/>'
            f'<rect x="{x+2*mod}" y="{y+2*mod}" width="{3*mod}" height="{3*mod}" fill="#1F4E79"/>')
fs=finder(0,0)+finder(0,n-7)+finder(n-7,0)
fav=open(FAV).read()
inner=re.search(r'<svg[^>]*>(.*)</svg>',fav,re.S).group(1)
L=hole*mod*0.95; lx=(size-L)/2
logo=f'<g transform="translate({lx:.1f} {lx:.1f}) scale({L/512:.5f})">{inner}</g>'
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}"><rect width="{size}" height="{size}" fill="#FFFFFF"/><g fill="#1F4E79">{"".join(rects)}</g>{fs}{logo}</svg>'
open(OUT+'.svg','w').write(svg)
cairosvg.svg2png(bytestring=svg.encode(), write_to=OUT+'.png', output_width=1200)
print("OK:", OUT+".svg", OUT+".png")
