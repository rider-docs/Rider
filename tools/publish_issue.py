"""Publish a reviewed GitHub issue into the rider and append a changelog entry."""
import json, os, re, sys, datetime, uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
event=json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
issue=event["issue"]
body=issue.get("body") or ""
if "<!-- RIDER_REQUIREMENT_V1 -->" not in body:
    sys.exit("Not a rider submission")
def field(name):
    m=re.search(r"^### "+re.escape(name)+r"\s*\n(.*?)(?=\n### |\Z)",body,re.M|re.S)
    if not m: raise ValueError("Missing field "+name)
    return m.group(1).strip()
sec=field("Раздел").splitlines()[0].strip()
kind=field("Категория").splitlines()[0].strip()
types=[x.strip() for x in field("Типы").splitlines()[0].split(",")]
content=field("Требование").strip()
link=field("Ссылка").splitlines()[0].strip()
data_path=ROOT/"data/rider.json"
data=json.loads(data_path.read_text())
known={x["key"] for x in data["sections"]}
allowed={t[0] for t in data["types"]}
if sec not in known or kind not in ("must","rec","no") or not content or len(content)>3000: raise ValueError("Invalid requirement")
if not types or any(t not in allowed|{"all"} for t in types): raise ValueError("Invalid types")
if sec.startswith("6.") and (types!=[sec[2:]]): raise ValueError("Special requirements must match section type")
if link not in ("Нет","") and not link.startswith(("https://","http://")): raise ValueError("Invalid link")
rid="issue-"+str(issue["number"])
if any(r["id"]==rid for r in data["rules"]): sys.exit("Issue already published")
rule={"id":rid,"s":sec,"k":kind,"ty":types,"t":content,"f":[],"l":[{"t":"Материал","u":link}] if link not in ("Нет","") else []}
data["rules"].append(rule)
today=datetime.datetime.now(datetime.timezone.utc).strftime("%d.%m.%Y")
data["meta"]["date"]=today
log_path=ROOT/"data/changelog.json"
log=json.loads(log_path.read_text())
sec_title=next(x["title"] for x in data["sections"] if x["key"]==sec)
type_labels={t[0]:t[3] for t in data["types"]}
entry={"date":today,"action":"Добавлено","text":content[:160],"section":sec+" "+sec_title,"types":"Все типы" if "all" in types else ", ".join(type_labels[t] for t in types)}
log.insert(0,entry)
data_path.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")))
log_path.write_text(json.dumps(log,ensure_ascii=False,indent=1))
print("Published issue",issue["number"])
