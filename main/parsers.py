import re
import time
from typing import Dict, List

import requests
from bs4 import BeautifulSoup

CACHE_TTL_SECONDS = 10 * 60

_cache: Dict[str, Dict[str, object]] = {}


def _get_cached(key: str):
    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() - entry["ts"] < CACHE_TTL_SECONDS:
        return entry["value"]
    return None


def _set_cached(key: str, value):
    _cache[key] = {"ts": time.time(), "value": value}


def _parse_table_rates(html: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    rates: List[Dict[str, str]] = []
    seen = set()

    for row in soup.find_all("tr"):
        text = " ".join(row.stripped_strings)
        if not text:
            continue

        code_match = re.search(r"\b[A-Z]{3}\b", text)
        if not code_match:
            continue

        code = code_match.group(0)
        numbers = re.findall(r"\d+[\.,]\d+", text)
        if len(numbers) < 2:
            continue

        buy = numbers[0].replace(",", ".")
        sell = numbers[1].replace(",", ".")

        if code in seen:
            continue

        rates.append({"currency": code, "buy": buy, "sell": sell})
        seen.add(code)

    return rates


def fetch_kantor1913_rates() -> List[Dict[str, str]]:
    cached = _get_cached("kantor1913")
    if cached is not None:
        return cached

    url = "https://kantor1913.pl/kursy-warszawa"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    rates = _parse_table_rates(response.text)
    _set_cached("kantor1913", rates)
    return rates


def fetch_shitcoins_rates() -> List[Dict[str, str]]:
    cached = _get_cached("shitcoins")
    if cached is not None:
        return cached

    url = "https://shitcoins.club/getRates"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://shitcoins.club/",
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    data = response.json()
    rates: List[Dict[str, str]] = []
    for item in data if isinstance(data, list) else []:
        from_currency = item.get("fromCurrency", {}) or {}
        code = from_currency.get("name")
        to_currency = item.get("toCurrency")
        if not code or to_currency != "PLN":
            continue

        rate_ask = item.get("rateAsk")
        rate_bid = item.get("rateBid")
        if rate_ask is None or rate_bid is None:
            continue

        try:
            sell = f"{float(rate_ask):.4f}"
            buy = f"{float(rate_bid):.4f}"
        except (TypeError, ValueError):
            continue

        rates.append({"currency": code, "buy": buy, "sell": sell})

    _set_cached("shitcoins", rates)
    return rates


def get_rates(exchange_name: str) -> Dict[str, object]:
    if not exchange_name:
        return {"rates": [], "status": "missing_name"}

    if "Kantor 1913" in exchange_name:
        try:
            return {"rates": fetch_kantor1913_rates(), "status": "ok"}
        except Exception:
            return {"rates": [], "status": "fetch_error"}

    if "Shitcoins.club" in exchange_name:
        try:
            return {"rates": fetch_shitcoins_rates(), "status": "ok"}
        except Exception:
            return {"rates": [], "status": "fetch_error"}

    if "Coinswap" in exchange_name:
        return {"rates": [], "status": "needs_source"}

    if "Krypto Kotek" in exchange_name:
        return {"rates": [], "status": "needs_api"}

    if "Kassir" in exchange_name:
        return {"rates": [], "status": "needs_api"}

    if "Bitcoinwymiana" in exchange_name:
        return {"rates": [], "status": "needs_api"}

    return {"rates": [], "status": "no_parser"}
