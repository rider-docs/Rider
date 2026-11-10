"""Extract the rider-data JSON from a saved copy of the editor page.
Usage: python3 -I tools/extract.py <saved editor html> <out.json>"""
import re, sys, json
s = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'<script type="application/json" id="rider-data">(.*?)</script>', s, re.S)
if not m:
    sys.exit('rider-data block not found')
d = json.loads(m.group(1))
d.pop('pdf', None)
json.dump(d, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print(len(d['rules']), 'rules, edition', d['meta'])
