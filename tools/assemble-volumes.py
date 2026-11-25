from pathlib import Path
from pypdf import PdfReader, PdfWriter
import json
root=Path('pdf')
base=root/'rider-6-1-aerovokzaly.pdf'
special=root/'airport-special-20261125.pdf'
# Preserve existing common and special requirements; attach revised special section.
# Do not silently delete old requirements without a verified comparison.
w=PdfWriter()
w.append(str(base),outline_item='Общие требования и ранее опубликованные требования')
w.append(str(special),outline_item='6.1 Аэровокзалы — редакция 25.11.2026')
out=root/'rider-6-1-aerovokzaly-20261125.pdf'
w.write(str(out))
assert len(PdfReader(out).pages)==len(PdfReader(base).pages)+len(PdfReader(special).pages)
# Master is a collection of full volumes, with common sections repeated.
# Explicitly identify this as a collection rather than a deduplicated master.
m=PdfWriter()
for p in sorted(root.glob('rider-6-*.pdf')):
    if p==base or p==out: continue
    m.append(str(p),outline_item=p.stem)
m.append(str(out),outline_item='6.1 Аэровокзалы — обновлённый том')
m.write(str(root/'rider-all-volumes-20261125.pdf'))
