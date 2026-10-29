"""
Downloads the Lula photos used by the experience from Wikimedia Commons into .cache/lula-raw/
and records their licence / author metadata in .cache/lula-raw/meta.json.

Every file below was checked to be under a free licence (CC BY 2.0, CC BY-SA 2.0/4.0).
Usage:  python scripts/fetch-lula.py
"""
import json, os, re, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, ".cache", "lula-raw")
UA = {"User-Agent": "brasil-ama-franca/1.0 (personal non-commercial project)"}

PICKS = {
    "jersey-full": ("File:06.06.2026 - Presidente Lula com camisa da Seleção Brasileir - 55319796941.jpg", 1400),
    "jersey-thumbs": ("File:06.06.2026 - Presidente Lula com camisa da Seleção Brasileir.jpg", 1600),
    "official-body": ("File:Foto oficial de Luiz Inácio Lula da Silva (corpo).jpg", 1400),
    "official-face": ("File:Foto oficial de Luiz Inácio Lula da Silva (rosto).jpg", 1250),
    "laugh": ("File:11.07.2023 - Conversa com o Presidente - 53038660439.jpg", 1400),
    "cap-thumb": ("File:12.09.2024 - Cerimônia de lançamento da Rede Alyne de Cuidado Integral a Gestantes e Bebês (53990543049).jpg", 1400),
    "fists": ("File:04.07.2023 - Cerimônia de assinatura do Protocolo de Intenções Itaipu MEC UNILA para retomada das obras do campus da Universidade Federal da Integração Latino-Americana (UNILA), e de posse da nova reitora (53025407988).jpg", 2000),
}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for name, (title, width) in PICKS.items():
        q = urllib.parse.urlencode({"action": "query", "format": "json", "titles": title, "prop": "imageinfo",
                                    "iiprop": "url|size|extmetadata", "iiurlwidth": width})
        page = next(iter(json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))["query"]["pages"].values()))
        ii = page["imageinfo"][0]
        m = ii["extmetadata"]
        clean = lambda k: re.sub(r"\s+", " ", re.sub("<[^>]+>", "", m.get(k, {}).get("value", ""))).strip()
        url = ii["thumburl"] if ii["width"] > width else ii["url"]
        ext = os.path.splitext(url.split("?")[0])[1].lower() or ".jpg"
        with open(os.path.join(OUT, name + ext), "wb") as f:
            f.write(get(url))
        meta[name] = {"title": title, "page": ii["descriptionurl"], "artist": clean("Artist"),
                      "license": clean("LicenseShortName"), "licenseUrl": clean("LicenseUrl"), "file": name + ext}
        print(f"{name:14s} {meta[name]['license']:12s} {meta[name]['artist']}")
    with open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
