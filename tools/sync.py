"""Merge fresh editor data into data/rider.json and append changes to data/changelog.json.

Usage: python3 -I tools/sync.py <path to rider-data JSON extracted from the editor page>
Exit code 0 = changes written, 3 = nothing changed.
"""
import json, sys, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'rider.json')
LOG = os.path.join(ROOT, 'data', 'changelog.json')


def load(p, default):
    try:
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def label(data, r):
    types = {t[0]: t for t in data['types']}
    sec = next((s for s in data['sections'] if s['key'] == r['s']), None)
    if r['s'].startswith('6.'):
        t = types.get(r['s'][2:])
        section = f"{t[1]} {t[2]}" if t else r['s']
        ty = t[3] if t else ''
    else:
        section = f"{r['s']} {sec['title']}" if sec else r['s']
        ty = 'Все типы' if 'all' in r['ty'] else ', '.join(types[k][3] for k in r['ty'] if k in types)
    text = r['t'] if len(r['t']) <= 160 else r['t'][:157].rstrip() + '…'
    return section, ty, text


def main():
    new = json.load(open(sys.argv[1], encoding='utf-8'))
    old = load(DATA, None)
    log = load(LOG, [])
    today = (datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=3)))).strftime('%d.%m.%Y')
    entries = []
    if old is not None:
        o = {r['id']: r for r in old['rules']}
        n = {r['id']: r for r in new['rules']}
        keys = ('s', 'k', 'ty', 't', 'f', 'l')
        for rid, r in n.items():
            if rid not in o:
                act = 'Добавлено'
            elif any(o[rid].get(k) != r.get(k) for k in keys):
                act = 'Изменено'
            else:
                continue
            sec, ty, text = label(new, r)
            entries.append({'date': today, 'action': act, 'text': text, 'section': sec, 'types': ty})
        for rid, r in o.items():
            if rid not in n:
                sec, ty, text = label(old, r)
                entries.append({'date': today, 'action': 'Удалено', 'text': text, 'section': sec, 'types': ty})
        if not entries and json.dumps(old, sort_keys=True) == json.dumps(new, sort_keys=True):
            print('no changes')
            sys.exit(3)
    log = entries + log
    os.makedirs(os.path.dirname(DATA), exist_ok=True)
    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(new, f, ensure_ascii=False, separators=(',', ':'))
    with open(LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=1)
    print(f'{len(entries)} change(s) logged')


if __name__ == '__main__':
    main()
