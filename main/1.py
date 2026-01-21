from flask import Flask, render_template, jsonify
from pathlib import Path
import json

from parsers import get_rates

app = Flask(__name__)
EXCHANGES_FILE = (Path(__file__).resolve().parent / '..' / 'exchanges.json').resolve()

_cached_exchanges = []
_cached_mtime = None


def _load_exchanges():
    global _cached_exchanges, _cached_mtime
    try:
        mtime = EXCHANGES_FILE.stat().st_mtime
        if _cached_mtime == mtime:
            return _cached_exchanges
        with EXCHANGES_FILE.open('r', encoding='utf-8') as f:
            _cached_exchanges = json.load(f)
        _cached_mtime = mtime
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        _cached_exchanges = []
        _cached_mtime = None
    return _cached_exchanges

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/api/exchanges')
def api_exchanges():
    exchanges = _load_exchanges()
    # Возвращаем данные без курсов — просто имя и координаты
    simple_exchanges = []
    for ex in exchanges:
        rate_payload = get_rates(ex.get('name', ''))
        simple_exchanges.append({
            'name': ex.get('name'),
            'lat': ex.get('lat'),
            'lng': ex.get('lng'),
            'url': ex.get('url'),
            'rates': rate_payload.get('rates', []),
            'rate_status': rate_payload.get('status', 'unknown')
        })
    return jsonify(simple_exchanges)



if __name__ == '__main__':
    app.run(debug=True)
